"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";
import { Button, Input, Card } from "@/components/ui";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="w-full space-y-8 animate-in">
        <header className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-4 shadow-lg shadow-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Admin <span className="text-primary">Login</span>
          </h1>
          <p className="text-muted text-sm font-medium">
            Access the penalty management dashboard.
          </p>
        </header>

        <Card className="bg-surface/50 border-white/5 p-8">
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="redirect" value={redirectTo} />

            <div className="space-y-4">
              <Input
                id="password"
                name="password"
                type="password"
                label="Master Password"
                placeholder="••••••••"
                required
                autoFocus
                className="text-lg py-4"
              />

              {state?.error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500 font-medium animate-in">
                  {state.error}
                </div>
              )}
            </div>

            <Button
              type="submit"
              isLoading={pending}
              className="w-full py-4 text-lg"
            >
              Authenticate
            </Button>
          </form>
        </Card>
        
        <p className="text-center text-[10px] text-muted uppercase tracking-widest font-bold">
          Restricted Access Area
        </p>
      </div>
    </div>
  );
}
