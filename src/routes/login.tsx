import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Salad, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).default("signin").catch("signin"),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate({ to: "/dashboard" });
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } =
      mode === "signup"
        ? await signUp(email, password, fullName)
        : await signIn(email, password);
    setBusy(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(mode === "signup" ? "Welcome to Nourish!" : "Welcome back");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between p-10 md:flex bg-gradient-to-br from-primary to-[oklch(0.35_0.1_152)] text-primary-foreground">
        <Link to="/" className="flex items-center gap-2">
          <Salad className="h-6 w-6" />
          <span className="font-display text-xl">Nourish</span>
        </Link>
        <div>
          <p className="font-display text-3xl leading-snug">
            "I finally know how much to eat — and what."
          </p>
          <p className="mt-3 text-sm opacity-80">
            Personalized macros + meals, in seconds.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden mb-6 flex items-center gap-2">
            <Salad className="h-5 w-5 text-primary" />
            <span className="font-display text-lg">Nourish</span>
          </Link>
          <h1 className="font-display text-3xl">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Start with your daily targets in under a minute."
              : "Sign in to continue your plan."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            )}
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <input
              required
              type="password"
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <Link
              to="/login"
              search={{ mode: mode === "signup" ? "signin" : "signup" }}
              className="font-medium text-primary"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
