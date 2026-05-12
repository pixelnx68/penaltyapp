"use client";

import { useState } from "react";
import { getPlayerByPhone } from "@/lib/actions/penalties";

interface PenaltyRecord {
  date: string;
  time?: string;
  amount: number;
  paidAmount: number;
  status: string;
  remaining: number;
}

interface PlayerInfo {
  name: string;
  totalUnpaid: number;
  penalties: PenaltyRecord[];
}

export default function HomePage() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<PlayerInfo | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await getPlayerByPhone(phone.trim());
      setResult(data as unknown as PlayerInfo);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">Check My Penalty</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
          style={{ minHeight: 44 }}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !phone.trim()}
          className="rounded-lg bg-black px-6 py-3 text-base font-medium text-white disabled:opacity-50"
          style={{ minHeight: 44 }}
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      {searched && !loading && (
        <>
          {!result ? (
            <p className="text-center text-gray-500 py-8">
              No player found with this phone number
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-lg font-bold">{result.name}</p>
                <p className="text-sm text-gray-500">
                  Total unpaid:{" "}
                  <span className="font-semibold text-red-600">
                    Rs {result.totalUnpaid}
                  </span>
                </p>
              </div>

              {result.penalties.length > 0 ? (
                <ul className="space-y-2">
                  {result.penalties.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {p.date}
                          {p.time && <span className="text-gray-400 ml-1">{p.time}</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.status === "paid"
                            ? "Paid"
                            : p.status === "partial"
                            ? `Partially paid — Rs ${p.remaining} remaining`
                            : `Unpaid — Rs ${p.amount}`}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          p.status === "paid"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Rs {p.remaining}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No penalty records
                </p>
              )}
            </div>
          )}
        </>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        Enter the phone number registered with your team admin
      </p>
    </div>
  );
}
