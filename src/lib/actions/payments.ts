"use server";

import { ObjectId } from "mongodb";
import { getCollection } from "../mongodb";

export interface PaymentRecord {
  _id: string;
  playerId: string;
  playerName: string;
  date: string;
  amount: number;
  allocations: { penaltyDate: string; amount: number }[];
  createdAt: string;
}

export async function getPaymentHistory(): Promise<PaymentRecord[]> {
  const paymentsCol = await getCollection("payments");
  const playersCol = await getCollection("players");

  const payments = await paymentsCol
    .find({})
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  const players = await playersCol.find({}).toArray();
  const playerMap = new Map(players.map((p) => [p._id.toString(), p.name]));

  return payments.map((p) => ({
    _id: p._id.toString(),
    playerId: p.playerId.toString(),
    playerName: playerMap.get(p.playerId.toString()) || "Unknown",
    date: p.date,
    amount: p.amount,
    allocations: p.allocations || [],
    createdAt: p.createdAt?.toISOString() || "",
  }));
}
