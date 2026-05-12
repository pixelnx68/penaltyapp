"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getCollection } from "../mongodb";

export async function getPlayers() {
  const col = await getCollection("players");
  const docs = await col.find({}).sort({ name: 1 }).toArray();
  return docs.map((d) => ({
    _id: d._id.toString(),
    name: d.name,
    phone: d.phone || undefined,
    createdAt: d.createdAt.toISOString(),
  }));
}

export async function addPlayer(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || undefined;
  if (!name) throw new Error("Name is required");

  const col = await getCollection("players");
  await col.insertOne({ name, phone, createdAt: new Date() });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/payments");
  revalidatePath("/ledger");
}

export async function updatePlayer(_prevState: unknown, formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || undefined;
  if (!id || !name) throw new Error("Missing required fields");

  const col = await getCollection("players");
  const update: Record<string, string> = { name };
  if (phone !== undefined) update.phone = phone;
  await col.updateOne({ _id: new ObjectId(id) }, { $set: update });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/payments");
  revalidatePath("/ledger");
}

export async function deletePlayer(id: string) {
  const col = await getCollection("players");
  const penaltiesCol = await getCollection("penalties");

  await penaltiesCol.deleteMany({ playerId: new ObjectId(id) });
  await col.deleteOne({ _id: new ObjectId(id) });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/payments");
  revalidatePath("/ledger");
}
