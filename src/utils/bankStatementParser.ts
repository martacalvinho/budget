import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker source directly
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ParsedTransaction {
  dateRemoved: string;
  dateOfPurchase: string;
  type: 'COMPRA' | 'TRF' | 'DD' | 'PAG';
  cardNumber?: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
  users?: string[];
  category?: string;
  statementYear?: string;
}

const CARD_NUMBERS = {
  '3840': 'user1',
  '0363': 'user2'
};

export async function parseBankStatement(arrayBuffer: ArrayBuffer): Promise<ParsedTransaction[]> {
  console.log('Starting PDF parsing...');
  
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  console.log(`PDF loaded with ${pdf.numPages} pages`);

  // Extract statement date range
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  const text = textContent.items.map((item: any) => item.str).join(' ');
  const dateRangeMatch = text.match(/EXTRATO DE (\d{4})\/\d{2}\/\d{2}/);
  const statementYear = dateRangeMatch ? dateRangeMatch[1] : new Date().getFullYear().toString();

  let transactions: ParsedTransaction[] = [];

  // Helper function to parse amount strings
  const parseAmount = (amountStr: string): number => {
    // Remove any spaces and replace comma with dot
    const normalized = amountStr.replace(/\s+/g, '').replace(',', '.');
    return parseFloat(normalized);
  };

  // Helper function to extract card number and assign users
  const extractCardAndUsers = (description: string): { cardNumber?: string; users: string[] } => {
    const cardMatch = description.match(/\b(3840|0363)\b/);
    if (!cardMatch) return { users: [] };
    
    const cardNumber = cardMatch[1];
    const user = CARD_NUMBERS[cardNumber as keyof typeof CARD_NUMBERS];
    return {
      cardNumber,
      users: user ? [user] : []
    };
  };

  // Helper function to parse transaction line
  const TRANSACTION_REGEX = /(\d{2}\.\d{2})\s+(\d{2}\.\d{2})\s+(COMPRA|TRF|DD|PAG)\s+(.+?)\s+(\d+[.,]\d{2})\s+\d+\s+(\d+[.,]\d{2})\s*$/;
  const parseTransactionLine = (line: string): ParsedTransaction | null => {
    const match = line.match(TRANSACTION_REGEX);
    if (!match) return null;

    const [_, dateRemoved, dateOfPurchase, type, descriptionRaw, amountStr, balanceStr] = match;
    console.log('Parsing line:', {
      type,
      descriptionRaw,
      amountStr,
      balanceStr
    });

    const { cardNumber, users } = extractCardAndUsers(descriptionRaw);
    const amount = parseAmount(amountStr);
    const balance = parseAmount(balanceStr);

    // Normalize the description to handle multiple spaces
    const normalizedDesc = descriptionRaw.replace(/\s+/g, ' ').trim();

    // For MBWAY P/, convert the amount to negative since it's a payment
    if (normalizedDesc.includes('MB WAY P/')) {
      console.log('Found MBWAY payment, setting as debit:', amount);
      return {
        dateRemoved,
        dateOfPurchase,
        description: descriptionRaw.trim(),
        debit: amount,
        credit: undefined,
        balance,
        users,
        cardNumber,
        statementYear
      };
    }

    // For MBWAY DE, keep as positive since it's money received
    if (normalizedDesc.includes('MB WAY DE')) {
      console.log('Found MBWAY income, setting as credit:', amount);
      return {
        dateRemoved,
        dateOfPurchase,
        description: descriptionRaw.trim(),
        debit: undefined,
        credit: amount,
        balance,
        users,
        cardNumber,
        statementYear
      };
    }

    // Handle savings transfers
    if (normalizedDesc.startsWith('PT61114457 MGAM')) {
      console.log('Found savings transfer:', amount);
      return {
        dateRemoved,
        dateOfPurchase,
        description: descriptionRaw.trim(),
        debit: amount,  // Mark as debit since it's money moving to savings
        credit: undefined,
        balance,
        users,
        cardNumber,
        category: 'Savings',  // Auto-categorize as savings
        statementYear
      };
    }

    // Handle rent payments (always debit)
    if (normalizedDesc.includes('PT96113730 MG')) {
      console.log('Found rent payment, setting as debit:', amount);
      return {
        dateRemoved,
        dateOfPurchase,
        description: descriptionRaw.trim(),
        debit: amount,
        credit: undefined,
        balance,
        users,
        cardNumber,
        statementYear
      };
    }

    // Handle other transactions normally
    const isDebit = type === 'COMPRA' || type === 'PAG';
    return {
      dateRemoved,
      dateOfPurchase,
      description: descriptionRaw.trim(),
      debit: isDebit ? amount : undefined,
      credit: !isDebit ? amount : undefined,
      balance,
      users,
      cardNumber,
      statementYear
    };
  };

  // Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Sort items by y-position (descending) and x-position (ascending)
    const sortedItems = textContent.items
      .map((item: any) => ({
        str: item.str.trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5])
      }))
      .sort((a, b) => {
        if (Math.abs(a.y - b.y) < 2) return a.x - b.x;
        return b.y - a.y;
      });

    // Process each line
    let currentLine = '';
    let lastY = null;
    
    for (const item of sortedItems) {
      if (lastY !== null && Math.abs(item.y - lastY) > 2) {
        // Process completed line
        const transaction = parseTransactionLine(currentLine);
        if (transaction) {
          transactions.push(transaction);
        }
        currentLine = '';
      }
      
      currentLine += (currentLine ? ' ' : '') + item.str;
      lastY = item.y;
    }
    
    // Process last line
    if (currentLine) {
      const transaction = parseTransactionLine(currentLine);
      if (transaction) {
        transactions.push(transaction);
      }
    }
  }

  // Update balances (assuming they're in reverse chronological order)
  let currentBalance = transactions[0]?.balance || 0;
  for (let i = 1; i < transactions.length; i++) {
    const tx = transactions[i];
    if (tx.debit) {
      currentBalance -= tx.debit;
    }
    if (tx.credit) {
      currentBalance += tx.credit;
    }
    transactions[i].balance = currentBalance;
  }

  console.log('Parsed transactions:', transactions);
  return transactions;
}
