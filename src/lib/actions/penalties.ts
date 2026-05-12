"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getCollection } from "../mongodb";
import { Penalty } from "../models/penalty";

export async function getPlayerByPhone(phone: string) {
  const col = await getCollection("players");
  const player = await col.findOne({ phone });
  if (!player) return null;

  const penaltiesCol = await getCollection("penalties");
  const penalties = await penaltiesCol
    .find({ playerId: player._id })
    .sort({ date: -1 })
    .toArray();

  const totalUnpaid = penalties.reduce((sum, p) => {
    if (p.status === "paid") return sum;
    return sum + (p.amount - p.paidAmount);
  }, 0);

  return {
    name: player.name,
    totalUnpaid: Math.round(totalUnpaid * 100) / 100,
    penalties: penalties.map((p) => ({
      date: p.date,
      time: p.time,
      amount: p.amount,
      paidAmount: p.paidAmount,
      status: p.status,
      remaining: p.amount - p.paidAmount,
    })),
  };
}

export async function getPenalty(playerId: string, date: string) {
  const col = await getCollection("penalties");
  return col.findOne({ playerId: new ObjectId(playerId), date }) as Promise<Penalty | null>;
}

export async function logPenalty(playerId: string, date: string, amount: number, time?: string) {
  const col = await getCollection("penalties");

  const existing = await col.findOne({ playerId: new ObjectId(playerId), date });
  if (existing) throw new Error("Penalty already exists for this player on this date");

  await col.insertOne({
    playerId: new ObjectId(playerId),
    date,
    time,
    amount,
    paidAmount: 0,
    status: "unpaid",
  });

  revalidatePath("/");
  revalidatePath("/log");
  revalidatePath("/ledger");
  revalidatePath("/payments");
}

export async function getDailyPenalties(date: string) {
  const col = await getCollection("penalties");
  const penalties = await col.find({ date }).toArray();
  const penaltyMap = new Map<string, { _id: string; playerId: string; date: string; time?: string; amount: number; paidAmount: number; status: string }>();
  for (const p of penalties) {
    penaltyMap.set(p.playerId.toString(), {
      _id: p._id.toString(),
      playerId: p.playerId.toString(),
      date: p.date,
      time: p.time,
      amount: p.amount,
      paidAmount: p.paidAmount,
      status: p.status,
    });
  }
  return penaltyMap;
}

export async function getLedger() {
  const playersCol = await getCollection("players");
  const penaltiesCol = await getCollection("penalties");

  const players = await playersCol.find({}).sort({ name: 1 }).toArray();
  const pipeline = [
    { $match: { status: { $ne: "paid" } } },
    {
      $group: {
        _id: "$playerId",
        totalUnpaid: { $sum: { $subtract: ["$amount", "$paidAmount"] } },
      },
    },
  ];

  const debts = await penaltiesCol.aggregate(pipeline).toArray();

  const ledger = players.map((p) => {
    const debt = debts.find((d) => d._id.toString() === p._id.toString());
    return {
      _id: p._id.toString(),
      name: p.name,
      phone: p.phone || undefined,
      totalUnpaid: debt ? Math.round(debt.totalUnpaid * 100) / 100 : 0,
    };
  });

  return ledger.filter((p) => p.totalUnpaid > 0);
}

export async function processPayment(playerId: string, amount: number) {
  const penaltiesCol = await getCollection("penalties");

  const unpaidPenalties = await penaltiesCol
    .find({
      playerId: new ObjectId(playerId),
      status: { $ne: "paid" },
    })
    .sort({ date: 1 })
    .toArray();

  let remaining = amount;
  const results: { date: string; amount: number; status: string }[] = [];

  for (const penalty of unpaidPenalties) {
    if (remaining <= 0) break;

    const owed = penalty.amount - penalty.paidAmount;
    const allocation = Math.min(owed, remaining);
    const newPaidAmount = penalty.paidAmount + allocation;
    remaining -= allocation;

    let newStatus: string;
    if (newPaidAmount >= penalty.amount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partial";
    } else {
      newStatus = "unpaid";
    }

    await penaltiesCol.updateOne(
      { _id: penalty._id },
      { $set: { paidAmount: newPaidAmount, status: newStatus } }
    );

    results.push({ date: penalty.date, amount: allocation, status: newStatus });
  }

  revalidatePath("/payments");
  revalidatePath("/ledger");
  revalidatePath("/");

  return {
    allocated: amount - remaining,
    remaining,
    allocation: results,
  };
}
