"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-bold text-center">Penalty Tracker</h1>
        <p className="mb-8 text-center text-gray-500 text-sm">
          Volleyball late arrival log
        </p>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirect" value={redirectTo} />

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Admin Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {state?.error && (
            <p className="text-red-600 text-sm">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-black py-3 text-white font-medium text-base disabled:opacity-50"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
