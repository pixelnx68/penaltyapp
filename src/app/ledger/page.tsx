"use client";

import { useEffect, useState } from "react";
import { getLedger } from "@/lib/actions/penalties";

interface LedgerEntry {
  _id: string;
  name: string;
  phone?: string;
  totalUnpaid: number;
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLedger().then((data) => {
      setEntries(data as unknown as LedgerEntry[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-center text-gray-400 py-8">Loading ledger...</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold mb-4">Debt Ledger</h1>
        <p className="text-center text-gray-400 py-8">No outstanding debts</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">Debt Ledger</h1>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry._id}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
          >
            <div className="flex flex-col">
              <span className="text-base font-medium">{entry.name}</span>
              {entry.phone && (
                <span className="text-sm text-gray-500">{entry.phone}</span>
              )}
            </div>
            <span className="text-base font-semibold text-red-600">
              Rs {entry.totalUnpaid}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
