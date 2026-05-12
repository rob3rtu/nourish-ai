import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PLANS, type TierId } from "@/lib/plans";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  component: Billing,
});

function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pending, setPending] = useState<TierId | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const current = (profile?.subscription_tier as TierId) ?? "free";

  async function activate(tier: TierId) {
    if (!user || tier === current) return;
    setPending(tier);
    // Simulated checkout — no payment processor.
    await new Promise((r) => setTimeout(r, 600));
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: tier })
      .eq("id", user.id);
    setPending(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`You're on ${PLANS.find((p) => p.id === tier)!.name}.`);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    navigate({ to: "/dashboard" });
  }

  if (isLoading) {
    return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="mt-4 font-display text-4xl">Choose your plan</h1>
        <p className="mt-2 text-muted-foreground">
          Demo billing — no credit card required. Switch tiers anytime to test the experience.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = current === plan.id;
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                plan.highlight ? "border-primary shadow-xl shadow-primary/15" : "border-border"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Most popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs text-success-foreground">
                    Current
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-display text-2xl">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.cadence}</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent || pending !== null}
                onClick={() => activate(plan.id)}
                className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:translate-y-[-1px]"
                    : "border border-border bg-background hover:bg-secondary"
                }`}
              >
                {pending === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  "Active plan"
                ) : plan.id === "free" ? (
                  "Downgrade to Starter"
                ) : (
                  `Activate ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        This is a demo. No payment is collected and no real subscription is created.
      </p>
    </div>
  );
}
