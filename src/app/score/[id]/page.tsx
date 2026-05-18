"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getSession,
  updateScore,
  undoLastPoint,
  resetCurrentMatch,
  completeSession,
} from "@/lib/actions/sessions";
import { SessionScoreOutput } from "@/lib/models/session";
import { Button, Card, Badge } from "@/components/ui";
import Toast from "@/components/Toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SessionScoreboard({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<SessionScoreOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [scorerMode, setScorerMode] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [celebratingWinner, setCelebratingWinner] = useState<"A" | "B" | null>(null);
  const [celebratedMatchNum, setCelebratedMatchNum] = useState<number>(0);

  // Keep a ref of matches length to detect when a new match is finished
  const prevMatchesCountRef = useRef<number>(-1);

  // Load session data
  const loadSession = async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    try {
      const data = await getSession(id);
      if (!data) {
        setToast({ message: "Session not found", type: "error" });
        router.push("/score");
        return;
      }
      setSession(data);

      // Detect if a match just finished
      if (prevMatchesCountRef.current !== -1 && data.matches.length > prevMatchesCountRef.current) {
        const lastMatch = data.matches[data.matches.length - 1];
        if (lastMatch && lastMatch.matchNumber !== celebratedMatchNum) {
          setCelebratingWinner(lastMatch.winner);
          setCelebratedMatchNum(lastMatch.matchNumber);
          // Play a simulated celebratory haptic vibration
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
          }
        }
      }
      prevMatchesCountRef.current = data.matches.length;
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load session", type: "error" });
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSession(true);
  }, [id]);

  // Polling for Spectator Mode
  useEffect(() => {
    if (scorerMode || (session && session.status === "completed")) {
      return;
    }

    const interval = setInterval(() => {
      loadSession(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [id, scorerMode, session?.status]);

  // Auto-dismiss celebration overlay after 5 seconds
  useEffect(() => {
    if (celebratingWinner) {
      const timer = setTimeout(() => {
        setCelebratingWinner(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [celebratingWinner]);

  const handleScoreAction = async (team: "A" | "B", action: "increment" | "decrement" | "toggleServer") => {
    if (!scorerMode) return;
    if (session?.status === "completed") return;

    setActionLoading(`${team}-${action}`);
    try {
      // Small click feedback/vibration if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(20);
      }
      await updateScore(id, team, action);
      await loadSession(false);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update score", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUndo = async () => {
    if (!scorerMode) return;
    setActionLoading("undo");
    try {
      await undoLastPoint(id);
      await loadSession(false);
      setToast({ message: "Last score undone", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to undo score", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetCurrent = async () => {
    if (!scorerMode) return;
    if (!window.confirm("Are you sure you want to reset current match score to 0-0?")) return;

    setActionLoading("reset");
    try {
      await resetCurrentMatch(id);
      await loadSession(false);
      setToast({ message: "Current score reset to 0-0", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to reset score", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinishSession = async () => {
    if (!scorerMode) return;
    if (!window.confirm("Complete this session? History will be locked and saved.")) return;

    setActionLoading("finish");
    try {
      await completeSession(id);
      await loadSession(false);
      setToast({ message: "Session successfully completed!", type: "success" });
      setScorerMode(false); // Lock it back to spectator
    } catch (err: any) {
      setToast({ message: err.message || "Failed to complete session", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setToast({ message: "Public link copied to clipboard!", type: "success" });
    }
  };

  const getSetScore = () => {
    let winsA = 0;
    let winsB = 0;
    session?.matches.forEach((m) => {
      if (m.winner === "A") winsA++;
      if (m.winner === "B") winsB++;
    });
    return { winsA, winsB };
  };

  if (loading) {
    return (
      <div className="space-y-6 py-20 text-center flex flex-col items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-muted">Retrieving Scoreboard...</p>
      </div>
    );
  }

  if (!session) return null;

  const { winsA, winsB } = getSetScore();
  const isServingA = session.currentMatch.server === "A";
  const isServingB = session.currentMatch.server === "B";
  const activeMatchNum = session.matches.length + 1;

  return (
    <div className="space-y-6 pb-12 relative min-h-[calc(100vh-140px)] flex flex-col justify-between">
      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Container */}
      <div className="space-y-6">
        {/* Header Block with Mode Toggle */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/score")}
              className="px-2 py-1 text-xs font-bold text-muted hover:text-white"
            >
              ← Dashboard
            </Button>

            {/* Scorer / Spectator Mode Toggle */}
            {session.status === "active" ? (
              <div className="flex items-center gap-2 bg-surface/50 border border-white/5 rounded-full px-2.5 py-1">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${!scorerMode ? "text-primary" : "text-muted"}`}>
                  Spectator
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scorerMode}
                    onChange={(e) => setScorerMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                </label>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${scorerMode ? "text-primary animate-pulse" : "text-muted"}`}>
                  Scorer
                </span>
              </div>
            ) : (
              <Badge variant="info">Completed History</Badge>
            )}
          </div>

          <div className="text-center space-y-1.5 mt-1">
            <h1 className="text-2xl font-black text-white leading-none">
              {session.teamAName} <span className="text-primary font-bold text-base">vs</span> {session.teamBName}
            </h1>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
              {session.status === "active" ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Session Live</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  <span>Finished Series</span>
                </>
              )}
              {session.winByTwo && <span className="text-primary">• Win by 2 Enabled</span>}
            </p>
          </div>
        </header>

        {/* Set Wins Grid Display */}
        <Card className="bg-surface/30 border-white/5 py-4 px-6 flex items-center justify-between text-center relative overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-16 h-16 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-16 h-16 rounded-full bg-secondary/5 blur-2xl pointer-events-none" />

          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-muted tracking-widest mb-0.5">Sets Won</p>
            <p className="text-3xl font-black text-primary">{winsA}</p>
          </div>

          <div className="px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 z-10 flex flex-col justify-center items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted">Game</span>
            <span className="text-sm font-black text-white">#{activeMatchNum}</span>
          </div>

          <div className="flex-1">
            <p className="text-[10px] uppercase font-bold text-muted tracking-widest mb-0.5">Sets Won</p>
            <p className="text-3xl font-black text-secondary">{winsB}</p>
          </div>
        </Card>

        {/* Immersive Scoreboard Interface */}
        <div className="grid grid-cols-2 gap-4">
          {/* Team A Scoring Block */}
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={() => handleScoreAction("A", "toggleServer")}
              disabled={!scorerMode || session.status === "completed"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-xs font-bold ${
                isServingA
                  ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(59,130,246,0.2)] animate-pulse"
                  : "bg-surface/50 border-white/5 text-muted hover:text-white"
              } ${!scorerMode ? "cursor-default" : "cursor-pointer"}`}
            >
              🏐 <span className="uppercase tracking-wider">Serve</span>
            </button>

            <div className="w-full relative group">
              <div
                onClick={() => handleScoreAction("A", "increment")}
                className={`w-full aspect-square rounded-3xl flex items-center justify-center text-7xl font-black transition-all ${
                  scorerMode && session.status === "active"
                    ? "bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/30 hover:border-primary hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] active:scale-95 cursor-pointer text-primary"
                    : "bg-surface/30 border border-white/5 text-white"
                }`}
              >
                {session.currentMatch.scoreA}
              </div>

              {scorerMode && session.status === "active" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScoreAction("A", "decrement");
                  }}
                  disabled={session.currentMatch.scoreA === 0}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#161b22] hover:bg-[#1c2128] border border-white/10 rounded-xl h-8 w-12 flex items-center justify-center text-xs font-bold text-muted hover:text-white active:scale-90 transition-transform shadow-lg disabled:opacity-30 disabled:pointer-events-none"
                  title="Subtract Point"
                >
                  -1
                </button>
              )}
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider text-center max-w-[120px] truncate block pt-1.5">
              {session.teamAName}
            </span>
          </div>

          {/* Team B Scoring Block */}
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={() => handleScoreAction("B", "toggleServer")}
              disabled={!scorerMode || session.status === "completed"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-xs font-bold ${
                isServingB
                  ? "bg-secondary/20 border-secondary text-secondary shadow-[0_0_10px_rgba(249,115,22,0.2)] animate-pulse"
                  : "bg-surface/50 border-white/5 text-muted hover:text-white"
              } ${!scorerMode ? "cursor-default" : "cursor-pointer"}`}
            >
              🏐 <span className="uppercase tracking-wider">Serve</span>
            </button>

            <div className="w-full relative group">
              <div
                onClick={() => handleScoreAction("B", "increment")}
                className={`w-full aspect-square rounded-3xl flex items-center justify-center text-7xl font-black transition-all ${
                  scorerMode && session.status === "active"
                    ? "bg-gradient-to-b from-secondary/10 to-secondary/5 border border-secondary/30 hover:border-secondary hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] active:scale-95 cursor-pointer text-secondary"
                    : "bg-surface/30 border border-white/5 text-white"
                }`}
              >
                {session.currentMatch.scoreB}
              </div>

              {scorerMode && session.status === "active" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScoreAction("B", "decrement");
                  }}
                  disabled={session.currentMatch.scoreB === 0}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#161b22] hover:bg-[#1c2128] border border-white/10 rounded-xl h-8 w-12 flex items-center justify-center text-xs font-bold text-muted hover:text-white active:scale-90 transition-transform shadow-lg disabled:opacity-30 disabled:pointer-events-none"
                  title="Subtract Point"
                >
                  -1
                </button>
              )}
            </div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider text-center max-w-[120px] truncate block pt-1.5">
              {session.teamBName}
            </span>
          </div>
        </div>

        {/* Set History Log */}
        <div className="space-y-3 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center justify-between">
            <span>Set Results History</span>
            <span className="text-[10px] text-primary lowercase font-medium font-sans">11-points game</span>
          </h3>

          {session.matches.length > 0 ? (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {session.matches.map((match, i) => {
                const isWinnerA = match.winner === "A";
                const isWinnerB = match.winner === "B";

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-surface/20 border border-white/5 text-xs text-white"
                  >
                    <span className="font-bold text-muted">Set {match.matchNumber}</span>
                    <div className="flex items-center gap-3">
                      <span className={`${isWinnerA ? "text-primary font-black" : "text-white/60"}`}>
                        {match.scoreA}
                      </span>
                      <span className="text-muted/60">-</span>
                      <span className={`${isWinnerB ? "text-secondary font-black" : "text-white/60"}`}>
                        {match.scoreB}
                      </span>
                    </div>
                    <span className="font-extrabold uppercase text-[10px] tracking-wider">
                      {isWinnerA ? (
                        <span className="text-primary">{session.teamAName} wins</span>
                      ) : (
                        <span className="text-secondary">{session.teamBName} wins</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-6 border-dashed border-white/5 bg-transparent">
              <p className="text-xs text-muted font-bold">No sets played yet. Keep track above!</p>
            </Card>
          )}
        </div>
      </div>

      {/* Dynamic Action Buttons Footer */}
      <div className="space-y-4 pt-6 mt-auto">
        {/* Scorer Controls Panel */}
        {scorerMode && session.status === "active" && (
          <div className="p-3 bg-surface/50 border border-white/5 rounded-2xl space-y-3 shadow-xl">
            <p className="text-[10px] text-primary font-black tracking-widest uppercase text-center">
              Scorer Controls Panel
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={actionLoading !== null || !session.historyStack || session.historyStack.length === 0}
                className="h-9 text-xs font-bold border-white/10 text-white/90 hover:bg-white/5"
              >
                ↩ Undo Point
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetCurrent}
                disabled={actionLoading !== null || (session.currentMatch.scoreA === 0 && session.currentMatch.scoreB === 0)}
                className="h-9 text-xs font-bold border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                ↻ Reset Set
              </Button>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleFinishSession}
              disabled={actionLoading !== null}
              className="w-full h-10 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-red-700 shadow-md shadow-red-700/15"
            >
              🔒 End & Archive Session
            </Button>
          </div>
        )}

        {/* Share Utility Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            onClick={copyShareLink}
            className="w-full h-11 text-xs font-bold uppercase tracking-wider border-white/10 text-white/90 hover:bg-surface-hover hover:text-white"
          >
            📋 Copy Public Link
          </Button>
        </div>
      </div>

      {/* Magnificent Winner Celebration Overlay */}
      {celebratingWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-6 animate-[fade-in_0.3s_ease]">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-8 shadow-2xl text-center space-y-6 relative overflow-hidden animate-[scale-up_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            {/* Animated Celebration Ring Glow */}
            <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl ${
              celebratingWinner === "A" ? "bg-primary/20" : "bg-secondary/20"
            }`} />
            <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl ${
              celebratingWinner === "A" ? "bg-primary/20" : "bg-secondary/20"
            }`} />

            <div className="text-center space-y-3 relative z-10">
              <span className="text-6xl block animate-[bounce_1s_infinite]">🏆</span>
              <h2 className={`text-3xl font-black uppercase ${
                celebratingWinner === "A" ? "text-primary" : "text-secondary"
              }`}>
                Set Complete!
              </h2>
              <p className="text-base font-extrabold text-white">
                {celebratingWinner === "A" ? session.teamAName : session.teamBName} Wins!
              </p>
              <p className="text-xs text-muted font-medium">
                The score has been saved to set history logs. Next game is loaded and ready!
              </p>
            </div>

            <Button
              variant="primary"
              className={`w-full py-3 text-sm font-black uppercase tracking-wider border border-white/10 ${
                celebratingWinner === "A" ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/90"
              }`}
              onClick={() => setCelebratingWinner(null)}
            >
              Continue Playing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
