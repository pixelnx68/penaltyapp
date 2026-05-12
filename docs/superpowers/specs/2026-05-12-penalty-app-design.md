# Penalty App — Design Spec

## Overview

A mobile-only Next.js (App Router) + MongoDB application for managing late-arrival penalties among a fixed group of 20 volleyball players. The admin can log 50 Rs penalties for late arrivals, track unpaid debts, accept FIFO-allocated payments (including partials), and manage the player roster.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** MongoDB
- **UI:** Tailwind CSS (mobile-first, high-contrast)
- **Auth:** HTTP-only cookie checked via Next.js Middleware, password from `ADMIN_PASSWORD` env var

---

## Routes & Navigation

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Single password field, validates against env var |
| `/` | Quick Log | Default page after login |
| `/ledger` | Debt Ledger | Unpaid totals per player |
| `/payments` | Payments | Enter payment amounts, FIFO allocation |
| `/admin` | Admin | Player CRUD (add/edit/delete) |

**Bottom Tab Bar** fixed at viewport bottom with 4 links: Log, Ledger, Pay, Admin. Current page highlighted.

**Root layout:** max-width 480px container centered on wider screens, bottom nav, auth guard.

---

## Approach

**Recommended: Server Actions + Bottom Tab Navigation (Approach A)**

- Server Actions for all mutations (log penalty, process payment, CRUD players)
- Client components only where interaction is required
- Server components for data-fetching layouts
- Middleware-based auth with signed cookie

---

## Database Schema

### Players

```
{
  _id: ObjectId,
  name: String,
  createdAt: Date
}
```

### Penalties

```
{
  _id: ObjectId,
  playerId: ObjectId (ref: Players),
  date: String ("YYYY-MM-DD"),
  amount: Number (50),
  paidAmount: Number (0),
  status: String ("unpaid" | "partial" | "paid")
}
```

**Index:** unique compound index on `(playerId, date)` — ensures one penalty per player per day.

**Payment FIFO logic:** When a payment of X Rs is submitted for a player, query all their penalties where `status != "paid"` sorted by `date ASC`. Apply X across them sequentially, updating `paidAmount` and `status` on each. A penalty where `paidAmount > 0 && paidAmount < amount` gets status `"partial"`.

---

## Page Designs

### Login (`/login`)

- Centered card with app title and single password field
- Submit button posts to a Server Action
- On success: sets HTTP-only cookie (24h expiry), redirects to `/`
- On failure: inline error message

### Quick Log (`/`)

- **Date selector** at top (input type="date", defaults to today)
- **Player list** below — all 20 players in alphabetical order
- Each row: player name (left) + action button (right)
  - No penalty exists → red **"Late"** button; tap creates penalty, button becomes green **"Done"**
  - Penalty exists → green **"Done"** button (disabled)
- Toast feedback on each log action

### Debt Ledger (`/ledger`)

- Flat list of players with `amount - paidAmount > 0`
- Each row: player name (left), total unpaid (right, red)
- Sorted by unpaid amount descending
- Empty state: "No outstanding debts"

### Payments (`/payments`)

- List of players with outstanding balance > 0
- Tap a row → opens a bottom sheet with:
  - Player name, total outstanding
  - Numeric input + **"Pay"** button
- Server Action processes payment (FIFO allocation)
- Bottom sheet shows allocation summary: "Paid 120 Rs — 2 penalties fully cleared, 1 partially paid (30 Rs remaining)"
- Row updates in real-time after payment

### Admin (`/admin`)

- **Add form** at top: text input + **"Add"** button
- **Player list** below with inline edit and delete
  - Edit: tap pencil icon → name becomes editable text input → tap checkmark to save
  - Delete: tap trash icon → confirmation dialog → Server Action deletes player and their penalties

---

## Implementation Plan

### Step 1: Project scaffolding

```bash
npx create-next-app@latest penaltyapp --typescript --tailwind --app --src-dir
```

### Step 2: MongoDB connection utility

File: `src/lib/mongodb.ts` — cached client singleton.

### Step 3: Auth

- Middleware at `src/middleware.ts` — checks auth cookie, redirects to `/login`
- Login page at `src/app/login/page.tsx`
- Server Action at `src/app/login/actions.ts`

### Step 4: Database models & Server Actions

- `src/lib/models/player.ts` — Player type/interface
- `src/lib/models/penalty.ts` — Penalty type/interface
- `src/lib/actions/players.ts` — CRUD Server Actions
- `src/lib/actions/penalties.ts` — Log penalty, process payment, get ledger

### Step 5: Pages (with Tailwind mobile-first)

- `src/app/page.tsx` — Quick Log (client component with date picker + player list)
- `src/app/ledger/page.tsx` — Debt Ledger
- `src/app/payments/page.tsx` — Payments with bottom sheet
- `src/app/admin/page.tsx` — Player CRUD

### Step 6: Bottom Tab Navigation

- `src/components/BottomNav.tsx` — Fixed bottom bar with 4 links
- `src/app/layout.tsx` — Root layout with BottomNav + auth guard

---

## Folder Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (max-width, auth guard, BottomNav)
│   ├── page.tsx                # Quick Log
│   ├── login/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── ledger/
│   │   └── page.tsx
│   ├── payments/
│   │   └── page.tsx
│   └── admin/
│       └── page.tsx
├── components/
│   ├── BottomNav.tsx
│   ├── PlayerRow.tsx
│   ├── DatePicker.tsx
│   ├── PaymentSheet.tsx
│   └── Toast.tsx
├── lib/
│   ├── mongodb.ts
│   ├── actions/
│   │   ├── players.ts
│   │   └── penalties.ts
│   └── models/
│       ├── player.ts
│       └── penalty.ts
├── middleware.ts
└── ...
```

---

## Edge Cases & Constraints

- **Double-tap prevention:** Disable "Late" button immediately on click, re-enable only on error
- **Deleting a player:** Cascade-delete their penalty records; show confirmation before deleting
- **Empty states:** Ledger shows "No outstanding debts", Payments shows "No unpaid penalties"
- **Date selection:** Admin can select past dates (to log retroactively) but not future dates
- **Partial payment remainder:** After FIFO allocation, the oldest remaining unpaid penalty shows status "partial" with the correct remaining amount
