import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
} from 'lucide-react';
import type { Account, Budget, CurrencyCode, Transaction } from '../types/finance';
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLabel,
  formatShortDate,
  formatShortMonth,
  getMonthKey,
  shiftMonthKey,
} from '../utils/format';

interface OverviewViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  accounts: Account[];
  currency: CurrencyCode;
  selectedMonth: string;
  onChangeMonth: (monthKey: string) => void;
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onNavigateTransactions: () => void;
  onNavigateBudgets: () => void;
}

export function OverviewView({
  transactions,
  budgets,
  accounts,
  currency,
  selectedMonth,
  onChangeMonth,
  onAddTransaction,
  onEditTransaction,
  onNavigateTransactions,
  onNavigateBudgets,
}: OverviewViewProps) {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const accountMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const acc of accounts) map[acc.id] = acc.name;
    return map;
  }, [accounts]);

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => getMonthKey(t.date) === selectedMonth);
  }, [transactions, selectedMonth]);

  const prevMonthKey = useMemo(() => shiftMonthKey(selectedMonth, -1), [selectedMonth]);

  const prevMonthTransactions = useMemo(() => {
    return transactions.filter((t) => getMonthKey(t.date) === prevMonthKey);
  }, [transactions, prevMonthKey]);

  const stats = useMemo(() => {
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const prevIncome = prevMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const prevExpense = prevMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeDelta = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : null;
    const expenseDelta = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : null;

    return { income, expense, net, savingsRate, incomeDelta, expenseDelta };
  }, [monthTransactions, prevMonthTransactions]);

  // 6-month trend ending at selectedMonth
  const sixMonthSeries = useMemo(() => {
    const keys: string[] = [];
    for (let i = -5; i <= 0; i++) {
      keys.push(shiftMonthKey(selectedMonth, i));
    }
    return keys.map((key) => {
      const txs = transactions.filter((t) => getMonthKey(t.date) === key);
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        key,
        label: formatShortMonth(key),
        income,
        expense,
        net: income - expense,
      };
    });
  }, [transactions, selectedMonth]);

  const maxChartValue = useMemo(() => {
    const peak = sixMonthSeries.reduce(
      (max, m) => Math.max(max, m.income, m.expense),
      0
    );
    return peak > 0 ? Math.ceil(peak * 1.15) : 1000;
  }, [sixMonthSeries]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of monthTransactions) {
      if (tx.type !== 'expense') continue;
      map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
    }
    const entries = Object.entries(map)
      .map(([category, spent]) => ({ category, spent }))
      .sort((a, b) => b.spent - a.spent);
    const total = entries.reduce((sum, e) => sum + e.spent, 0);
    return entries.map((e) => ({
      ...e,
      pct: total > 0 ? (e.spent / total) * 100 : 0,
    }));
  }, [monthTransactions]);

  const budgetAlerts = useMemo(() => {
    const spentByCategory: Record<string, number> = {};
    for (const tx of monthTransactions) {
      if (tx.type === 'expense') {
        spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount;
      }
    }
    return budgets
      .map((b) => {
        const spent = spentByCategory[b.category] ?? 0;
        const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
        return { ...b, spent, pct };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  }, [budgets, monthTransactions]);

  const recentTransactions = useMemo(() => {
    return [...monthTransactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  }, [monthTransactions]);

  const activeHoverDatum =
    sixMonthSeries.find((m) => m.key === hoveredMonth) ??
    sixMonthSeries[sixMonthSeries.length - 1];

  return (
    <div className="space-y-6">
      {/* Workspace Period Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Financial Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatMonthLabel(selectedMonth)} · {monthTransactions.length} recorded entries
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonthKey(selectedMonth, -1))}
            aria-label="Previous month"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap min-w-[140px] text-center">
            {formatMonthLabel(selectedMonth)}
          </span>
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonthKey(selectedMonth, 1))}
            aria-label="Next month"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4-Column Summary Strip (Single Elevation, Hairline Dividers) */}
      <section
        aria-label="Monthly summary metrics"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Net Cash Flow
          </p>
          <p
            className={`mt-2 text-2xl font-semibold font-mono tabular-nums ${
              stats.net >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {stats.net >= 0 ? '+' : ''}
            {formatCurrency(stats.net, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {stats.net >= 0 ? 'Surplus retained this month' : 'Deficit drawn from reserves'}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Monthly Income
          </p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(stats.income, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {stats.incomeDelta === null
              ? 'No prior month baseline'
              : `${stats.incomeDelta >= 0 ? '+' : ''}${stats.incomeDelta.toFixed(1)}% vs prior month`}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Monthly Expenses
          </p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            -{formatCurrency(stats.expense, currency)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {stats.expenseDelta === null
              ? 'No prior month baseline'
              : `${stats.expenseDelta >= 0 ? '+' : ''}${stats.expenseDelta.toFixed(1)}% vs prior month`}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Savings Rate
          </p>
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {stats.savingsRate.toFixed(1)}%
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {stats.savingsRate >= 20
              ? 'Healthy · Above 20% target'
              : stats.savingsRate >= 0
                ? 'Moderate · Below 20% target'
                : 'Negative · Spending exceeds income'}
          </p>
        </div>
      </section>

      {/* Main Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 6-Month Cash Flow Bar Chart */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                6-Month Cash Flow
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Income vs. expenses ending {formatMonthLabel(selectedMonth)}
              </p>
            </div>

            {activeHoverDatum && (
              <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
                <span className="text-slate-500 dark:text-slate-400">
                  {formatMonthLabel(activeHoverDatum.key)}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  In {formatCompactCurrency(activeHoverDatum.income, currency)}
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  Out {formatCompactCurrency(activeHoverDatum.expense, currency)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="relative h-56 flex items-end justify-between gap-3 pt-6">
              {/* Horizontal reference lines */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between"
              >
                {[1, 0.5, 0].map((ratio) => (
                  <div
                    key={ratio}
                    className="w-full border-b border-dashed border-slate-200 dark:border-slate-800 relative"
                  >
                    <span className="absolute -top-4 left-0 text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                      {formatCompactCurrency(maxChartValue * ratio, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {sixMonthSeries.map((item) => {
                const incomeHeight = Math.max(
                  item.income > 0 ? 4 : 0,
                  (item.income / maxChartValue) * 100
                );
                const expenseHeight = Math.max(
                  item.expense > 0 ? 4 : 0,
                  (item.expense / maxChartValue) * 100
                );
                const isSelected = item.key === selectedMonth;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onChangeMonth(item.key)}
                    onMouseEnter={() => setHoveredMonth(item.key)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="relative z-10 flex-1 h-full flex flex-col justify-end items-center group focus:outline-none"
                  >
                    <div className="w-full flex-1 flex items-end justify-center gap-1.5 pb-2 pt-2">
                      <div
                        className={`w-4 sm:w-5 rounded-t transition-opacity ${
                          isSelected
                            ? 'bg-emerald-600 dark:bg-emerald-500'
                            : 'bg-emerald-600/75 group-hover:bg-emerald-600 dark:bg-emerald-500/70 dark:group-hover:bg-emerald-400'
                        }`}
                        style={{ height: `${Math.min(100, incomeHeight)}%` }}
                        title={`${item.label} Income: ${formatCurrency(item.income, currency)}`}
                      />
                      <div
                        className={`w-4 sm:w-5 rounded-t transition-opacity ${
                          isSelected
                            ? 'bg-slate-800 dark:bg-slate-200'
                            : 'bg-slate-300 group-hover:bg-slate-500 dark:bg-slate-700 dark:group-hover:bg-slate-500'
                        }`}
                        style={{ height: `${Math.min(100, expenseHeight)}%` }}
                        title={`${item.label} Expense: ${formatCurrency(item.expense, currency)}`}
                      />
                    </div>
                    <span
                      className={`text-xs font-mono tabular-nums pt-1 ${
                        isSelected
                          ? 'font-semibold text-slate-900 dark:text-slate-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
                  Income
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-slate-800 dark:bg-slate-200" />
                  Expenses
                </span>
              </div>
              <span>Click any bar to inspect month</span>
            </div>
          </div>
        </section>

        {/* Spending by Category */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Spending by Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Share of monthly outflow
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {formatCurrency(stats.expense, currency)}
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No expenses recorded for {formatMonthLabel(selectedMonth)}.
              </p>
              <button
                type="button"
                onClick={onAddTransaction}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              >
                <Plus className="h-3.5 w-3.5" />
                Log Expense
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3.5 flex-1">
              {categoryBreakdown.slice(0, 6).map((row) => (
                <div key={row.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {row.category}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatCurrency(row.spent, currency)} · {row.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-800 dark:bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.max(3, row.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bottom Grid: Recent Ledger + Budget Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recent Transactions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Latest activity in {formatMonthLabel(selectedMonth)}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateTransactions}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap"
            >
              View full ledger
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No transactions recorded for this month yet.
              </p>
              <button
                type="button"
                onClick={onAddTransaction}
                className="mt-3 px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white dark:bg-emerald-600"
              >
                Add First Entry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {tx.description}
                      </p>
                    </div>
                    <p className="mt-0.5 pl-6 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {tx.category} · {accountMap[tx.accountId] ?? 'Account'} ·{' '}
                      <span className="font-mono tabular-nums">{formatShortDate(tx.date)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-medium font-mono tabular-nums ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      aria-label={`Edit ${tx.description}`}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Budget Watchlist */}
        <section className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Budget Pacing
              </h2>
              <button
                type="button"
                onClick={onNavigateBudgets}
                className="text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white underline-offset-4 hover:underline whitespace-nowrap"
              >
                Manage
              </button>
            </div>

            {budgetAlerts.length === 0 ? (
              <p className="py-8 text-xs text-slate-500 dark:text-slate-400 text-center">
                No monthly budgets configured.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {budgetAlerts.map((b) => {
                  const isOver = b.pct > 100;
                  const isWarning = b.pct >= 80 && b.pct <= 100;
                  return (
                    <div key={b.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {b.category}
                        </span>
                        <span
                          className={`font-mono tabular-nums ${
                            isOver
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : isWarning
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {formatCurrency(b.spent, currency)} /{' '}
                          {formatCurrency(b.monthlyLimit, currency)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isOver
                              ? 'bg-red-600'
                              : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, b.pct)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isOver
                          ? `Over limit by ${formatCurrency(b.spent - b.monthlyLimit, currency)}`
                          : isWarning
                            ? `${b.pct.toFixed(0)}% used · Approaching limit`
                            : `${b.pct.toFixed(0)}% used · On track`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
