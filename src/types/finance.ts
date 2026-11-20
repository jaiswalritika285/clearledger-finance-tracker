export type TransactionType = 'income' | 'expense';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';

export type NavSection = 'overview' | 'transactions' | 'budgets' | 'accounts' | 'settings';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  startingBalance: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  description: string;
  notes?: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
}

export interface RecurringRule {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  category: string;
  accountId: string;
  cadence: 'monthly' | 'biweekly' | 'weekly';
  dayOfMonth: number;
  lastPostedDate?: string;
}

export interface FinanceState {
  currency: CurrencyCode;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  recurring: RecurringRule[];
}
