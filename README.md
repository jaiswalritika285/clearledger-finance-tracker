# ClearLedger — Personal Finance Tracker
**Live Demo:** https://clearledger-finance-tracker.vercel.app

A responsive personal finance tracker built with React, TypeScript, Tailwind CSS, and Vite. Track monthly cash flow, manage category budgets, monitor account balances, post recurring bills, and export CSV/JSON backups directly from your browser.

## Features

- **Financial Overview**: Monthly net cash flow, income, expenses, savings rate, interactive 6-month cash flow bar chart, and category spending breakdown.
- **Transaction Ledger**: Live search, type/category/account filters, sorting, add/edit/delete entries, and one-click CSV export.
- **Budgets & Savings Goals**: Monthly category spending limits with pacing alerts and savings target tracking with direct deposits.
- **Accounts & Recurring Bills**: Multi-account balance tracking (checking, savings, credit card, cash) and recurring bill/payroll templates.
- **Local Persistence & Backups**: Automatic `localStorage` persistence, multi-currency display (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`), Light/Dark mode, and JSON backup import/export.

## Local Setup

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
