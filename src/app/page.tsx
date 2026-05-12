"use client";

import { useState } from "react";
import { getPlayerByPhone } from "@/lib/actions/penalties";
import { Button, Input, Card, Badge } from "@/components/ui";

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
    <div className="space-y-8 pb-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">
          Penalty <span className="text-primary">Tracker</span>
        </h1>
        <p className="text-muted text-sm font-medium">Check your late arrival dues.</p>
      </header>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="text-lg py-4"
          />
          <Button
            onClick={handleSearch}
            isLoading={loading}
            disabled={!phone.trim()}
            className="h-[52px] px-8"
          >
            Search
          </Button>
        </div>
        <p className="text-[10px] text-muted text-center uppercase tracking-widest font-bold">
          Team Registered Phone Number Only
        </p>
      </div>

      {searched && !loading && (
        <div className="animate-in space-y-6">
          {!result ? (
            <Card className="text-center py-12 border-dashed border-white/10">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-surface flex items-center justify-center text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
                <p className="text-sm font-medium text-muted">No player found with this number</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Player Profile</p>
                    <h2 className="text-2xl font-bold">{result.name}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Outstanding</p>
                    <p className="text-2xl font-black text-secondary">Rs {result.totalUnpaid}</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Recent Penalties</h3>
                {result.penalties.length > 0 ? (
                  <div className="space-y-3">
                    {result.penalties.map((p, i) => (
                      <Card key={i} className="flex items-center justify-between hover:translate-x-1 transition-transform">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{p.date}</span>
                            {p.time && <Badge variant="info">{p.time}</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            {p.status === "paid" ? (
                              <Badge variant="success">Fully Paid</Badge>
                            ) : p.status === "partial" ? (
                              <Badge variant="warning">Partial Rs {p.amount - p.remaining}</Badge>
                            ) : (
                              <Badge variant="danger">Unpaid</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-white">Rs {p.remaining}</p>
                          <p className="text-[10px] text-muted font-bold uppercase">Remaining</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <p className="text-sm text-muted">Clear record! No penalties found.</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
