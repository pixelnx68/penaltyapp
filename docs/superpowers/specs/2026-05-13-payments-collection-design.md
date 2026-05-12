# Payments Collection Feature

## Overview
Create a dedicated `payments` collection to track payment transactions, show payment history on the Payments page, and prevent deletion of paid penalties on the Log page.

## Data Model

### New `payments` Collection
```
{
  _id: ObjectId,
  playerId: ObjectId,
  date: string,           // payment date YYYY-MM-DD
  amount: number,         // total amount paid in this transaction
  allocations: [          // which penalties were covered
    { penaltyDate: string, amount: number }
  ],
  createdAt: Date
}
```

### New Interface: `Payment`
- File: `src/lib/models/payment.ts`
- Matches the above document structure

## Backend Changes

### Modify `processPayment` (`src/lib/actions/penalties.ts`)
- After allocating payment across penalties and updating their `paidAmount`/`status`, insert a payment document into the `payments` collection
- Payment document includes: `playerId`, `date` (IST today), `amount` (total paid), `allocations` (array of { penaltyDate, amount }), `createdAt`
- Revalidate `/payments` path

### New Server Actions (`src/lib/actions/payments.ts`)
- `getPaymentHistory()`: Fetch all payments sorted by date DESC, join with player names (lookup players collection), return array with player name, date, amount, allocations

## Frontend Changes

### Payments Page (`src/app/payments/page.tsx`)
- Tabbed layout with two tabs: "Pay" and "History"
- **Pay tab**: Existing payment form functionality (unchanged)
- **History tab**: List of past payments showing player name, date, amount, and allocation breakdown

### Log Page (`src/app/log/page.tsx`)
- The `getDailyPenalties()` already returns `status` for each penalty
- Change `penalized` state from `Map<string, string>` (playerId -> penaltyId) to `Map<string, { _id: string, status: string }>` (playerId -> { id, status })
- When a penalty is fully paid (`status === "paid"`), show a disabled "Paid" badge instead of the "Undo" button
- Only unpaid/partial penalties show the "Undo" button

## UX Patterns
- Tabbed navigation: same styling for both tabs (selected tab gets black border/text)
- Payment history list: same card style as other pages (border, rounded-lg, px-4 py-3)
- Paid badge on Log page: same disabled green "Done" style (reused from original code)
