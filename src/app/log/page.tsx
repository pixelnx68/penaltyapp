"use client";

import { useEffect, useState, useTransition } from "react";
import { getPlayers } from "@/lib/actions/players";
import { getDailyPenalties, logPenalty, deletePenalty } from "@/lib/actions/penalties";
import Toast from "@/components/Toast";
import { Button, Input, Card, Badge } from "@/components/ui";

interface Player {
  _id: string;
  name: string;
  phone?: string;
}

export default function LogPage() {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  const today = fmt.format(new Date());
  const currentTime = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [amount, setAmount] = useState("50");
  const [players, setPlayers] = useState<Player[]>([]);
  const [penalized, setPenalized] = useState<Map<string, { _id: string; status: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    startTransition(async () => {
      setLoading(true);
      try {
        const [allPlayers, penaltyMap] = await Promise.all([
          getPlayers(),
          getDailyPenalties(date),
        ]);
        setPlayers(allPlayers as Player[]);
        const penalizedMap = new Map<string, { _id: string; status: string }>();
        for (const [playerId, penalty] of penaltyMap) {
          penalizedMap.set(playerId, { _id: penalty._id, status: penalty.status });
        }
        setPenalized(penalizedMap);
      } catch {
        setToast({ message: "Failed to load data", type: "error" });
      } finally {
        setLoading(false);
      }
    });
  }, [date, refreshKey]);

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

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily <span className="text-primary">Log</span></h1>
        <Badge variant="info">{date}</Badge>
      </header>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Card className="space-y-4 bg-surface/50">
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="date"
            type="date"
            label="Date"
            value={date}
            max={today}
            onChange={(e) => {
              startTransition(() => setDate(e.target.value));
            }}
          />
          <Input
            id="time"
            type="time"
            label="Default Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <Input
          id="amount"
          type="number"
          label="Penalty Amount (Rs)"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Card>

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Players List</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => {
              const id = player._id;
              const penaltyData = penalized.get(id);
              const isLogged = !!penaltyData;
              const isPending = pendingId === id;

              return (
                <Card
                  key={id}
                  className={`flex items-center justify-between transition-all ${
                    isLogged ? "opacity-60 grayscale-[0.5]" : ""
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-base font-bold">{player.name}</span>
                    {player.phone && (
                      <span className="text-xs text-muted">{player.phone}</span>
                    )}
                  </div>
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
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleLog(id)}
                      isLoading={isPending}
                    >
                      Late
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm space-y-6 bg-surface p-8 shadow-2xl">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Remove Penalty?</h3>
              <p className="text-sm text-muted">This action will clear the log entry for today.</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
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
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
