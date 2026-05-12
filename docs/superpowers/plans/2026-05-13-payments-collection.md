# Payments Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `payments` collection to track payment transactions, show history on the Payments page, and prevent deletion of paid penalties on the Log page.

**Architecture:** New `Payment` model interface, modify `processPayment` to insert payment documents, new `getPaymentHistory` server action, tabbed Payments page (Pay + History), update Log page to track penalty status and disable Undo for paid penalties.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, MongoDB 7.x, Tailwind CSS v4, shadcn-style UI components

---

### Task 1: Create Payment model

**Files:**
- Create: `src/lib/models/payment.ts`

- [ ] **Step 1: Create Payment interface**

  ```typescript
  import { ObjectId } from "mongodb";

  export interface PaymentAllocation {
    penaltyDate: string;
    amount: number;
  }

  export interface Payment {
    _id: ObjectId;
    playerId: ObjectId;
    date: string;
    amount: number;
    allocations: PaymentAllocation[];
    createdAt: Date;
  }
  ```

### Task 2: Modify `processPayment` to record payment documents

**Files:**
- Modify: `src/lib/actions/penalties.ts`

- [ ] **Step 1: Add import for Payment model**

  Add after line 6:
  ```typescript
  import { PaymentAllocation } from "../models/payment";
  ```

- [ ] **Step 2: Generate IST date string for payment date**

  In `processPayment`, before the allocation loop, add:
  ```typescript
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  const paymentDate = fmt.format(new Date());
  ```

- [ ] **Step 3: Collect allocation data and insert payment document**

  Change the allocation loop from:
  ```typescript
  const results: { date: string; amount: number; status: string }[] = [];
  ```
  to:
  ```typescript
  const results: { date: string; amount: number; status: string }[] = [];
  const allocations: PaymentAllocation[] = [];
  ```

  Inside the loop, after `results.push(...)`, add:
  ```typescript
  allocations.push({ penaltyDate: penalty.date, amount: allocation });
  ```

  After the loop (before `revalidatePath`), add:
  ```typescript
  if (allocations.length > 0) {
    const paymentsCol = await getCollection("payments");
    await paymentsCol.insertOne({
      playerId: new ObjectId(playerId),
      date: paymentDate,
      amount: amount - remaining,
      allocations,
      createdAt: new Date(),
    });
  }
  ```

  Also add `revalidatePath("/log")` to the revalidation block.

### Task 3: Create payment history server action

**Files:**
- Create: `src/lib/actions/payments.ts`

- [ ] **Step 1: Create the server action file**

  ```typescript
  "use server";

  import { ObjectId } from "mongodb";
  import { getCollection } from "../mongodb";

  export interface PaymentRecord {
    _id: string;
    playerId: string;
    playerName: string;
    date: string;
    amount: number;
    allocations: { penaltyDate: string; amount: number }[];
    createdAt: string;
  }

  export async function getPaymentHistory(): Promise<PaymentRecord[]> {
    const paymentsCol = await getCollection("payments");
    const playersCol = await getCollection("players");

    const payments = await paymentsCol
      .find({})
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    const players = await playersCol.find({}).toArray();
    const playerMap = new Map(players.map((p) => [p._id.toString(), p.name]));

    return payments.map((p) => ({
      _id: p._id.toString(),
      playerId: p.playerId.toString(),
      playerName: playerMap.get(p.playerId.toString()) || "Unknown",
      date: p.date,
      amount: p.amount,
      allocations: p.allocations || [],
      createdAt: p.createdAt?.toISOString() || "",
    }));
  }
  ```

### Task 4: Update Payments page with tabs

**Files:**
- Modify: `src/app/payments/page.tsx`

- [ ] **Step 1: Add imports**

  Change line 4 from:
  ```typescript
  import { getLedger, processPayment } from "@/lib/actions/penalties";
  ```
  to:
  ```typescript
  import { getLedger, processPayment } from "@/lib/actions/penalties";
  import { getPaymentHistory, PaymentRecord } from "@/lib/actions/payments";
  ```

- [ ] **Step 2: Add state variables for tab and history**

  After line 22 (`const [toast, ...]`), add:
  ```typescript
  const [tab, setTab] = useState<"pay" | "history">("pay");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  ```

  Change the `useEffect` (lines 24-29) to also fetch players for the pay tab:
  Already fetches ledger — no change needed for that.

