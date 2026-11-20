import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/seedData';
import type { Account, Transaction, TransactionType } from '../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  accounts: Account[];
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>, existingId?: string) => void;
}

export function TransactionModal({
  isOpen,
  editingTransaction,
  accounts,
  onClose,
  onSave,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[1]);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? '');
  const [date, setDate] = useState('2026-11-20');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.accountId);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setNotes(editingTransaction.notes ?? '');
      setError('');
    } else {
      setType('expense');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[1]);
      setAccountId(accounts[0]?.id ?? '');
      setDate('2026-11-20');
      setDescription('');
      setNotes('');
      setError('');
    }
  }, [isOpen, editingTransaction, accounts]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    const validList: readonly string[] =
      nextType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!validList.includes(category)) {
      setCategory(validList[0]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setError('Enter a short description or merchant name.');
      return;
    }
    if (!date) {
      setError('Select a valid date.');
      return;
    }

    onSave(
      {
        type,
        amount: Math.round(numericAmount * 100) / 100,
        category,
        accountId: accountId || accounts[0]?.id || 'acc-checking',
        date,
        description: description.trim(),
        notes: notes.trim() || undefined,
      },
      editingTransaction?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="tx-modal-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                type === 'expense'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                type === 'income'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Amount
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-desc"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Description / Merchant
            </label>
            <input
              id="tx-desc"
              type="text"
              placeholder="e.g. Trader Joe’s Market or Payroll"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Category
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tx-account"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Account
              </label>
              <select
                id="tx-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-notes"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Notes (optional)
            </label>
            <input
              id="tx-notes"
              type="text"
              placeholder="Invoice number, receipt memo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors whitespace-nowrap"
            >
              {editingTransaction ? 'Save Changes' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
