import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const profileSchema = z.object({
  age: z.number().int().min(10).max(100),
  gender: z.enum(["male", "female", "other"]),
  weight_kg: z.number().min(30).max(300),
  height_cm: z.number().min(100).max(250),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  weight_goal: z.enum(["lose", "maintain", "gain"]),
  target_weight_kg: z.number().min(30).max(300).optional(),
  dietary_preferences: z.array(z.string()).default([]),
});

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  return createLovableAiGatewayProvider(key)("google/gemini-3-flash-preview");
}

// Agent 1: Profile & Goal Analyst
export const analyzeProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ data }) => {
    // Compute BMR (Mifflin-St Jeor)
    const { age, gender, weight_kg, height_cm, activity_level, weight_goal } = data;
    const baseBmr = 10 * weight_kg + 6.25 * height_cm - 5 * age;
    const bmr = Math.round(gender === "male" ? baseBmr + 5 : gender === "female" ? baseBmr - 161 : baseBmr - 78);
    const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = Math.round(bmr * factors[activity_level]);
    const adjust = weight_goal === "lose" ? -500 : weight_goal === "gain" ? 400 : 0;
    const fallbackCalories = Math.max(1200, tdee + adjust);

    const model = getModel();
    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          daily_calories: z.number().int(),
          protein_g: z.number().int(),
          carbs_g: z.number().int(),
          fats_g: z.number().int(),
          rationale: z.string(),
        }),
      }),
      prompt: `You are a registered dietitian. Given:
- Age ${age}, Gender ${gender}, Weight ${weight_kg}kg, Height ${height_cm}cm
- Activity: ${activity_level}, Goal: ${weight_goal}
- BMR (Mifflin-St Jeor): ${bmr} kcal
- TDEE: ${tdee} kcal
- Suggested daily calories with goal adjustment: ${fallbackCalories} kcal
- Dietary preferences: ${data.dietary_preferences.join(", ") || "none"}

Set daily macro targets (protein, carbs, fats in grams) appropriate to the goal.
Use roughly: lose=higher protein (~1.8g/kg), gain=higher carbs (~50%), maintain=balanced.
Macros should sum to ~daily_calories (4 kcal/g protein+carbs, 9 kcal/g fat).
Give a short 1-2 sentence rationale.`,
    });

    return { bmr, tdee, ...output };
  });

// Agent 2: Meal Planner & Chef
const planInputSchema = z.object({
  daily_calories: z.number().int(),
  protein_g: z.number().int(),
  carbs_g: z.number().int(),
  fats_g: z.number().int(),
  dietary_preferences: z.array(z.string()).default([]),
  excluded_ingredients: z.string().default(""),
  cravings: z.string().default(""),
  duration: z.enum(["day", "week"]).default("day"),
});

export const generateMealPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => planInputSchema.parse(d))
  .handler(async ({ data }) => {
    const model = getModel();
    const days = data.duration === "week" ? 7 : 1;

    const mealSchema = z.object({
      name: z.string(),
      type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
      calories: z.number().int(),
      protein_g: z.number().int(),
      carbs_g: z.number().int(),
      fats_g: z.number().int(),
      ingredients: z.array(z.object({ item: z.string(), amount: z.string() })),
      instructions: z.array(z.string()),
    });

    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          title: z.string(),
          days: z.array(z.object({
            day: z.number().int(),
            meals: z.array(mealSchema),
          })).min(1),
          grocery_list: z.array(z.object({
            category: z.string(),
            items: z.array(z.string()),
          })),
        }),
      }),
      prompt: `You are a chef-nutritionist. Build a ${days}-day meal plan that hits these daily targets:
- Calories: ${data.daily_calories}
- Protein: ${data.protein_g}g, Carbs: ${data.carbs_g}g, Fats: ${data.fats_g}g

Dietary preferences: ${data.dietary_preferences.join(", ") || "none"}
Excluded ingredients: ${data.excluded_ingredients || "none"}
User cravings/notes: ${data.cravings || "none"}

For each day include 3 meals (breakfast, lunch, dinner) + 1 snack.
Each meal needs realistic recipe: ingredients with amounts (e.g. "150 g"), 3-6 step instructions, and accurate macros.
Daily macro totals should be within ~10% of targets.
Provide a consolidated grocery list grouped by category (Produce, Protein, Dairy, Pantry, Other).
Title should be catchy and reflect the plan style.`,
    });

    const total = output.days[0]?.meals.reduce((s, m) => s + m.calories, 0) ?? data.daily_calories;
    return { ...output, total_calories: total };
  });
