"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getCollection } from "../mongodb";
import { SessionScore, SessionHistoryItem, SessionScoreOutput } from "../models/session";

// Helper to serialize MongoDB doc
function serializeSession(doc: any): SessionScoreOutput {
  return {
    _id: doc._id.toString(),
    teamAName: doc.teamAName,
    teamBName: doc.teamBName,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
    matches: (doc.matches || []).map((m: any) => ({
      matchNumber: m.matchNumber,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      winner: m.winner,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    })),
    currentMatch: {
      scoreA: doc.currentMatch?.scoreA ?? 0,
      scoreB: doc.currentMatch?.scoreB ?? 0,
      server: doc.currentMatch?.server ?? null,
    },
    winByTwo: !!doc.winByTwo,
    status: doc.status || "active",
  };
}

export async function createSession(teamA: string, teamB: string, winByTwo: boolean) {
  const col = await getCollection("sessions");
  const session = {
    teamAName: teamA.trim() || "Team A",
    teamBName: teamB.trim() || "Team B",
    createdAt: new Date(),
    updatedAt: new Date(),
    matches: [],
    currentMatch: {
      scoreA: 0,
      scoreB: 0,
      server: null,
    },
    winByTwo: !!winByTwo,
    status: "active" as const,
    historyStack: [] as SessionHistoryItem[],
  };

  const result = await col.insertOne(session);
  
  revalidatePath("/score");
  return result.insertedId.toString();
}

export async function getSession(id: string): Promise<SessionScoreOutput | null> {
  try {
    const col = await getCollection("sessions");
    const doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return serializeSession(doc);
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

export async function updateScore(
  id: string,
  team: "A" | "B",
  action: "increment" | "decrement" | "toggleServer"
) {
  const col = await getCollection("sessions");
  const session = (await col.findOne({ _id: new ObjectId(id) })) as SessionScore | null;
  if (!session) throw new Error("Session not found");
  if (session.status === "completed") throw new Error("Session is completed");

  // Keep track of current state before applying updates (for undo stack)
  const currentMatchState = {
    scoreA: session.currentMatch.scoreA,
    scoreB: session.currentMatch.scoreB,
    server: session.currentMatch.server,
  };
  const matchesCount = session.matches.length;

  const historyStack = session.historyStack || [];
  historyStack.push({
    currentMatch: currentMatchState,
    matchesCount,
  });

  // Limit history stack size to 50 items to keep doc size in check
  if (historyStack.length > 50) {
    historyStack.shift();
  }

  const currentMatch = { ...session.currentMatch };
  const matches = [...session.matches];

  if (action === "toggleServer") {
    // If serve is not set, set it to the team selected. If set, toggle it
    if (currentMatch.server === team) {
      currentMatch.server = null; // deselect server
    } else {
      currentMatch.server = team;
    }
  } else if (action === "increment") {
    if (team === "A") {
      currentMatch.scoreA += 1;
    } else {
      currentMatch.scoreB += 1;
    }

    // Auto switch server rules can be implemented, but standard manual server indicator is preferred.
    // Check if match is finished
    const scoreA = currentMatch.scoreA;
    const scoreB = currentMatch.scoreB;
    let isFinished = false;
    let winner: "A" | "B" | null = null;

    if (session.winByTwo) {
      if (scoreA >= 11 && scoreA - scoreB >= 2) {
        isFinished = true;
        winner = "A";
      } else if (scoreB >= 11 && scoreB - scoreA >= 2) {
        isFinished = true;
        winner = "B";
      }
    } else {
      if (scoreA >= 11) {
        isFinished = true;
        winner = "A";
      } else if (scoreB >= 11) {
        isFinished = true;
        winner = "B";
      }
    }

    if (isFinished && winner) {
      matches.push({
        matchNumber: matches.length + 1,
        scoreA,
        scoreB,
        winner,
        timestamp: new Date(),
      });
      // Reset match score
      currentMatch.scoreA = 0;
      currentMatch.scoreB = 0;
      currentMatch.server = null;
    }
  } else if (action === "decrement") {
    if (team === "A") {
      currentMatch.scoreA = Math.max(0, currentMatch.scoreA - 1);
    } else {
      currentMatch.scoreB = Math.max(0, currentMatch.scoreB - 1);
    }
  }

  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        currentMatch,
        matches,
        historyStack,
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath(`/score/${id}`);
  revalidatePath("/score");
}

export async function undoLastPoint(id: string) {
  const col = await getCollection("sessions");
  const session = (await col.findOne({ _id: new ObjectId(id) })) as SessionScore | null;
  if (!session) throw new Error("Session not found");
  if (session.status === "completed") throw new Error("Session is completed");

  const historyStack = session.historyStack || [];
  if (historyStack.length === 0) return; // Nothing to undo

  const previousState = historyStack.pop()!;
  const currentMatch = previousState.currentMatch;
  let matches = [...session.matches];

  // If the previous state had fewer matches, remove the last match from the archive
  if (previousState.matchesCount < matches.length) {
    matches.pop();
  }

  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        currentMatch,
        matches,
        historyStack,
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath(`/score/${id}`);
  revalidatePath("/score");
}

export async function resetCurrentMatch(id: string) {
  const col = await getCollection("sessions");
  const session = (await col.findOne({ _id: new ObjectId(id) })) as SessionScore | null;
  if (!session) throw new Error("Session not found");
  if (session.status === "completed") throw new Error("Session is completed");

  // Push previous state to undo stack
  const historyStack = session.historyStack || [];
  historyStack.push({
    currentMatch: { ...session.currentMatch },
    matchesCount: session.matches.length,
  });

  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        currentMatch: {
          scoreA: 0,
          scoreB: 0,
          server: null,
        },
        historyStack,
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath(`/score/${id}`);
  revalidatePath("/score");
}

export async function completeSession(id: string) {
  const col = await getCollection("sessions");
  await col.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "completed",
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath(`/score/${id}`);
  revalidatePath("/score");
}

export async function getRecentSessions(): Promise<SessionScoreOutput[]> {
  try {
    const col = await getCollection("sessions");
    const docs = await col
      .find({})
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();
    return docs.map(serializeSession);
  } catch (error) {
    console.error("Error fetching recent sessions:", error);
    return [];
  }
}
