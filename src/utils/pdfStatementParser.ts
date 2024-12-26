// pdfStatementParser.ts

import { getDocument } from 'pdfjs-dist';

/********************************
 * 1) Transaction Interface
 ********************************/
export interface Transaction {
  type: string;       // e.g. "COMPRA", "TRF", "DD", "TRANSFERENCIA"
  details: string[];  // lines belonging to this transaction
  amounts: number[];  // numeric values found in those lines
}

/********************************
 * 2) parsePdfLines Function
 *    (Identifies transaction blocks in text lines)
 ********************************/
function parsePdfLines(pdfLines: string[]): Transaction[] {
  const transactionKeywords = ["COMPRA", "DD", "TRF", "TRANSFERENCIA"];

  const transactions: Transaction[] = [];
  let current: Transaction | null = null;

  // Helper to extract numeric values (e.g. "19", "28.24") from a line
  function extractNumbers(line: string): number[] {
    const floatRegex = /\d+\.\d+|\d+/g;
    const matches = line.match(floatRegex);
    if (!matches) return [];
    return matches.map((m) => parseFloat(m));
  }

  for (let i = 0; i < pdfLines.length; i++) {
    const rawLine = pdfLines[i].trim();
    const uppercaseLine = rawLine.toUpperCase();

    // Does this line *include* any known transaction keyword?
    const foundKeyword = transactionKeywords.find(keyword =>
      uppercaseLine.includes(keyword.toUpperCase())
    );

    if (foundKeyword) {
      // Finish the previous transaction, if any
      if (current) {
        transactions.push(current);
      }
      // Start a new transaction
      current = {
        type: foundKeyword,
        details: [],
        amounts: [],
      };
    } else if (current) {
      // Accumulate lines & parse amounts
      current.details.push(rawLine);
      const nums = extractNumbers(rawLine);
      current.amounts.push(...nums);
    }
  }

  // End of file: if we have a transaction in progress, push it
  if (current) {
    transactions.push(current);
  }

  return transactions;
}

/********************************
 * 3) parsePDF Function
 *    (Uses PDF.js to extract lines from a PDF, then parse transactions)
 ********************************/
export async function parsePDF(arrayBuffer: ArrayBuffer): Promise<Transaction[]> {
  // 1) Load the PDF with PDF.js
  const loadingTask = getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let allText = '';

  // 2) Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    // Combine all text from items
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    allText += pageText + '\n';
  }

  // 3) Convert to line array
  const linesFromPdf = allText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  // 4) Parse the lines for transactions
  const transactions = parsePdfLines(linesFromPdf);

  return transactions;
}


