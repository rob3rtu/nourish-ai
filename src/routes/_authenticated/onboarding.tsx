import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { analyzeProfile } from "@/lib/agents.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingWizard,
});

const DIETS = ["Vegetarian", "Vegan", "Pescatarian", "Keto", "Mediterranean", "Halal", "Kosher", "Gluten-free", "Dairy-free"];

function OnboardingWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const analyzeFn = useServerFn(analyzeProfile);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    age: 30,
    gender: "female" as "male" | "female" | "other",
    weight_kg: 70,
    height_cm: 170,
    activity_level: "moderate" as "sedentary" | "light" | "moderate" | "active" | "very_active",
    weight_goal: "maintain" as "lose" | "maintain" | "gain",
    target_weight_kg: 70,
    dietary_preferences: [] as string[],
    excluded_ingredients: "",
  });

  // Pre-fill from existing profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        full_name: profile.full_name ?? f.full_name,
        age: profile.age ?? f.age,
        gender: (profile.gender as any) ?? f.gender,
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : f.weight_kg,
        height_cm: profile.height_cm ? Number(profile.height_cm) : f.height_cm,
        activity_level: (profile.activity_level as any) ?? f.activity_level,
        weight_goal: (profile.weight_goal as any) ?? f.weight_goal,
        target_weight_kg: profile.target_weight_kg ? Number(profile.target_weight_kg) : f.target_weight_kg,
        dietary_preferences: profile.dietary_preferences ?? f.dietary_preferences,
        excluded_ingredients: profile.excluded_ingredients?.join(", ") ?? f.excluded_ingredients,
      }));
    }
  }, [profile]);

  const steps = [
    { title: "About you", desc: "Some basics so we can do the math right." },
    { title: "Body & activity", desc: "Used to calculate your energy needs." },
    { title: "Your goal", desc: "Where you want to go from here." },
    { title: "Food preferences", desc: "Anything we should keep in or out?" },
  ];

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setBusy(true);
    try {
      const result = await analyzeFn({
        data: {
          age: form.age,
          gender: form.gender,
          weight_kg: form.weight_kg,
          height_cm: form.height_cm,
          activity_level: form.activity_level,
          weight_goal: form.weight_goal,
          target_weight_kg: form.target_weight_kg,
          dietary_preferences: form.dietary_preferences,
        },
      });

      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name,
        age: form.age,
        gender: form.gender,
        weight_kg: form.weight_kg,
        height_cm: form.height_cm,
        activity_level: form.activity_level,
        weight_goal: form.weight_goal,
        target_weight_kg: form.target_weight_kg,
        dietary_preferences: form.dietary_preferences,
        excluded_ingredients: form.excluded_ingredients
          ? form.excluded_ingredients.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        bmr: result.bmr,
        tdee: result.tdee,
        daily_calories: result.daily_calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fats_g: result.fats_g,
        onboarded: true,
      }).eq("id", user!.id);

      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Targets calculated!", { description: result.rationale });
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error("Failed to calculate targets", { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  const update = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {steps.length}</span>
          <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
        <h1 className="font-display text-3xl">{steps[step].title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{steps[step].desc}</p>

        <div className="mt-8 space-y-4">
          {step === 0 && (
            <>
              <Field label="Your name">
                <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className={inputCls} placeholder="Alex" />
              </Field>
              <Field label="Age">
                <input type="number" min={10} max={100} value={form.age} onChange={(e) => update("age", Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Gender">
                <Segmented value={form.gender} onChange={(v) => update("gender", v as any)} options={[["female","Female"],["male","Male"],["other","Other"]]} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label={`Weight: ${form.weight_kg} kg`}>
                <input type="range" min={30} max={200} value={form.weight_kg} onChange={(e) => update("weight_kg", Number(e.target.value))} className="w-full accent-primary" />
              </Field>
              <Field label={`Height: ${form.height_cm} cm`}>
                <input type="range" min={120} max={220} value={form.height_cm} onChange={(e) => update("height_cm", Number(e.target.value))} className="w-full accent-primary" />
              </Field>
              <Field label="Activity level">
                <div className="space-y-2">
                  {[
                    ["sedentary", "Sedentary", "Little or no exercise"],
                    ["light", "Light", "1–3 workouts/week"],
                    ["moderate", "Moderate", "3–5 workouts/week"],
                    ["active", "Active", "6–7 workouts/week"],
                    ["very_active", "Very active", "Daily intense training"],
                  ].map(([v, t, d]) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => update("activity_level", v as any)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${form.activity_level === v ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}
                    >
                      <div>
                        <div className="font-medium">{t}</div>
                        <div className="text-xs text-muted-foreground">{d}</div>
                      </div>
                      {form.activity_level === v && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Goal">
                <Segmented value={form.weight_goal} onChange={(v) => update("weight_goal", v as any)} options={[["lose","Lose"],["maintain","Maintain"],["gain","Gain"]]} />
              </Field>
              {form.weight_goal !== "maintain" && (
                <Field label={`Target weight: ${form.target_weight_kg} kg`}>
                  <input type="range" min={30} max={200} value={form.target_weight_kg} onChange={(e) => update("target_weight_kg", Number(e.target.value))} className="w-full accent-primary" />
                </Field>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Dietary preferences (optional)">
                <div className="flex flex-wrap gap-2">
                  {DIETS.map((d) => {
                    const on = form.dietary_preferences.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => update("dietary_preferences", on ? form.dietary_preferences.filter((x) => x !== d) : [...form.dietary_preferences, d])}
                        className={`rounded-full px-3 py-1.5 text-sm transition ${on ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary/40"}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Excluded ingredients (comma-separated)">
                <input value={form.excluded_ingredients} onChange={(e) => update("excluded_ingredients", e.target.value)} className={inputCls} placeholder="cilantro, shellfish" />
              </Field>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button onClick={back} disabled={step === 0 || busy} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-muted-foreground disabled:opacity-30">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={next} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={busy} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Calculate my targets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-lg border px-3 py-2.5 text-sm capitalize transition ${value === v ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-secondary/40"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
