import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

function extractJSON(raw: string): unknown {
  let cleaned = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const objStart = cleaned.indexOf("{");
    const arrStart = cleaned.indexOf("[");
    const isArray = arrStart !== -1 && (objStart === -1 || arrStart < objStart);
    const start = isArray ? arrStart : objStart;
    const end = isArray ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON object found in AI response");
    cleaned = cleaned.slice(start, end + 1);
  }

  return JSON.parse(cleaned);
}

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
    try {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: z.object({
            daily_calories: z.number(),
            protein_g: z.number(),
            carbs_g: z.number(),
            fats_g: z.number(),
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
Give a short 1-2 sentence rationale. Return integers for all numeric fields.`,
      });
      return {
        bmr,
        tdee,
        daily_calories: Math.round(output.daily_calories),
        protein_g: Math.round(output.protein_g),
        carbs_g: Math.round(output.carbs_g),
        fats_g: Math.round(output.fats_g),
        rationale: output.rationale,
      };
    } catch (err) {
      console.error("analyzeProfile AI error, using deterministic fallback:", err);
      const proteinPerKg = weight_goal === "lose" ? 1.8 : weight_goal === "gain" ? 1.6 : 1.4;
      const protein_g = Math.round(weight_kg * proteinPerKg);
      const fats_g = Math.round((fallbackCalories * 0.25) / 9);
      const carbs_g = Math.max(50, Math.round((fallbackCalories - protein_g * 4 - fats_g * 9) / 4));
      return {
        bmr,
        tdee,
        daily_calories: fallbackCalories,
        protein_g,
        carbs_g,
        fats_g,
        rationale: `Targets computed from your BMR (${bmr}) and TDEE (${tdee}) with a ${weight_goal} adjustment.`,
      };
    }
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

const mealSchema = z.object({
  name: z.string(),
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fats_g: z.number(),
  ingredients: z.array(z.object({ item: z.string(), amount: z.string() })),
  instructions: z.array(z.string()),
});

const mealPlanSchema = z.object({
  title: z.string(),
  days: z.array(z.object({
    day: z.number(),
    meals: z.array(mealSchema),
  })).min(1),
  grocery_list: z.array(z.object({
    category: z.string(),
    items: z.array(z.string()),
  })),
});

function buildFallbackMealPlan(data: z.infer<typeof planInputSchema>, days: number) {
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
  const calorieSplit = [0.25, 0.35, 0.3, 0.1];
  const names = ["Greek Yogurt Protein Bowl", "Grilled Chicken Power Plate", "Salmon Rice Skillet", "Apple Almond Snack"];
  const grocery = new Map<string, Set<string>>([
    ["Produce", new Set(["mixed greens", "berries", "apples", "lemon"])],
    ["Protein", new Set(["Greek yogurt", "chicken breast", "salmon fillets"])],
    ["Pantry", new Set(["rolled oats", "brown rice", "almonds", "olive oil"])],
  ]);

  return {
    title: data.cravings ? `Balanced ${data.cravings} Meal Plan` : "Balanced Macro Meal Plan",
    days: Array.from({ length: days }, (_, dayIndex) => ({
      day: dayIndex + 1,
      meals: mealTypes.map((type, mealIndex) => {
        const calories = Math.round(data.daily_calories * calorieSplit[mealIndex]);
        return {
          name: names[mealIndex],
          type,
          calories,
          protein_g: Math.round(data.protein_g * calorieSplit[mealIndex]),
          carbs_g: Math.round(data.carbs_g * calorieSplit[mealIndex]),
          fats_g: Math.round(data.fats_g * calorieSplit[mealIndex]),
          ingredients: [
            { item: names[mealIndex].split(" ").slice(0, 2).join(" ").toLowerCase(), amount: "1 serving" },
            { item: "olive oil or seasoning", amount: "to taste" },
          ],
          instructions: [
            "Prepare ingredients and measure portions for the target macros.",
            "Cook proteins and grains until done, then combine with produce.",
            "Season to taste and serve immediately or store for meal prep.",
          ],
        };
      }),
    })),
    grocery_list: Array.from(grocery.entries()).map(([category, items]) => ({ category, items: Array.from(items) })),
  };
}

export const generateMealPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => planInputSchema.parse(d))
  .handler(async ({ data }) => {
    const model = getModel();
    const days = data.duration === "week" ? 7 : 1;

    try {
      const { text } = await generateText({
        model,
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
Title should be catchy and reflect the plan style.

Return only valid JSON with this exact shape and no markdown fences:
{"title":"string","days":[{"day":1,"meals":[{"name":"string","type":"breakfast|lunch|dinner|snack","calories":500,"protein_g":35,"carbs_g":45,"fats_g":15,"ingredients":[{"item":"string","amount":"string"}],"instructions":["string"]}]}],"grocery_list":[{"category":"string","items":["string"]}]}`,
      });

      const output = mealPlanSchema.parse(extractJSON(text));
      const rounded = {
        ...output,
        days: output.days.map((day) => ({
          day: Math.round(day.day),
          meals: day.meals.map((meal) => ({
            ...meal,
            calories: Math.round(meal.calories),
            protein_g: Math.round(meal.protein_g),
            carbs_g: Math.round(meal.carbs_g),
            fats_g: Math.round(meal.fats_g),
          })),
        })),
      };
      const total = rounded.days[0]?.meals.reduce((s, m) => s + m.calories, 0) ?? data.daily_calories;
      return { ...rounded, total_calories: total };
    } catch (err) {
      console.error("generateMealPlan AI error, using deterministic fallback:", err);
      const output = buildFallbackMealPlan(data, days);
      const total = output.days[0]?.meals.reduce((s, m) => s + m.calories, 0) ?? data.daily_calories;
      return { ...output, total_calories: total };
    }
  });
