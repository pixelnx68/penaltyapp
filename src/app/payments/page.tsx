"use client";

import { useEffect, useState } from "react";
import { getLedger, processPayment } from "@/lib/actions/penalties";
import { getPaymentHistory, PaymentRecord } from "@/lib/actions/payments";
import Toast from "@/components/Toast";
import { Button, Input, Card, Badge } from "@/components/ui";

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
  const [tab, setTab] = useState<"pay" | "history">("pay");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    getLedger().then((data) => {
      setPlayers(data as unknown as LedgerEntry[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (tab === "history") {
      setHistoryLoading(true);
      getPaymentHistory().then((data) => {
        setPayments(data);
        setHistoryLoading(false);
      });
    }
  }, [tab]);

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

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-2xl font-bold">Process <span className="text-primary">Payments</span></h1>
        <p className="text-sm text-muted">Handle dues and view transaction history.</p>
      </header>

      <div className="flex gap-1 rounded-2xl bg-surface/50 p-1.5 border border-white/5 backdrop-blur-md">
        <button
          onClick={() => setTab("pay")}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
            tab === "pay" 
              ? "bg-primary text-white shadow-lg shadow-primary/20" 
              : "text-muted hover:text-foreground hover:bg-white/5"
          }`}
        >
          Active Dues
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
            tab === "history" 
              ? "bg-primary text-white shadow-lg shadow-primary/20" 
              : "text-muted hover:text-foreground hover:bg-white/5"
          }`}
        >
          Payment History
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {tab === "pay" ? (
        <>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-surface" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-white/10">
              <p className="text-sm text-muted">No unpaid penalties found.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <button
                  key={player._id}
                  onClick={() => {
                    setSelected(player);
                    setResult(null);
                    setPayAmount("");
                  }}
                  className="w-full text-left transition-transform active:scale-[0.98]"
                >
                  <Card className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-base font-bold">{player.name}</span>
                      {player.phone && (
                        <span className="text-xs text-muted">{player.phone}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-secondary">Rs {player.totalUnpaid}</p>
                      <p className="text-[10px] font-bold uppercase text-muted tracking-widest">Outstanding</p>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
              <div className="animate-in w-full max-w-[480px] rounded-t-[32px] bg-surface px-6 pb-10 pt-8 shadow-2xl">
                <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/10" />
                
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selected.name}</h2>
                    <p className="text-sm text-muted">Outstanding: Rs {selected.totalUnpaid}</p>
                  </div>
                  <Badge variant="warning">Awaiting Payment</Badge>
                </div>

                <div className="space-y-6">
                  <Input
                    id="amount"
                    type="number"
                    label="Amount to Pay (Rs)"
                    min="1"
                    step="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="text-xl py-4 font-bold text-primary"
                  />

                  {result && (
                    <div className="rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-500 font-medium">
                      {result}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 py-4"
                      onClick={() => setSelected(null)}
                    >
                      Close
                    </Button>
                    <Button
                      className="flex-1 py-4"
                      onClick={handlePay}
                      isLoading={processing}
                      disabled={!payAmount}
                    >
                      Confirm Pay
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Payment History</h2>
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
    </div>
  );
}
