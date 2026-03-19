"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { login, logout, signup } from "@lib/auth";
import { clearStoredSession, getStoredSession, setStoredSession } from "@lib/session";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState(() => getStoredSession());

  const isLoggedIn = Boolean(sessionState?.tokens.accessToken);

  const heading = useMemo(() => (mode === "signin" ? "Sign In" : "Create Account"), [mode]);

  async function submit() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signin") {
        const session = await login({ emailOrUsername: emailOrUsername.trim(), password });
        setStoredSession(session);
        setSessionState(session);
        setMessage(`Signed in as ${session.user.username}`);
      } else {
        const session = await signup({
          username: username.trim(),
          email: email.trim(),
          password,
        });
        setStoredSession(session);
        setSessionState(session);
        setMessage(`Account created for ${session.user.username}`);
      }
    } catch {
      setError("Authentication failed. Check your input and backend status.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const accessToken = sessionState?.tokens.accessToken;
    if (!accessToken) return;

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await logout(accessToken);
    } catch {
      // Ignore logout API failures; local session clear is still required.
    } finally {
      clearStoredSession();
      setSessionState(null);
      setBusy(false);
      setMessage("Signed out");
    }
  }

  return (
    <main className="grid min-h-[calc(100svh-52px)] grid-rows-[auto_1fr_auto] gap-3 p-4">
      <header className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-100">Authentication</h1>
        <p className="mt-1 text-sm text-slate-300">Create an account or sign in to unlock social invites and seat-bound games.</p>
      </header>

      <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/95 to-slate-800/70 p-4 shadow-xl">
        {!isLoggedIn ? (
          <>
            <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Auth mode">
              <Button type="button" variant={mode === "signin" ? "default" : "secondary"} onClick={() => setMode("signin")}>
                Sign In
              </Button>
              <Button type="button" variant={mode === "signup" ? "default" : "secondary"} onClick={() => setMode("signup")}>
                Sign Up
              </Button>
            </div>

            <h2 className="mb-3 text-xl font-semibold text-slate-100">{heading}</h2>

            <div className="grid gap-3">
              {mode === "signup" ? (
                <label className="grid gap-1 text-sm text-slate-300">
                  Username
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="chessmaster"
                  />
                </label>
              ) : (
                <label className="grid gap-1 text-sm text-slate-300">
                  Email or Username
                  <Input
                    value={emailOrUsername}
                    onChange={(event) => setEmailOrUsername(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
              )}

              {mode === "signup" ? (
                <label className="grid gap-1 text-sm text-slate-300">
                  Email
                  <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
              ) : null}

              <label className="grid gap-1 text-sm text-slate-300">
                Password
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>

              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={submit}
              >
                {busy ? "Working..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-3 text-xl font-semibold text-slate-100">Signed in as {sessionState?.user.username}</h2>
            <p className="mb-1 break-all text-sm text-slate-300">Email: {sessionState?.user.email}</p>
            <p className="mb-3 break-all text-sm text-slate-300">User ID: {sessionState?.user.id}</p>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={signOut}
            >
              {busy ? "Signing out..." : "Sign Out"}
            </Button>
          </>
        )}

        {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="secondary">
          <Link href="/lobby">Go to Lobby</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/arena">Go to Arena</Link>
        </Button>
      </div>
    </main>
  );
}
