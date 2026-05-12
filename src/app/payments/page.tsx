"use client";

import { useEffect, useState } from "react";
import { getLedger, processPayment } from "@/lib/actions/penalties";
import Toast from "@/components/Toast";

interface LedgerEntry {
  _id: string;
  name: string;
  phone?: string;
  totalUnpaid: number;
}

export default function PaymentsPage() {
  const [players, setPlayers] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LedgerEntry | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getLedger().then((data) => {
      setPlayers(data as unknown as LedgerEntry[]);
      setLoading(false);
    });
  }, []);

  const handlePay = async () => {
    if (!selected || !payAmount) return;

    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: "Enter a valid amount", type: "error" });
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const res = await processPayment(selected._id, amount);
      const paidCount = res.allocation.filter((a) => a.status === "paid").length;
      const partialCount = res.allocation.filter((a) => a.status === "partial").length;

      let msg = `Paid Rs ${res.allocated}`;
      if (paidCount > 0) msg += ` — ${paidCount} penalty(ies) fully cleared`;
      if (partialCount > 0) msg += `, ${partialCount} partially paid`;

      if (res.remaining > 0) {
        msg += `. Rs ${res.remaining} unallocated (overpayment).`;
      }

      setResult(msg);
      setToast({ message: "Payment processed", type: "success" });
      setPayAmount("");
      getLedger().then((data) => setPlayers(data as unknown as LedgerEntry[]));
    } catch {
      setToast({ message: "Payment failed", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400 py-8">Loading payments...</p>;
  }

  return (
    <div className="px-4 pt-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-xl font-bold mb-4">Payments</h1>

      {players.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No unpaid penalties</p>
      ) : (
        <ul className="space-y-2">
          {players.map((player) => (
            <li key={player._id}>
              <button
                onClick={() => {
                  setSelected(player);
                  setResult(null);
                  setPayAmount("");
                }}
                className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left"
                style={{ minHeight: 44 }}
              >
                <div className="flex flex-col text-left">
                  <span className="text-base font-medium">{player.name}</span>
                  {player.phone && (
                    <span className="text-sm text-gray-500">{player.phone}</span>
                  )}
                </div>
                <span className="text-base font-semibold text-red-600">
                  Rs {player.totalUnpaid}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-[480px] rounded-t-xl bg-white px-4 pb-8 pt-6">
            <h2 className="text-lg font-bold mb-1">{selected.name}</h2>
            <p className="text-sm text-gray-500 mb-4">
              Outstanding: Rs {selected.totalUnpaid}
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-1">
                  Payment Amount (Rs)
                </label>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
                  style={{ minHeight: 44 }}
                />
              </div>

              {result && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  {result}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 text-base font-medium"
                  style={{ minHeight: 44 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  disabled={processing || !payAmount}
                  className="flex-1 rounded-lg bg-black py-3 text-base font-medium text-white disabled:opacity-50"
                  style={{ minHeight: 44 }}
                >
                  {processing ? "Processing..." : "Pay"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
