import { Sparkles, Zap, Crown } from "lucide-react";

export type TierId = "free" | "pro" | "ultra";

export const PLANS: {
  id: TierId;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  icon: typeof Sparkles;
  highlight?: boolean;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Starter",
    price: "$0",
    cadence: "forever",
    tagline: "Try Macro Chef with the essentials.",
    icon: Sparkles,
    features: [
      "1 active meal plan",
      "Basic macro targets",
      "Up to 3 saved plans",
      "Community recipes",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    cadence: "per month",
    tagline: "For people serious about hitting their macros.",
    icon: Zap,
    highlight: true,
    features: [
      "Unlimited meal plans",
      "Smart grocery lists",
      "Cravings & exclusions tuning",
      "Priority AI generation",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    price: "$19",
    cadence: "per month",
    tagline: "Coach-level personalization with every meal.",
    icon: Crown,
    features: [
      "Everything in Pro",
      "Weekly auto-regeneration",
      "Advanced macro analytics",
      "Early access to new agents",
    ],
  },
];

export function planName(id?: string | null) {
  return PLANS.find((p) => p.id === id)?.name ?? "Starter";
}
