"use client";

import { useEffect, useState } from "react";
import { getLedger } from "@/lib/actions/penalties";
import { Card, Badge } from "@/components/ui";

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

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-2xl font-bold">Debt <span className="text-primary">Ledger</span></h1>
        <p className="text-sm text-muted">Summary of all outstanding penalties.</p>
      </header>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-white/10">
          <p className="text-sm text-muted">No outstanding debts. Everyone is clear!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry._id}
              className="flex items-center justify-between hover:translate-x-1 transition-transform"
            >
              <div className="flex flex-col">
                <span className="text-base font-bold">{entry.name}</span>
                {entry.phone && (
                  <span className="text-xs text-muted">{entry.phone}</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-secondary">Rs {entry.totalUnpaid}</p>
                <Badge variant="danger">Due</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
