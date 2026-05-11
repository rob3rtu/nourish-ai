import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Plus, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/plans/")({
  component: PlansLibrary,
});

function PlansLibrary() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activate = async (id: string) => {
    await supabase.from("meal_plans").update({ is_active: false }).eq("user_id", user!.id).eq("is_active", true);
    await supabase.from("meal_plans").update({ is_active: true }).eq("id", id);
    toast.success("Plan activated");
    qc.invalidateQueries({ queryKey: ["plans"] });
    qc.invalidateQueries({ queryKey: ["active-plan"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await supabase.from("meal_plans").delete().eq("id", id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["plans"] });
    qc.invalidateQueries({ queryKey: ["active-plan"] });
  };

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl">Plan library</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse and re-activate any plan.</p>
        </div>
        <Link to="/generate" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> New plan
        </Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !plans?.length ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <BookMarked className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No plans yet — create your first.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {plans.map((p) => {
              const data = p.plan_data as any;
              const dayCount = data?.days?.length ?? 1;
              return (
                <div key={p.id} className="group rounded-2xl border border-border bg-card p-5 transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <Link to="/plans/$planId" params={{ planId: p.id }} className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl">{p.title}</h2>
                        {p.is_active && <CheckCircle2 className="h-4 w-4 text-success" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dayCount} day{dayCount > 1 ? "s" : ""} · {p.total_calories ?? "—"} kcal/day · {new Date(p.created_at).toLocaleDateString()}
                      </p>
                      {p.cravings && <p className="mt-2 text-sm text-muted-foreground line-clamp-1">"{p.cravings}"</p>}
                    </Link>
                    <button onClick={() => remove(p.id)} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {!p.is_active && (
                      <button onClick={() => activate(p.id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                        Activate
                      </button>
                    )}
                    <Link to="/plans/$planId" params={{ planId: p.id }} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium">
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
