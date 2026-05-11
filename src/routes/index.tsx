import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Salad, LineChart, ChefHat } from "lucide-react";
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
          <span className="font-display text-xl font-semibold">Nourish</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
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
              Two AI agents work together — one calculates your exact daily calories and macros,
              the other turns them into recipes you'll actually want to cook.
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

        <section id="how" className="mt-28 grid gap-6 md:grid-cols-3">
          {[
            { icon: LineChart, t: "Agent 1 · Analyst", d: "Calculates BMR, TDEE and your exact daily macros from age, weight, activity, and goal." },
            { icon: ChefHat, t: "Agent 2 · Chef", d: "Turns those numbers into a structured plan with recipes, portions, and a grocery list." },
            { icon: Sparkles, t: "Save & re-activate", d: "Build a library of plans. Reuse the ones that work for you anytime." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