- [ ] **Step 3: Add useEffect to load payment history when History tab is active**

  ```typescript
  useEffect(() => {
    if (tab === "history") {
      setHistoryLoading(true);
      getPaymentHistory().then((data) => {
        setPayments(data);
        setHistoryLoading(false);
      });
    }
  }, [tab]);
  ```

- [ ] **Step 4: Add tab bar at the top of the return section**

  Replace the `header` section (lines 69-72) with:
  ```tsx
      <div className="flex gap-1 rounded-xl bg-surface p-1">
        <button
          onClick={() => setTab("pay")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            tab === "pay" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          Pay
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            tab === "history" ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
          }`}
        >
          History
        </button>
      </div>
  ```

- [ ] **Step 5: Wrap existing content in conditional for Pay tab**

  Wrap everything from `{loading ? ...}` to the bottom sheet `{selected && ...}` in:
  ```tsx
      {tab === "pay" ? (
        ...
      ) : (
        ...
      )}
  ```

- [ ] **Step 6: Add History tab content**

  Under the `else` branch:
  ```tsx
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            Payment History
          </h2>
          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-surface" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-white/10">
              <p className="text-sm text-muted">No payments recorded yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {payments.map((pmt) => (
                <Card key={pmt._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-base font-bold">{pmt.playerName}</span>
                      <span className="text-xs text-muted">{pmt.date}</span>
                    </div>
                    <span className="text-lg font-black text-green-500">Rs {pmt.amount}</span>
                  </div>
                  {pmt.allocations.length > 0 && (
                    <div className="border-t border-border pt-2 space-y-1">
                      {pmt.allocations.map((a, i) => (
                        <div key={i} className="flex justify-between text-xs text-muted">
                          <span>Penalty: {a.penaltyDate}</span>
                          <span>Rs {a.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
  ```

### Task 5: Update Log page — show paid status instead of undo

**Files:**
- Modify: `src/app/log/page.tsx`

- [ ] **Step 1: Change penalized state to store both _id and status**

  Line 23, change:
  ```typescript
  const [penalized, setPenalized] = useState<Map<string, string>>(new Map());
  ```
  to:
  ```typescript
  const [penalized, setPenalized] = useState<Map<string, { _id: string; status: string }>>(new Map());
  ```

- [ ] **Step 2: Update the useEffect to store penalty data with status**

  Lines 40-43, change:
  ```typescript
        const penalizedMap = new Map<string, string>();
        for (const [playerId, penalty] of penaltyMap) {
          penalizedMap.set(playerId, penalty._id);
        }
  ```
  to:
  ```typescript
        const penalizedMap = new Map<string, { _id: string; status: string }>();
        for (const [playerId, penalty] of penaltyMap) {
          penalizedMap.set(playerId, { _id: penalty._id, status: penalty.status });
        }
  ```

- [ ] **Step 3: Update the render to show correct button per status**

  Lines 130-131, change:
  ```typescript
              const isLogged = penalized.has(id);
              const penaltyId = penalized.get(id);
  ```
  to:
  ```typescript
              const penaltyData = penalized.get(id);
              const isLogged = !!penaltyData;
  ```

  Lines 147-155 (the isLogged button block), replace:
  ```tsx
                  {isLogged ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => penaltyId && penaltyId !== "pending" && setConfirmDelete(penaltyId)}
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      Undo
                    </Button>
                  ) : (
  ```
  with:
  ```tsx
                  {isLogged ? (
                    penaltyData?.status === "paid" ? (
                      <Badge variant="success">Paid</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => penaltyData?._id && penaltyData._id !== "pending" && setConfirmDelete(penaltyData._id)}
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                      >
                        Undo
                      </Button>
                    )
                  ) : (
  ```

### Task 6: Update deletePlayer to also delete payments

**Files:**
- Modify: `src/lib/actions/players.ts`

- [ ] **Step 1: Add payment cascade delete**

  In `deletePlayer`, after `penaltiesCol.deleteMany(...)`, add:
  ```typescript
  const paymentsCol = await getCollection("payments");
  await paymentsCol.deleteMany({ playerId: new ObjectId(id) });
  ```

### Task 7: Build and verify

- [ ] **Step 1: Run build**

  Run: `npm run build`
  Expected: Compiled successfully, no errors.
