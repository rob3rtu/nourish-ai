import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { generateMealPlan } from "@/lib/agents.functions";

export const Route = createFileRoute("/_authenticated/generate")({
  component: GeneratePage,
});

function GeneratePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const generate = useServerFn(generateMealPlan);
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState<"day" | "week">("day");
  const [cravings, setCravings] = useState("");
  const [excluded, setExcluded] = useState("");
  const [makeActive, setMakeActive] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  if (!profile?.daily_calories) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Set your goals first.</p>
        <button onClick={() => navigate({ to: "/onboarding" })} className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground">Open onboarding</button>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      const allExcluded = [
        ...(profile.excluded_ingredients ?? []),
        ...excluded.split(",").map((s) => s.trim()).filter(Boolean),
      ].join(", ");

      const result = await generate({
        data: {
          daily_calories: profile.daily_calories!,
          protein_g: profile.protein_g!,
          carbs_g: profile.carbs_g!,
          fats_g: profile.fats_g!,
          dietary_preferences: profile.dietary_preferences ?? [],
          excluded_ingredients: allExcluded,
          cravings,
          duration,
        },
      });

      if (makeActive) {
        await supabase.from("meal_plans").update({ is_active: false }).eq("user_id", user!.id).eq("is_active", true);
      }

      const { data: inserted, error } = await supabase.from("meal_plans").insert({
        user_id: user!.id,
        title: result.title,
        cravings,
        excluded: allExcluded,
        plan_data: { days: result.days } as any,
        grocery_list: result.grocery_list as any,
        total_calories: result.total_calories,
        is_active: makeActive,
      }).select().single();

      if (error) throw error;
      toast.success("Plan ready!");
      navigate({ to: "/plans/$planId", params: { planId: inserted!.id } });
    } catch (e: any) {
      toast.error("Generation failed", { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl">Create a meal plan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Targeting {profile.daily_calories} kcal · {profile.protein_g}P / {profile.carbs_g}C / {profile.fats_g}F
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Duration</label>
          <div className="grid grid-cols-2 gap-2">
            {(["day", "week"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`rounded-lg border px-3 py-2.5 text-sm capitalize ${duration === d ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-secondary/40"}`}
              >
                {d === "day" ? "1 day" : "7 days"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Cravings or notes (optional)</label>
          <textarea
            value={cravings}
            onChange={(e) => setCravings(e.target.value)}
            rows={3}
            placeholder="Crave Mediterranean flavors, like quick lunches I can meal-prep…"
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Extra exclusions for this plan (optional)</label>
          <input
            value={excluded}
            onChange={(e) => setExcluded(e.target.value)}
            placeholder="mushrooms, tofu"
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={makeActive} onChange={(e) => setMakeActive(e.target.checked)} className="accent-primary" />
          Set as active plan
        </label>

        <button
          onClick={submit}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Cooking up your plan…" : "Generate plan"}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
        <ChefHat className="mt-0.5 h-4 w-4 shrink-0" />
        Generation usually takes 10–25 seconds. The chef agent writes recipes, computes macros, and assembles a grocery list.
      </div>
    </div>
  );
}
