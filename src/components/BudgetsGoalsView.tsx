import { useMemo, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../data/seedData';
import type { Account, Budget, CurrencyCode, SavingsGoal, Transaction } from '../types/finance';
import { formatCurrency, formatMonthLabel, formatShortDate, getMonthKey } from '../utils/format';

interface BudgetsGoalsViewProps {
  budgets: Budget[];
  goals: SavingsGoal[];
  transactions: Transaction[];
  accounts: Account[];
  currency: CurrencyCode;
  selectedMonth: string;
  onUpsertBudget: (category: string, monthlyLimit: number) => void;
  onDeleteBudget: (id: string) => void;
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onContributeGoal: (goalId: string, amount: number, accountId?: string) => void;
  onDeleteGoal: (id: string) => void;
}

export function BudgetsGoalsView({
  budgets,
  goals,
  transactions,
  accounts,
  currency,
  selectedMonth,
  onUpsertBudget,
  onDeleteBudget,
  onAddGoal,
  onContributeGoal,
  onDeleteGoal,
}: BudgetsGoalsViewProps) {
  const [budgetCategory, setBudgetCategory] = useState<string>(EXPENSE_CATEGORIES[1]);
  const [budgetLimit, setBudgetLimit] = useState('');

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalDate, setGoalDate] = useState('2027-06-01');

  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribAccountId, setContribAccountId] = useState<string>(accounts[0]?.id ?? '');

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'expense' && getMonthKey(tx.date) === selectedMonth) {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
      }
    }
    return map;
  }, [transactions, selectedMonth]);

  const budgetRows = useMemo(() => {
    return budgets.map((b) => {
      const spent = spentByCategory[b.category] ?? 0;
      const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      return { ...b, spent, pct, remaining: b.monthlyLimit - spent };
    });
  }, [budgets, spentByCategory]);

  const totalBudgeted = useMemo(
    () => budgetRows.reduce((s, b) => s + b.monthlyLimit, 0),
    [budgetRows]
  );
  const totalBudgetSpent = useMemo(
    () => budgetRows.reduce((s, b) => s + b.spent, 0),
    [budgetRows]
  );

  const handleSaveBudget = (e: FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimit);
    if (Number.isNaN(limit) || limit <= 0) return;
    onUpsertBudget(budgetCategory, Math.round(limit * 100) / 100);
    setBudgetLimit('');
  };

  const handleAddGoal = (e: FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget);
    const current = parseFloat(goalCurrent || '0');
    if (!goalName.trim() || Number.isNaN(target) || target <= 0) return;
    onAddGoal({
      name: goalName.trim(),
      targetAmount: Math.round(target * 100) / 100,
      currentAmount: Number.isNaN(current) ? 0 : Math.max(0, Math.round(current * 100) / 100),
      targetDate: goalDate || '2027-12-31',
    });
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('0');
  };

  const handleConfirmContrib = (goalId: string) => {
    const amt = parseFloat(contribAmount);
    if (Number.isNaN(amt) || amt <= 0) return;
    onContributeGoal(goalId, Math.round(amt * 100) / 100, contribAccountId || undefined);
    setContributingGoalId(null);
    setContribAmount('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Budgets & Savings Goals
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Category limits for {formatMonthLabel(selectedMonth)} and long-term reserve targets
        </p>
      </div>

      {/* Monthly Budgets Section */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Monthly Category Budgets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              {formatCurrency(totalBudgetSpent, currency)} spent of{' '}
              {formatCurrency(totalBudgeted, currency)} allocated
            </p>
          </div>

          <form onSubmit={handleSaveBudget} className="flex flex-wrap items-center gap-2">
            <select
              value={budgetCategory}
              onChange={(e) => setBudgetCategory(e.target.value)}
              aria-label="Budget category"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="1"
              min="1"
              placeholder="Monthly cap"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              aria-label="Monthly budget limit"
              className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-medium whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Set Limit</span>
            </button>
          </form>
        </div>

        {budgetRows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No monthly budgets set. Use the form above to assign spending limits by category.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {budgetRows.map((b) => {
              const isOver = b.pct > 100;
              const isWarning = b.pct >= 80 && b.pct <= 100;
              return (
                <div key={b.id} className="px-6 py-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {b.category}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isOver
                            ? 'text-red-600 dark:text-red-400'
                            : isWarning
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isOver
                          ? `Over by ${formatCurrency(b.spent - b.monthlyLimit, currency)}`
                          : isWarning
                            ? `${b.pct.toFixed(0)}% used · Near limit`
                            : `${formatCurrency(b.remaining, currency)} remaining`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {formatCurrency(b.spent, currency)} /{' '}
                        {formatCurrency(b.monthlyLimit, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteBudget(b.id)}
                        aria-label={`Remove ${b.category} budget`}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Savings Goals Section */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Savings Goals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dedicated reserves and milestone targets
            </p>
          </div>

          <form onSubmit={handleAddGoal} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Goal name"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              aria-label="Savings goal name"
              className="w-36 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Target $"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              aria-label="Target amount"
              className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              required
            />
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Saved $"
              value={goalCurrent}
              onChange={(e) => setGoalCurrent(e.target.value)}
              aria-label="Starting saved amount"
              className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              aria-label="Target date"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-medium whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Goal</span>
            </button>
          </form>
        </div>

        {goals.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No savings goals created yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {goals.map((g) => {
              const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              const isContributing = contributingGoalId === g.id;
              return (
                <div key={g.id} className="px-6 py-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {g.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                        Target date {formatShortDate(g.targetDate)} · {pct.toFixed(1)}% funded
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(g.currentAmount, currency)} /{' '}
                        {formatCurrency(g.targetAmount, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setContributingGoalId(isContributing ? null : g.id);
                          setContribAmount('');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                      >
                        Contribute
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(g.id)}
                        aria-label={`Delete ${g.name}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  {isContributing && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Amount"
                        value={contribAmount}
                        onChange={(e) => setContribAmount(e.target.value)}
                        aria-label="Contribution amount"
                        className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <select
                        value={contribAccountId}
                        onChange={(e) => setContribAccountId(e.target.value)}
                        aria-label="Source account"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            From {acc.name}
                          </option>
                        ))}
                        <option value="">External deposit (no ledger debit)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleConfirmContrib(g.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium whitespace-nowrap"
                      >
                        Confirm Deposit
                      </button>
                      <button
                        type="button"
                        onClick={() => setContributingGoalId(null)}
                        className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
