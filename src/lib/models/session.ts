import { ObjectId } from "mongodb";

export interface MatchRecord {
  matchNumber: number;
  scoreA: number;
  scoreB: number;
  winner: "A" | "B";
  timestamp: Date;
}

export interface SessionHistoryItem {
  currentMatch: {
    scoreA: number;
    scoreB: number;
    server: "A" | "B" | null;
  };
  matchesCount: number;
}

export interface SessionScore {
  _id: ObjectId;
  teamAName: string;
  teamBName: string;
  createdAt: Date;
  updatedAt: Date;
  matches: MatchRecord[];
  currentMatch: {
    scoreA: number;
    scoreB: number;
    server: "A" | "B" | null;
  };
  winByTwo: boolean;
  status: "active" | "completed";
  historyStack?: SessionHistoryItem[];
}

export interface SessionScoreOutput {
  _id: string;
  teamAName: string;
  teamBName: string;
  createdAt: string;
  updatedAt: string;
  matches: {
    matchNumber: number;
    scoreA: number;
    scoreB: number;
    winner: "A" | "B";
    timestamp: string;
  }[];
  currentMatch: {
    scoreA: number;
    scoreB: number;
    server: "A" | "B" | null;
  };
  winByTwo: boolean;
  status: "active" | "completed";
  historyStack?: {
    currentMatch: {
      scoreA: number;
      scoreB: number;
      server: "A" | "B" | null;
    };
    matchesCount: number;
  }[];
}
