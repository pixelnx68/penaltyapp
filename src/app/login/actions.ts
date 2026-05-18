"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(_prevState: { error?: string } | null, formData: FormData) {
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string || "/";

  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Incorrect password" };
  }

  const cookieStore = await cookies();
  cookieStore.set("penalty_auth", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90, // 3 months (90 days)
    path: "/",
  });

  redirect(redirectTo);
}
