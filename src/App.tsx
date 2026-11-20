/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { AccountsRecurringView } from './components/AccountsRecurringView';
import { BudgetsGoalsView } from './components/BudgetsGoalsView';
import { OverviewView } from './components/OverviewView';
import { SettingsDataView } from './components/SettingsDataView';
import { Sidebar } from './components/Sidebar';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsView } from './components/TransactionsView';
import { useFinanceStore } from './hooks/useFinanceStore';
import type { NavSection, Transaction } from './types/finance';

const SECTION_TITLES: Record<NavSection, string> = {
  overview: 'Overview',
  transactions: 'Transactions',
  budgets: 'Budgets & Goals',
  accounts: 'Accounts & Bills',
  settings: 'Data & Settings',
};

const THEME_STORAGE_KEY = 'clearledger_theme';

export default function App() {
  const {
    state,
    accountBalances,
    totalNetWorth,
    setCurrency,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    upsertBudget,
    deleteBudget,
    addGoal,
    contributeToGoal,
    deleteGoal,
    addAccount,
    deleteAccount,
    addRecurringRule,
    postRecurringRule,
    deleteRecurringRule,
    importState,
    resetToSampleData,
    clearAllData,
  } = useFinanceStore();

  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  const handleOpenCreateModal = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>, existingId?: string) => {
    if (existingId) {
      updateTransaction({ ...txData, id: existingId });
    } else {
      addTransaction(txData);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        totalNetWorth={totalNetWorth}
        currency={state.currency}
        isDark={isDark}
        onToggleTheme={setIsDark}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar: Breadcrumb on left, 1 primary CTA on right */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                ClearLedger
              </span>
              <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {SECTION_TITLES[activeSection]}
              </span>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Transaction</span>
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <OverviewView
              transactions={state.transactions}
              budgets={state.budgets}
              accounts={state.accounts}
              currency={state.currency}
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              onAddTransaction={handleOpenCreateModal}
              onEditTransaction={handleOpenEditModal}
              onNavigateTransactions={() => setActiveSection('transactions')}
              onNavigateBudgets={() => setActiveSection('budgets')}
            />
          )}

          {activeSection === 'transactions' && (
            <TransactionsView
              transactions={state.transactions}
              accounts={state.accounts}
              currency={state.currency}
              selectedMonth={selectedMonth}
              onAddTransaction={handleOpenCreateModal}
              onEditTransaction={handleOpenEditModal}
              onDeleteTransaction={deleteTransaction}
            />
          )}

          {activeSection === 'budgets' && (
            <BudgetsGoalsView
              budgets={state.budgets}
              goals={state.goals}
              transactions={state.transactions}
              accounts={state.accounts}
              currency={state.currency}
              selectedMonth={selectedMonth}
              onUpsertBudget={upsertBudget}
              onDeleteBudget={deleteBudget}
              onAddGoal={addGoal}
              onContributeGoal={contributeToGoal}
              onDeleteGoal={deleteGoal}
            />
          )}

          {activeSection === 'accounts' && (
            <AccountsRecurringView
              accounts={state.accounts}
              accountBalances={accountBalances}
              totalNetWorth={totalNetWorth}
              recurring={state.recurring}
              currency={state.currency}
              onAddAccount={addAccount}
              onDeleteAccount={deleteAccount}
              onAddRecurring={addRecurringRule}
              onPostRecurring={(id) => postRecurringRule(id)}
              onDeleteRecurring={deleteRecurringRule}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsDataView
              state={state}
              onChangeCurrency={setCurrency}
              onImportState={importState}
              onResetSampleData={resetToSampleData}
              onClearAllData={clearAllData}
            />
          )}
        </main>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        editingTransaction={editingTx}
        accounts={state.accounts}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
