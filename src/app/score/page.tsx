"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { getRecentSessions, createSession } from "@/lib/actions/sessions";
import { SessionScoreOutput } from "@/lib/models/session";
import { Button, Input, Card, Badge } from "@/components/ui";
import Toast from "@/components/Toast";

export default function ScoreDashboard() {
  const router = useRouter();
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [winByTwo, setWinByTwo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSessions, setRecentSessions] = useState<SessionScoreOutput[]>([]);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const sessions = await getRecentSessions();
        setRecentSessions(sessions);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    loadSessions();
  }, []);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameA = teamA.trim() || "Team A";
    const nameB = teamB.trim() || "Team B";

    setLoading(true);
    try {
      const sessionId = await createSession(nameA, nameB, winByTwo);
      setToast({ message: "Session created successfully!", type: "success" });
      router.push(`/score/${sessionId}`);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to start scoreboard session", type: "error" });
      setLoading(false);
    }
  };

  const getSetScore = (session: SessionScoreOutput) => {
    let winsA = 0;
    let winsB = 0;
    session.matches.forEach((match) => {
      if (match.winner === "A") winsA++;
      if (match.winner === "B") winsB++;
    });
    return { winsA, winsB };
  };

  const activeSessions = recentSessions.filter((s) => s.status === "active");
  const completedSessions = recentSessions.filter((s) => s.status === "completed");

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">
          Match <span className="text-primary">Scoreboard</span>
        </h1>
        <p className="text-muted text-sm font-medium">
          Create public real-time scoreboard & logs for 11-point games.
        </p>
      </header>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Start New Session Card */}
      <Card className="bg-surface/50 border-white/5 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-primary text-xl">🏐</span> Start New Session
        </h2>
        <form onSubmit={handleStartSession} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              label="Team A / Player 1"
              placeholder="Vikings"
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              className="bg-background border-white/10"
              maxLength={15}
            />
            <Input
              type="text"
              label="Team B / Player 2"
              placeholder="Titans"
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              className="bg-background border-white/10"
              maxLength={15}
            />
          </div>

          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-background/50 border border-white/5">
            <div className="space-y-0.5">
              <label htmlFor="win-by-two" className="text-xs font-bold text-white uppercase tracking-wider">
                Win by 2 points
              </label>
              <p className="text-[10px] text-muted leading-tight">
                Requires leading by 2 points (e.g., 12-10, 13-11) instead of flat 11.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="win-by-two"
                type="checkbox"
                checked={winByTwo}
                onChange={(e) => setWinByTwo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full h-12 text-sm font-bold tracking-wider uppercase bg-gradient-to-r from-primary to-primary/95 shadow-md shadow-primary/10"
          >
            Launch Scoreboard
          </Button>
        </form>
      </Card>

      {/* Active Sessions */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Active Games
        </h3>

        {fetching ? (
          <div className="space-y-3">
            <div className="h-20 w-full animate-pulse rounded-2xl bg-surface" />
          </div>
        ) : activeSessions.length > 0 ? (
          <div className="space-y-3">
            {activeSessions.map((session) => {
              const { winsA, winsB } = getSetScore(session);
              return (
                <Card
                  key={session._id}
                  onClick={() => router.push(`/score/${session._id}`)}
                  className="flex items-center justify-between hover:translate-x-1 transition-transform border border-green-500/10 hover:border-green-500/30 bg-green-500/[0.02] cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold text-white">
                        {session.teamAName} <span className="text-primary font-bold text-sm">vs</span> {session.teamBName}
                      </span>
                      <Badge variant="success">Live</Badge>
                    </div>
                    <p className="text-xs text-muted font-bold">
                      Sets: {winsA} - {winsB} | Active Score: {session.currentMatch.scoreA} - {session.currentMatch.scoreB}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center text-primary border border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-8 border-dashed border-white/5 bg-transparent">
            <p className="text-xs text-muted font-semibold">No active games right now. Start one above!</p>
          </Card>
        )}
      </div>

      {/* Completed Sessions */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Recent Sessions History</h3>

        {fetching ? (
          <div className="space-y-3">
            <div className="h-20 w-full animate-pulse rounded-2xl bg-surface" />
            <div className="h-20 w-full animate-pulse rounded-2xl bg-surface" />
          </div>
        ) : completedSessions.length > 0 ? (
          <div className="space-y-3">
            {completedSessions.map((session) => {
              const { winsA, winsB } = getSetScore(session);
              const dateObj = new Date(session.updatedAt);
              const formattedDate = dateObj.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card
                  key={session._id}
                  onClick={() => router.push(`/score/${session._id}`)}
                  className="flex items-center justify-between hover:translate-x-1 transition-transform border border-white/5 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white/80">
                        {session.teamAName} <span className="text-muted font-bold text-xs">vs</span> {session.teamBName}
                      </span>
                      <Badge variant="info">Finished</Badge>
                    </div>
                    <p className="text-xs text-muted font-bold">
                      Final sets: {winsA} - {winsB} ({session.matches.length} matches played)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider">{formattedDate}</p>
                    <p className="text-xs text-primary font-black uppercase tracking-widest">View Stats</p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-8 border-dashed border-white/5 bg-transparent">
            <p className="text-xs text-muted font-semibold">No finished games yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
