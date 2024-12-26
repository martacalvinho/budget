import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker source directly
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface ParsedTransaction {
  date: string;
  type: string;
  cardNumber?: string;
  description: string;
  amount: number;
  balance: number;
}

export async function parseBankStatement(arrayBuffer: ArrayBuffer): Promise<ParsedTransaction[]> {
  console.log('Starting PDF parsing...');
  
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  console.log(`PDF loaded with ${pdf.numPages} pages`);

  const transactions: ParsedTransaction[] = [];

  // Helper function to parse amount strings
  const parseAmount = (amountStr: string): number => {
    // Remove any spaces and replace comma with dot
    const normalized = amountStr.replace(/\s+/g, '').replace(',', '.');
    return parseFloat(normalized);
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

    // Combine items into lines
    let currentLine = '';
    let lastY = null;
    let lines: string[] = [];

    for (const item of sortedItems) {
      if (lastY === null || Math.abs(item.y - lastY) < 2) {
        currentLine += (currentLine ? ' ' : '') + item.str;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = item.str;
      }
      lastY = item.y;
    }
    if (currentLine) lines.push(currentLine);

    // Process each line
    let isTransactionSection = false;
    for (const line of lines) {
      // Check for transaction section header
      if (line.includes('DESCRITIVO') && line.includes('DEBITO') && line.includes('CREDITO') && line.includes('SALDO')) {
        isTransactionSection = true;
        continue;
      }

      // Skip if not in transaction section or if it's a header/footer line
      if (!isTransactionSection || 
          line.includes('SALDO INICIAL') || 
          line.includes('SALDO FINAL') || 
          line.includes('A TRANSPORTAR') ||
          line.includes('TRANSPORTE') ||
          !line.trim()) {
        continue;
      }

      try {
        // Match date pattern at start of line (DD.DD DD.DD)
        const dateMatch = line.match(/^(\d{2}\.\d{2})\s+(\d{2}\.\d{2})/);
        if (!dateMatch) continue;

        // Extract transaction components
        const parts = line.split(/\s+/);
        const date = parts[1]; // Use value date
        
        // Find transaction type and description
        let type = 'OUTROS';
        let description = '';
        let cardNumber: string | undefined;

        // Look for transaction type keywords
        if (line.includes('COMPRA')) {
          type = 'COMPRA';
          const cardMatch = parts.find(p => /^\d{4}$/.test(p));
          if (cardMatch) cardNumber = cardMatch;
        } else if (line.includes('TRF')) {
          type = 'TRF';
        } else if (line.includes('DD')) {
          type = 'DD';
        } else if (line.includes('PAG')) {
          type = 'PAG';
        }

        // Extract description (everything between type and amounts)
        const typeIndex = parts.findIndex(p => p === type);
        description = parts.slice(typeIndex + 1)
          .filter(p => {
            // Don't include numbers that look like amounts or dates
            return !/^\d+(?:\s*\d{3})*(?:[.,]\d{2})?$/.test(p) && !/^\d{2}\.\d{2}$/.test(p);
          })
          .join(' ')
          .replace(/CONTACTLESS$/, '')
          .trim();

        // Find amounts by looking for numbers in the correct positions
        // We specifically look for numbers that have exactly 2 decimal places
        const numbers = line.match(/\d+(?:\s*\d{3})*,\d{2}(?!\d)/g) || [];
        console.log('Found numbers in line:', numbers);

        if (numbers.length > 0) {
          // The last number is always the balance
          const balance = parseAmount(numbers[numbers.length - 1]);
          
          // For transactions, look at the position of numbers in the DEBITO/CREDITO columns
          let amount = 0;
          
          if (type === 'COMPRA' || type === 'DD') {
            // For purchases and direct debits, look in the DEBITO column
            // The debit amount should be in the middle of the line, not at the start
            const debitAmount = numbers.find((num, index) => {
              // Skip the first few numbers (dates) and the last number (balance)
              return index > 0 && index < numbers.length - 1;
            });
            if (debitAmount) {
              amount = -parseAmount(debitAmount);
            }
          } else if (type === 'TRF' || type === 'PAG') {
            // For transfers and payments, check both DEBITO and CREDITO columns
            if (numbers.length > 1) {
              const amountStr = numbers[numbers.length - 2];
              amount = line.includes('DEBITO') ? -parseAmount(amountStr) : parseAmount(amountStr);
            }
          }

          transactions.push({
            date,
            type,
            cardNumber,
            description,
            amount,
            balance
          });
        }
      } catch (error) {
        console.error('Error processing line:', error);
      }
    }
  }

  console.log(`Found ${transactions.length} transactions`);
  return transactions.sort((a, b) => {
    const [dayA, monthA] = a.date.split('.');
    const [dayB, monthB] = b.date.split('.');
    return new Date(2024, parseInt(monthA) - 1, parseInt(dayA)).getTime() -
           new Date(2024, parseInt(monthB) - 1, parseInt(dayB)).getTime();
  });
}
