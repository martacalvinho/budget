export type TransactionCategory =
  | 'Purchase'
  | 'Money Sent'
  | 'Money Received'
  | 'Groceries'
  | 'Healthcare'
  | 'Fuel'
  | 'Restaurant'
  | 'Uncategorized';

interface CategoryRule {
  pattern: RegExp;
  category: (description: string, isDebit: boolean) => TransactionCategory;
}

const GROCERY_STORES = [
  'CONTINENTE',
  'PINGO DOCE',
  'ALDI',
  'LIDL',
  'AUCHAN',
  'MINIPRECO'
];

const HEALTHCARE_PROVIDERS = [
  'FARMACIA',
  'LUSIADAS',
  'WELLS',
  'CLINICA',
  'HOSPITAL'
];

const FUEL_STATIONS = [
  'GALP',
  'REPSOL',
  'BP',
  'CEPSA'
];

// Helper function to create a case-insensitive pattern for multiple terms
const createPattern = (terms: string[]): RegExp => {
  const pattern = terms.map(term => term.replace(/\s+/g, '\\s+')).join('|');
  return new RegExp(pattern, 'i');
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    pattern: createPattern(GROCERY_STORES),
    category: () => 'Groceries'
  },
  {
    pattern: createPattern(HEALTHCARE_PROVIDERS),
    category: () => 'Healthcare'
  },
  {
    pattern: createPattern(FUEL_STATIONS),
    category: () => 'Fuel'
  },
  {
    // Generic purchase (if no specific category matches)
    pattern: /COMPRA/i,
    category: () => 'Purchase'
  },
  {
    pattern: /MB WAY|TRF MB WAY/i,
    category: (_, isDebit) => isDebit ? 'Money Sent' : 'Money Received'
  },
  {
    // Restaurant heuristics - common patterns in restaurant names
    pattern: /REST|RESTAURANTE|CAFE|CAFETARIA|PADARIA|PASTELARIA|PIZZARIA|HAMBURGUER/i,
    category: () => 'Restaurant'
  }
];

export function categorizeTransaction(description: string, amount: number): TransactionCategory {
  const isDebit = amount < 0;
  
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(description)) {
      return rule.category(description, isDebit);
    }
  }
  
  return 'Uncategorized';
}

// Export constants for use in other parts of the application
export const KNOWN_GROCERY_STORES = GROCERY_STORES;
export const KNOWN_HEALTHCARE_PROVIDERS = HEALTHCARE_PROVIDERS;
export const KNOWN_FUEL_STATIONS = FUEL_STATIONS;
