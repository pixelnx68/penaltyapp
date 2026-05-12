# Delete Penalty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ability to delete a penalty from the Log page with undo button + confirmation dialog.

**Architecture:** Add a `deletePenalty` server action in the existing penalties actions file. Modify the Log page to track penalty IDs (not just player IDs), show an "Undo" button instead of "Done", and display a confirmation dialog before deleting.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, MongoDB 7.x, Tailwind CSS v4

---

### Task 1: Add `deletePenalty` server action

**Files:**
- Modify: `src/lib/actions/penalties.ts` (after `logPenalty`)

- [ ] **Step 1: Add the server action**

  ```typescript
  export async function deletePenalty(id: string) {
    const col = await getCollection("penalties");
    await col.deleteOne({ _id: new ObjectId(id) });

    revalidatePath("/");
    revalidatePath("/log");
    revalidatePath("/ledger");
    revalidatePath("/payments");
  }
  ```

  Insert this after the `logPenalty` function (after line 61).

### Task 2: Update Log page with delete functionality

**Files:**
- Modify: `src/app/log/page.tsx`

- [ ] **Step 1: Add `deletePenalty` import**

  Change line 5 from:
  ```typescript
  import { getDailyPenalties, logPenalty } from "@/lib/actions/penalties";
  ```
  to:
  ```typescript
  import { getDailyPenalties, logPenalty, deletePenalty } from "@/lib/actions/penalties";
  ```

- [ ] **Step 2: Change `penalized` state from `Set<string>` to `Map<string, string>`**

  Line 22, change:
  ```typescript
  const [penalized, setPenalized] = useState<Set<string>>(new Set());
  ```
  to:
  ```typescript
  const [penalized, setPenalized] = useState<Map<string, string>>(new Map());
  ```

- [ ] **Step 3: Add `confirmDelete` state**

  After line 26 (the `startTransition` line), add:
  ```typescript
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  ```

- [ ] **Step 4: Update the data-loading `useEffect` to store penalty IDs**

  In the `useEffect` (lines 28-48), change the loop (lines 37-40) from:
  ```typescript
        const penalizedIds = new Set<string>();
        for (const [id] of penaltyMap) {
          penalizedIds.add(id);
        }
        setPenalized(penalizedIds);
  ```
  to:
  ```typescript
        const penalizedMap = new Map<string, string>();
        for (const [playerId, penalty] of penaltyMap) {
          penalizedMap.set(playerId, penalty._id);
        }
        setPenalized(penalizedMap);
  ```

  Also change the `useEffect` dependency line from `[date]` to `[date, refreshKey]`.

- [ ] **Step 5: Update `handleLog` to use Map instead of Set**

  Change the `handleLog` function (lines 50-67) to add `setRefreshKey` after successful logging:

  ```typescript
  const handleLog = async (playerId: string) => {
    setPendingId(playerId);
    const penaltyAmount = parseInt(amount, 10);
    if (isNaN(penaltyAmount) || penaltyAmount <= 0) {
      setToast({ message: "Enter a valid amount", type: "error" });
      setPendingId(null);
      return;
    }
    try {
      await logPenalty(playerId, date, penaltyAmount, time);
      setRefreshKey((k) => k + 1);
      setToast({ message: "Penalty logged", type: "success" });
    } catch {
      setToast({ message: "Already logged for this date", type: "error" });
    } finally {
      setPendingId(null);
    }
  };
  ```

- [ ] **Step 6: Update the `isLogged` check and button rendering**

  In the render loop (line 131), change:
  ```typescript
  const isLogged = penalized.has(id);
  ```
  to:
  ```typescript
  const isLogged = penalized.has(id);
  const penaltyId = penalized.get(id);
  ```

  Replace the button block (lines 145-156) with:
  ```tsx
                {isLogged ? (
                  <button
                    onClick={() => penaltyId && penaltyId !== "pending" && setConfirmDelete(penaltyId)}
                    className="min-w-[72px] rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors active:bg-red-50"
                    style={{ minHeight: 44 }}
                  >
                    Undo
                  </button>
                ) : (
                  <button
                    onClick={() => handleLog(id)}
                    disabled={isPending}
                    className="min-w-[72px] rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white active:bg-red-700 disabled:opacity-50"
                    style={{ minHeight: 44 }}
                  >
                    {isPending ? "..." : "Late"}
                  </button>
                )}
  ```

- [ ] **Step 7: Add the confirmation dialog before the closing `</div>` tag**

  After the `{loading ? ... : ...}` block (after line 161), add:
  ```tsx
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6">
            <p className="text-base mb-4">Delete this penalty?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base font-medium"
              >
                Cancel
              </button>
              <button
                  onClick={async () => {
                    const id = confirmDelete;
                    setConfirmDelete(null);
                    try {
                      await deletePenalty(id);
                      setRefreshKey((k) => k + 1);
                      setToast({ message: "Penalty deleted", type: "success" });
                    } catch {
                      setToast({ message: "Failed to delete penalty", type: "error" });
                    }
                  }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-base font-medium text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
  ```

- [ ] **Step 8: Build and verify**

  Run `npm run build` and fix any compilation errors.
