import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Salad,
  LineChart,
  ChefHat,
  Target,
  ShoppingBasket,
  Clock,
  Shield,
  Repeat,
  Flame,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Salad className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold">Macro Chef</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <a href="#features" className="hidden text-muted-foreground hover:text-foreground sm:inline">Features</a>
          <a href="#how" className="hidden text-muted-foreground hover:text-foreground sm:inline">How it works</a>
          <a href="#faq" className="hidden text-muted-foreground hover:text-foreground sm:inline">FAQ</a>
          {user ? (
            <Link to="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link>
              <Link to="/login" search={{ mode: "signup" }} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        {/* HERO */}
        <section className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              AI nutrition, built around your body
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-6xl">
              Eat for the goal,<br />
              <span className="text-primary">not the trend.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Macro Chef pairs two AI agents — an analyst that calculates your exact daily
              calories and macros, and a chef that turns those numbers into recipes
              you'll actually want to cook.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={user ? "/dashboard" : "/login"}
                search={user ? undefined : { mode: "signup" }}
                className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:translate-y-[-1px]"
              >
                {user ? "Open dashboard" : "Start free"}
              </Link>
              <a href="#how" className="rounded-xl border border-border bg-card px-6 py-3 font-medium">
                How it works
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required · Cancel anytime</p>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Today's plan</span>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success-foreground">On target</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { l: "Calories", v: "1,840", c: "text-primary" },
                  { l: "Protein", v: "142g", c: "text-accent-foreground" },
                  { l: "Carbs", v: "180g", c: "text-foreground" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl bg-secondary p-3">
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                    <div className={`mt-1 font-display text-2xl ${s.c}`}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                {[
                  ["Breakfast", "Greek yogurt bowl, berries, almonds"],
                  ["Lunch", "Grilled chicken & quinoa salad"],
                  ["Dinner", "Salmon, roasted veg, sweet potato"],
                ].map(([t, d]) => (
                  <div key={t} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <div>
                      <div className="text-xs text-muted-foreground">{t}</div>
                      <div className="text-sm font-medium">{d}</div>
                    </div>
                    <ChefHat className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-4 -top-4 hidden h-24 w-24 rounded-full bg-accent/40 blur-2xl md:block" />
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="mt-20 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card/60 p-6 md:grid-cols-4">
          {[
            { v: "2", l: "AI agents working together" },
            { v: "30s", l: "Average plan generation" },
            { v: "100%", l: "Personalized to your macros" },
            { v: "∞", l: "Plans saved in your library" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-3xl text-primary">{s.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </section>

        {/* FEATURES */}
        <section id="features" className="mt-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl">Everything you need to eat with intention.</h2>
            <p className="mt-3 text-muted-foreground">
              Macro Chef isn't another recipe app. It's a system that turns your goals into
              numbers, and your numbers into a week of meals.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Target, t: "Goal-driven targets", d: "Lose, maintain, or gain — we calculate the exact daily calories and macros that match your goal and timeline." },
              { icon: Flame, t: "BMR & TDEE engine", d: "Mifflin-St Jeor formula plus an activity multiplier, so your numbers reflect how you actually live." },
              { icon: ChefHat, t: "Real recipes, not lists", d: "Every meal comes with ingredients, portions, and step-by-step instructions calibrated to your macros." },
              { icon: ShoppingBasket, t: "One-tap grocery list", d: "Each plan ships with a consolidated shopping list grouped by section. No more scrolling through 21 recipes." },
              { icon: Repeat, t: "Reusable plan library", d: "Save the plans that work and re-activate them in one click. Build a personal cookbook around your goals." },
              { icon: Shield, t: "Private by default", d: "Your data stays in your account. Plans, profile and progress are visible only to you." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-6 transition hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/10">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="mt-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl">Two agents. One plan that fits you.</h2>
            <p className="mt-3 text-muted-foreground">
              Most nutrition apps either crunch numbers or suggest recipes. Macro Chef does both,
              and hands the result off seamlessly between two specialized AI agents.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: LineChart, n: "01", t: "Agent 1 · Analyst", d: "Reads your age, weight, height, activity level and goal. Returns calories, protein, carbs and fats with a clear rationale." },
              { icon: ChefHat, n: "02", t: "Agent 2 · Chef", d: "Receives the analyst's targets and generates a structured weekly plan: breakfast, lunch, dinner, snacks — with full recipes." },
              { icon: Sparkles, n: "03", t: "You · In control", d: "Activate, save, swap, or regenerate. Your dashboard tracks the active plan and your progress toward the goal." },
            ].map(({ icon: Icon, n, t, d }) => (
              <div key={t} className="relative rounded-2xl border border-border bg-card p-6">
                <span className="absolute right-5 top-5 font-display text-3xl text-primary/20">{n}</span>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="mt-24 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-4xl">Built for people with a number in mind.</h2>
              <p className="mt-4 text-muted-foreground">
                Whether you're cutting for summer, bulking for the gym, or just trying to
                hit your protein consistently — Macro Chef removes the guesswork between
                "I have a goal" and "what's for dinner."
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Cut weight without losing muscle",
                "Lean bulk on a calculated surplus",
                "Maintain while hitting protein targets",
                "Ditch generic meal plans for one tailored to you",
              ].map((x) => (
                <li key={x} className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm">{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-24">
          <h2 className="font-display text-4xl">Frequently asked</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              { q: "Do I need to count calories myself?", a: "No. The analyst agent calculates your daily calories and macros from your profile. You just cook the plan." },
              { q: "Can I save and reuse plans?", a: "Yes. Every plan you generate lives in your library. Re-activate any of them in one click." },
              { q: "What if my goal changes?", a: "Update your profile and generate a new plan — Macro Chef recalculates targets instantly." },
              { q: "Is my data private?", a: "Your profile and plans are tied to your account and protected by row-level security. Only you can see them." },
            ].map((f) => (
              <div key={f.q} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-lg">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-24 overflow-hidden rounded-3xl border border-border bg-primary p-10 text-primary-foreground md:p-14">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-display text-4xl leading-tight">Your next meal plan is two minutes away.</h2>
              <p className="mt-3 max-w-xl text-primary-foreground/80">
                Tell Macro Chef your goal once. Generate plans on demand, forever.
              </p>
            </div>
            <Link
              to={user ? "/dashboard" : "/login"}
              search={user ? undefined : { mode: "signup" }}
              className="inline-flex items-center justify-center rounded-xl bg-background px-6 py-3 font-medium text-foreground shadow-lg transition hover:translate-y-[-1px]"
            >
              {user ? "Open dashboard" : "Start free"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Salad className="h-4 w-4" />
            </span>
            <span className="font-display text-base text-foreground">Macro Chef</span>
          </Link>
          <p>© {new Date().getFullYear()} Macro Chef. Eat with intention.</p>
        </div>
      </footer>
    </div>
  );
}
