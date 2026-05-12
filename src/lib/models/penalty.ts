import { ObjectId } from "mongodb";

export type PenaltyStatus = "unpaid" | "partial" | "paid";

export interface Penalty {
  _id: ObjectId;
  playerId: ObjectId;
  date: string;
  time?: string;
  amount: number;
  paidAmount: number;
  status: PenaltyStatus;
}

export interface PlayerWithDebt {
  _id: string;
  name: string;
  phone?: string;
  totalUnpaid: number;
}
