import { useCallback, useEffect, useMemo, useState } from 'react';
import { INITIAL_SEED_STATE } from '../data/seedData';
import type {
  Account,
  Budget,
  CurrencyCode,
  FinanceState,
  RecurringRule,
  SavingsGoal,
  Transaction,
} from '../types/finance';

const STORAGE_KEY = 'clearledger_finance_state_v1';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function loadInitialState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SEED_STATE;
    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    if (!parsed || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.accounts)) {
      return INITIAL_SEED_STATE;
    }
    return {
      currency: parsed.currency ?? 'USD',
      accounts: parsed.accounts,
      transactions: parsed.transactions,
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : INITIAL_SEED_STATE.budgets,
      goals: Array.isArray(parsed.goals) ? parsed.goals : INITIAL_SEED_STATE.goals,
      recurring: Array.isArray(parsed.recurring) ? parsed.recurring : INITIAL_SEED_STATE.recurring,
    };
  } catch {
    return INITIAL_SEED_STATE;
  }
}

export function useFinanceStore() {
  const [state, setState] = useState<FinanceState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setState((prev) => ({ ...prev, currency }));
  }, []);

  const addTransaction = useCallback((input: Omit<Transaction, 'id'>) => {
    const created: Transaction = { ...input, id: createId('tx') };
    setState((prev) => ({
      ...prev,
      transactions: [created, ...prev.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }, []);

  const updateTransaction = useCallback((updated: Transaction) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions
        .map((t) => (t.id === updated.id ? updated : t))
        .sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const upsertBudget = useCallback((category: string, monthlyLimit: number) => {
    setState((prev) => {
      const existing = prev.budgets.find((b) => b.category === category);
      if (existing) {
        return {
          ...prev,
          budgets: prev.budgets.map((b) =>
            b.category === category ? { ...b, monthlyLimit } : b
          ),
        };
      }
      return {
        ...prev,
        budgets: [...prev.budgets, { id: createId('bud'), category, monthlyLimit }],
      };
    });
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
  }, []);

  const addGoal = useCallback((input: Omit<SavingsGoal, 'id'>) => {
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, { ...input, id: createId('goal') }],
    }));
  }, []);

  const contributeToGoal = useCallback((goalId: string, amount: number, accountId?: string) => {
    if (amount <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) => {
      const targetGoal = prev.goals.find((g) => g.id === goalId);
      const nextGoals = prev.goals.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      );
      const nextTransactions =
        accountId && targetGoal
          ? [
              {
                id: createId('tx'),
                type: 'expense' as const,
                amount,
                category: 'Savings Transfer',
                accountId,
                date: today,
                description: `Contribution: ${targetGoal.name}`,
              },
              ...prev.transactions,
            ]
          : prev.transactions;

      return {
        ...prev,
        goals: nextGoals,
        transactions: nextTransactions,
      };
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  const addAccount = useCallback((input: Omit<Account, 'id'>) => {
    setState((prev) => ({
      ...prev,
      accounts: [...prev.accounts, { ...input, id: createId('acc') }],
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
  }, []);

  const addRecurringRule = useCallback((input: Omit<RecurringRule, 'id'>) => {
    setState((prev) => ({
      ...prev,
      recurring: [...prev.recurring, { ...input, id: createId('rec') }],
    }));
  }, []);

  const postRecurringRule = useCallback((ruleId: string, postDate?: string) => {
    const date = postDate || new Date().toISOString().slice(0, 10);
    setState((prev) => {
      const rule = prev.recurring.find((r) => r.id === ruleId);
      if (!rule) return prev;
      const newTx: Transaction = {
        id: createId('tx'),
        type: rule.type,
        amount: rule.amount,
        category: rule.category,
        accountId: rule.accountId,
        date,
        description: rule.title,
        notes: 'Posted from recurring schedule',
      };
      return {
        ...prev,
        transactions: [newTx, ...prev.transactions].sort((a, b) => b.date.localeCompare(a.date)),
        recurring: prev.recurring.map((r) =>
          r.id === ruleId ? { ...r, lastPostedDate: date } : r
        ),
      };
    });
  }, []);

  const deleteRecurringRule = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recurring: prev.recurring.filter((r) => r.id !== id),
    }));
  }, []);

  const importState = useCallback((next: FinanceState) => {
    setState(next);
  }, []);

  const resetToSampleData = useCallback(() => {
    setState(INITIAL_SEED_STATE);
  }, []);

  const clearAllData = useCallback(() => {
    setState((prev) => ({
      currency: prev.currency,
      accounts: [
        {
          id: 'acc-default',
          name: 'Primary Checking',
          type: 'checking',
          institution: 'Main Bank',
          startingBalance: 0,
        },
      ],
      transactions: [],
      budgets: [],
      goals: [],
      recurring: [],
    }));
  }, []);

  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    for (const acc of state.accounts) {
      balances[acc.id] = acc.startingBalance;
    }
    for (const tx of state.transactions) {
      if (balances[tx.accountId] === undefined) continue;
      balances[tx.accountId] += tx.type === 'income' ? tx.amount : -tx.amount;
    }
    return balances;
  }, [state.accounts, state.transactions]);

  const totalNetWorth = useMemo(() => {
    return Object.values(accountBalances).reduce((sum, val) => sum + val, 0);
  }, [accountBalances]);

  return {
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
  };
}
