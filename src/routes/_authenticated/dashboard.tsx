import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Target, Flame, ChefHat, Plus, Loader2, ArrowRight, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: activePlan } = useQuery({
    queryKey: ["active-plan", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: planCount } = useQuery({
    queryKey: ["plan-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("meal_plans")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && profile && !profile.onboarded) {
      navigate({ to: "/onboarding" });
    }
  }, [isLoading, profile, navigate]);

  if (isLoading || !profile) {
    return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const goalLabel = { lose: "Lose weight", maintain: "Maintain", gain: "Build mass" }[profile.weight_goal as "lose" | "maintain" | "gain"] ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Welcome back, {profile.full_name?.split(" ")[0] || "friend"}.</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's your nutrition snapshot.</p>
        </div>
        <Link to="/generate" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> New meal plan
        </Link>
      </div>

      {/* Targets */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Flame} label="Daily calories" value={profile.daily_calories ?? "—"} suffix="kcal" tone="primary" />
        <StatCard icon={Target} label="Protein" value={profile.protein_g ?? "—"} suffix="g" />
        <StatCard icon={Sparkles} label="Carbs" value={profile.carbs_g ?? "—"} suffix="g" />
        <StatCard icon={Activity} label="Fats" value={profile.fats_g ?? "—"} suffix="g" />
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Goal card */}
        <div className="rounded-2xl border border-border bg-card p-6 md:col-span-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your goal</div>
          <div className="mt-2 font-display text-2xl">{goalLabel}</div>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Current" value={`${profile.weight_kg ?? "—"} kg`} />
            {profile.target_weight_kg && <Row label="Target" value={`${profile.target_weight_kg} kg`} />}
            <Row label="Activity" value={profile.activity_level?.replace("_", " ") ?? "—"} />
            <Row label="BMR" value={`${profile.bmr ?? "—"} kcal`} />
            <Row label="TDEE" value={`${profile.tdee ?? "—"} kcal`} />
          </div>
          <ProgressToward profile={profile} />
          <Link to="/onboarding" className="mt-4 inline-flex text-sm font-medium text-primary">
            Edit goals →
          </Link>
        </div>

        {/* Active plan */}
        <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Active meal plan</div>
              <div className="mt-2 font-display text-2xl">{activePlan?.title ?? "No active plan"}</div>
            </div>
            {activePlan && <span className="rounded-full bg-success/15 px-3 py-1 text-xs text-success-foreground">Active</span>}
          </div>

          {activePlan ? (
            <ActivePlanPreview plan={activePlan} />
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
              <ChefHat className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Generate your first meal plan to see it here.</p>
              <Link to="/generate" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Create plan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{planCount ?? 0} saved {planCount === 1 ? "plan" : "plans"}</span>
            <Link to="/plans" className="font-medium text-primary">Open library →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, tone }: { icon: any; label: string; value: number | string; suffix?: string; tone?: "primary" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "primary" ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={`font-display text-3xl ${tone === "primary" ? "text-primary" : ""}`}>{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between"><span className="text-muted-foreground capitalize">{label}</span><span className="font-medium">{value}</span></div>
  );
}

function ProgressToward({ profile }: { profile: any }) {
  if (!profile.target_weight_kg || !profile.weight_kg) return null;
  const start = profile.weight_goal === "lose" ? Math.max(profile.weight_kg, profile.target_weight_kg + 10) : Math.min(profile.weight_kg, profile.target_weight_kg - 10);
  const total = Math.abs(start - profile.target_weight_kg);
  const done = Math.abs(start - profile.weight_kg);
  const pct = total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{Math.round(pct)}%</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ActivePlanPreview({ plan }: { plan: any }) {
  const data = plan.plan_data as any;
  const day1 = data?.days?.[0];
  if (!day1) return null;
  return (
    <div className="mt-5 space-y-2">
      {day1.meals.map((m: any, i: number) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.type}</div>
            <div className="font-medium">{m.name}</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-display text-lg text-primary">{m.calories}</div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </div>
        </div>
      ))}
      <Link to="/plans/$planId" params={{ planId: plan.id }} className="inline-flex pt-2 text-sm font-medium text-primary">
        View full plan →
      </Link>
    </div>
  );
}
