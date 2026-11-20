import { useRef, useState, type ChangeEvent } from 'react';
import { Download, RotateCcw, Trash2, Upload } from 'lucide-react';
import { CURRENCY_OPTIONS } from '../data/seedData';
import type { CurrencyCode, FinanceState } from '../types/finance';
import { downloadTextFile, escapeCsvCell } from '../utils/format';

interface SettingsDataViewProps {
  state: FinanceState;
  onChangeCurrency: (currency: CurrencyCode) => void;
  onImportState: (next: FinanceState) => void;
  onResetSampleData: () => void;
  onClearAllData: () => void;
}

export function SettingsDataView({
  state,
  onChangeCurrency,
  onImportState,
  onResetSampleData,
  onClearAllData,
}: SettingsDataViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [confirmClear, setConfirmClear] = useState(false);

  const handleExportJson = () => {
    downloadTextFile(
      'clearledger-backup.json',
      JSON.stringify(state, null, 2),
      'application/json'
    );
    setFeedback({ type: 'success', message: 'Full JSON backup downloaded.' });
  };

  const handleExportCsv = () => {
    const accountMap: Record<string, string> = {};
    for (const acc of state.accounts) accountMap[acc.id] = acc.name;

    const headers = ['Date', 'Type', 'Description', 'Category', 'Account', 'Amount', 'Notes'];
    const lines = [
      headers.join(','),
      ...state.transactions.map((tx) =>
        [
          escapeCsvCell(tx.date),
          escapeCsvCell(tx.type),
          escapeCsvCell(tx.description),
          escapeCsvCell(tx.category),
          escapeCsvCell(accountMap[tx.accountId] ?? tx.accountId),
          escapeCsvCell(tx.type === 'income' ? tx.amount : -tx.amount),
          escapeCsvCell(tx.notes ?? ''),
        ].join(',')
      ),
    ];
    downloadTextFile('clearledger-ledger.csv', lines.join('\n'), 'text/csv;charset=utf-8;');
    setFeedback({ type: 'success', message: 'Transaction ledger exported as CSV.' });
  };

  const handleImportJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<FinanceState>;
      if (
        !parsed ||
        !Array.isArray(parsed.transactions) ||
        !Array.isArray(parsed.accounts)
      ) {
        throw new Error('Invalid ClearLedger backup format.');
      }
      onImportState({
        currency: parsed.currency ?? 'USD',
        accounts: parsed.accounts,
        transactions: parsed.transactions,
        budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        recurring: Array.isArray(parsed.recurring) ? parsed.recurring : [],
      });
      setFeedback({
        type: 'success',
        message: `Imported ${parsed.transactions.length} transactions and ${parsed.accounts.length} accounts.`,
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Could not import file. Make sure it is a valid ClearLedger JSON backup.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Data & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          All ledger data is stored locally in your browser. Export backups anytime.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-lg border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
        {/* Currency Preference */}
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Display Currency
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Applies currency symbol and formatting across all ledgers and charts
            </p>
          </div>
          <select
            value={state.currency}
            onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
            aria-label="Display currency"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label} — {opt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Backup & Restore */}
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Export & Restore
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download spreadsheets for Excel/Sheets or restore a saved JSON snapshot
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Backup JSON</span>
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-medium cursor-pointer whitespace-nowrap">
              <Upload className="h-3.5 w-3.5" />
              <span>Import JSON</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportJson}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Sample / Reset */}
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Workspace Data Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Restore the 6-month sample dataset or start with a blank ledger
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetSampleData();
                setConfirmClear(false);
                setFeedback({ type: 'success', message: 'Sample dataset restored.' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Load Sample Data</span>
            </button>

            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Data</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllData();
                    setConfirmClear(false);
                    setFeedback({ type: 'success', message: 'All ledger data cleared.' });
                  }}
                  className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium whitespace-nowrap"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
