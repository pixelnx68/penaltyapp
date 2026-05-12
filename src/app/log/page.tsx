"use client";

import { useEffect, useState, useTransition } from "react";
import { getPlayers } from "@/lib/actions/players";
import { getDailyPenalties, logPenalty } from "@/lib/actions/penalties";
import Toast from "@/components/Toast";

interface Player {
  _id: string;
  name: string;
  phone?: string;
}

export default function LogPage() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(":").slice(0, 2).join(":");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [amount, setAmount] = useState("50");
  const [players, setPlayers] = useState<Player[]>([]);
  const [penalized, setPenalized] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setLoading(true);
      try {
        const [allPlayers, penaltyMap] = await Promise.all([
          getPlayers(),
          getDailyPenalties(date),
        ]);
        setPlayers(allPlayers as Player[]);
        const penalizedIds = new Set<string>();
        for (const [id] of penaltyMap) {
          penalizedIds.add(id);
        }
        setPenalized(penalizedIds);
      } catch {
        setToast({ message: "Failed to load data", type: "error" });
      } finally {
        setLoading(false);
      }
    });
  }, [date]);

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
      setPenalized((prev) => new Set(prev).add(playerId));
      setToast({ message: "Penalty logged", type: "success" });
    } catch {
      setToast({ message: "Already logged for this date", type: "error" });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="px-4 pt-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-4 space-y-3">
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              startTransition(() => setDate(e.target.value));
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="time" className="block text-sm font-medium mb-1">
              Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="w-32">
            <label htmlFor="amount" className="block text-sm font-medium mb-1">
              Amount (Rs)
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">Loading players...</p>
      ) : (
        <ul className="space-y-2">
          {players.map((player) => {
            const id = player._id;
            const isLogged = penalized.has(id);
            const isPending = pendingId === id;

            return (
              <li
                key={id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-base font-medium">{player.name}</span>
                  {player.phone && (
                    <span className="text-sm text-gray-500">{player.phone}</span>
                  )}
                </div>
                <button
                  onClick={() => handleLog(id)}
                  disabled={isLogged || isPending}
                  className={`min-w-[72px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isLogged
                      ? "bg-green-600 text-white cursor-default"
                      : "bg-red-600 text-white active:bg-red-700 disabled:opacity-50"
                  }`}
                  style={{ minHeight: 44 }}
                >
                  {isPending ? "..." : isLogged ? "Done" : "Late"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
