import { useMemo, useState, type FormEvent } from 'react';
import { CalendarCheck, Landmark, Plus, Trash2 } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/seedData';
import type {
  Account,
  AccountType,
  CurrencyCode,
  RecurringRule,
  TransactionType,
} from '../types/finance';
import { formatCurrency, formatShortDate } from '../utils/format';

interface AccountsRecurringViewProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  totalNetWorth: number;
  recurring: RecurringRule[];
  currency: CurrencyCode;
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onAddRecurring: (rule: Omit<RecurringRule, 'id'>) => void;
  onPostRecurring: (ruleId: string) => void;
  onDeleteRecurring: (id: string) => void;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit Card',
  cash: 'Cash',
};

export function AccountsRecurringView({
  accounts,
  accountBalances,
  totalNetWorth,
  recurring,
  currency,
  onAddAccount,
  onDeleteAccount,
  onAddRecurring,
  onPostRecurring,
  onDeleteRecurring,
}: AccountsRecurringViewProps) {
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('checking');
  const [accInstitution, setAccInstitution] = useState('');
  const [accBalance, setAccBalance] = useState('0');

  const [recTitle, setRecTitle] = useState('');
  const [recType, setRecType] = useState<TransactionType>('expense');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [recAccountId, setRecAccountId] = useState<string>(accounts[0]?.id ?? '');
  const [recDay, setRecDay] = useState('1');

  const accountMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const acc of accounts) map[acc.id] = acc.name;
    return map;
  }, [accounts]);

  const handleCreateAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    const balance = parseFloat(accBalance || '0');
    onAddAccount({
      name: accName.trim(),
      type: accType,
      institution: accInstitution.trim() || 'Personal',
      startingBalance: Number.isNaN(balance) ? 0 : Math.round(balance * 100) / 100,
    });
    setAccName('');
    setAccInstitution('');
    setAccBalance('0');
  };

  const handleCreateRecurring = (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(recAmount);
    const day = Math.min(28, Math.max(1, parseInt(recDay, 10) || 1));
    if (!recTitle.trim() || Number.isNaN(amt) || amt <= 0) return;
    onAddRecurring({
      title: recTitle.trim(),
      type: recType,
      amount: Math.round(amt * 100) / 100,
      category: recCategory,
      accountId: recAccountId || accounts[0]?.id || '',
      cadence: 'monthly',
      dayOfMonth: day,
    });
    setRecTitle('');
    setRecAmount('');
  };

  const recCategories = recType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Accounts & Recurring Bills
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
          Combined Net Worth {formatCurrency(totalNetWorth, currency)} across {accounts.length}{' '}
          accounts
        </p>
      </div>

      {/* Accounts Section */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Linked Wallets & Accounts
            </h2>
          </div>

          <form onSubmit={handleCreateAccount} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Account name"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              aria-label="Account name"
              className="w-36 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
            <select
              value={accType}
              onChange={(e) => setAccType(e.target.value as AccountType)}
              aria-label="Account type"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit Card</option>
              <option value="cash">Cash</option>
            </select>
            <input
              type="text"
              placeholder="Institution"
              value={accInstitution}
              onChange={(e) => setAccInstitution(e.target.value)}
              aria-label="Financial institution"
              className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Opening $"
              value={accBalance}
              onChange={(e) => setAccBalance(e.target.value)}
              aria-label="Opening balance"
              className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-medium whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Account</span>
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          {accounts.map((acc) => {
            const balance = accountBalances[acc.id] ?? acc.startingBalance;
            return (
              <div key={acc.id} className="p-5 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {acc.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {ACCOUNT_TYPE_LABELS[acc.type]} · {acc.institution}
                    </p>
                  </div>
                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteAccount(acc.id)}
                      aria-label={`Remove ${acc.name}`}
                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p
                  className={`text-xl font-semibold font-mono tabular-nums ${
                    balance < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {formatCurrency(balance, currency)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recurring Bills & Income */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recurring Bills & Payroll
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Post scheduled monthly entries directly to your ledger
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateRecurring} className="flex flex-wrap items-center gap-2">
            <select
              value={recType}
              onChange={(e) => {
                const next = e.target.value as TransactionType;
                setRecType(next);
                setRecCategory(next === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
              }}
              aria-label="Recurring entry type"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="expense">Bill</option>
              <option value="income">Income</option>
            </select>
            <input
              type="text"
              placeholder="Title (e.g. Internet)"
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              aria-label="Recurring title"
              className="w-36 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={recAmount}
              onChange={(e) => setRecAmount(e.target.value)}
              aria-label="Recurring amount"
              className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
            <select
              value={recCategory}
              onChange={(e) => setRecCategory(e.target.value)}
              aria-label="Recurring category"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {recCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={recAccountId}
              onChange={(e) => setRecAccountId(e.target.value)}
              aria-label="Recurring account"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="28"
              value={recDay}
              onChange={(e) => setRecDay(e.target.value)}
              aria-label="Day of month"
              title="Day of month (1-28)"
              className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-medium whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Schedule</span>
            </button>
          </form>
        </div>

        {recurring.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No recurring bills or income templates saved.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recurring.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {rule.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {rule.category} · {accountMap[rule.accountId] ?? 'Account'} · Monthly on day{' '}
                    <span className="font-mono tabular-nums">{rule.dayOfMonth}</span>
                    {rule.lastPostedDate && (
                      <>
                        {' '}
                        · Last posted{' '}
                        <span className="font-mono tabular-nums">
                          {formatShortDate(rule.lastPostedDate)}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-mono tabular-nums font-medium ${
                      rule.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {rule.type === 'income' ? '+' : '-'}
                    {formatCurrency(rule.amount, currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPostRecurring(rule.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    Post Now
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRecurring(rule.id)}
                    aria-label={`Delete ${rule.title}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
