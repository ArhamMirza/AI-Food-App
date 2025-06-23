import type{ ShoppingList } from "./shoppingLists";
import type{ MealPlan } from "./mealPlan";

export interface User {
  id: string;
  username: string;
  email: string;
  is_email_verified: boolean;
  role: string;
  preferences?: Preferences;
  saved_recipes: string[];
  shopping_lists: ShoppingList[];
  meal_plans: MealPlan[];
  created_at: string;
}

export interface Preferences {
  diet?: string;
  allergies?: string[];
  calorieLimit?: number;
}