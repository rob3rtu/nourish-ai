import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ShoppingBasket, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/plans/$planId")({
  component: PlanDetail,
});

function PlanDetail() {
  const { planId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dayIdx, setDayIdx] = useState(0);

  const { data: plan, isLoading } = useQuery({
    queryKey: ["plan", planId],
    queryFn: async () => {
      const { data, error } = await supabase.from("meal_plans").select("*").eq("id", planId).single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !plan) {
    return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const data = plan.plan_data as any;
  const days = data.days as Array<{ day: number; meals: any[] }>;
  const grocery = (plan.grocery_list ?? []) as Array<{ category: string; items: string[] }>;
  const day = days[dayIdx];
  const dayTotals = day.meals.reduce(
    (a, m) => ({ c: a.c + m.calories, p: a.p + m.protein_g, ca: a.ca + m.carbs_g, f: a.f + m.fats_g }),
    { c: 0, p: 0, ca: 0, f: 0 }
  );

  const activate = async () => {
    await supabase.from("meal_plans").update({ is_active: false }).eq("user_id", user!.id).eq("is_active", true);
    await supabase.from("meal_plans").update({ is_active: true }).eq("id", plan.id);
    toast.success("Plan activated");
    qc.invalidateQueries();
  };

  const remove = async () => {
    if (!confirm("Delete this plan?")) return;
    await supabase.from("meal_plans").delete().eq("id", plan.id);
    qc.invalidateQueries();
    navigate({ to: "/plans" });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/plans" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Library
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl">{plan.title}</h1>
              {plan.is_active && <span className="rounded-full bg-success/15 px-3 py-1 text-xs text-success-foreground">Active</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {days.length} day{days.length > 1 ? "s" : ""} · created {new Date(plan.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {!plan.is_active && (
              <button onClick={activate} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                <CheckCircle2 className="h-4 w-4" /> Activate
              </button>
            )}
            <button onClick={remove} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {days.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => setDayIdx(i)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm transition ${i === dayIdx ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary/40"}`}
            >
              Day {d.day}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Calories" value={dayTotals.c} suffix="kcal" />
        <Stat label="Protein" value={dayTotals.p} suffix="g" />
        <Stat label="Carbs" value={dayTotals.ca} suffix="g" />
        <Stat label="Fats" value={dayTotals.f} suffix="g" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          {day.meals.map((m, i) => (
            <article key={i} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.type}</div>
                  <h3 className="font-display text-2xl">{m.name}</h3>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <Mini label="kcal" v={m.calories} />
                  <Mini label="P" v={m.protein_g} />
                  <Mini label="C" v={m.carbs_g} />
                  <Mini label="F" v={m.fats_g} />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold">Ingredients</h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    {m.ingredients.map((ing: any, j: number) => (
                      <li key={j} className="flex justify-between border-b border-border/60 py-1">
                        <span>{ing.item}</span>
                        <span className="text-muted-foreground">{ing.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Instructions</h4>
                  <ol className="mt-2 space-y-2 text-sm">
                    {m.instructions.map((ins: string, j: number) => (
                      <li key={j} className="flex gap-2">
                        <span className="font-display text-primary">{j + 1}.</span>
                        <span className="text-muted-foreground">{ins}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="md:sticky md:top-20 md:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-primary" />
              <h3 className="font-display text-xl">Grocery list</h3>
            </div>
            <div className="mt-4 space-y-4">
              {grocery.map((g, i) => (
                <div key={i}>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{g.category}</div>
                  <ul className="mt-1 space-y-1 text-sm">
                    {g.items.map((it, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-2xl text-primary">{value}</span>
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}

function Mini({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-secondary px-2 py-1.5">
      <div className="font-display text-base">{v}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
