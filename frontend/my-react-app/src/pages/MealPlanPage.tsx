"use client"

import type React from "react"
import { useAppSelector } from "../redux/hooks"
import { authorizedFetch } from "../utils/auth" // adjust path as needed

import { useState, useEffect, useRef } from "react"
import {
  ChefHat,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit3,
  ArrowLeft,
  Clock,
  Utensils,
  CalendarDays,
  Save,
  AlertCircle,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Recipe {
  recipe_id: string
  title: string
  content?: {
    text: string
  }
  created_at: string
  updated_at?: string
}

interface MealPlan {
  meal_plan_id: string
  user_id: string
  date: string
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  recipe_id?: string
  recipe_title?: string
  notes?: string
}

interface MealPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (mealPlan: Partial<MealPlan>) => void
  recipes: Recipe[]
  date: string
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  existingMeal?: MealPlan
}

interface MealTypeOption {
  value: "breakfast" | "lunch" | "dinner" | "snack"
  label: string
  icon: React.ReactNode
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

const MealPlanPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [scrollY, setScrollY] = useState<number>(0)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  })
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")
  const [showMealPlanModal, setShowMealPlanModal] = useState<boolean>(false)
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("dinner")
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | undefined>(undefined)
  const [weekOffset, setWeekOffset] = useState<number>(0)
  const [shoppingList, setShoppingList] = useState<
    { recipeTitle: string; ingredients: { text: string; checked: boolean }[] }[]
  >([])
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState<boolean>(false)
  const navigate = useNavigate()

  const API_BASE_URL = "http://localhost:8000/api/v1"
  const RECIPE_URL = `${API_BASE_URL}/recipe`
  const MEAL_PLAN_URL = `${API_BASE_URL}/meal-plan`
  const user: any = useAppSelector((state) => state.user.user)
  const USER_ID = user.id

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // Check for date parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const dateParam = urlParams.get("date")

    if (dateParam) {
      // Validate the date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (dateRegex.test(dateParam)) {
        setSelectedDate(dateParam)

        // Update current month to match the selected date
        const date = new Date(dateParam)
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))

        // Clear the URL parameter after setting the date
        window.history.replaceState({}, "", window.location.pathname)
      }
    }
  }, [])

  useEffect(() => {
    fetchUserRecipes()
    fetchMealPlans()
  }, [])

  useEffect(() => {
    // When selected date changes, update the current month view
    const date = new Date(selectedDate)
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
  }, [selectedDate])

  const fetchUserRecipes = async () => {
    try {
      setError("")

      const response = await authorizedFetch(`${RECIPE_URL}/user/${USER_ID}`)
      if (!response.ok) throw new Error(`Failed to fetch recipes: ${response.status}`)

      const data: ApiResponse<Recipe[]> = await response.json()
      setRecipes(data.data || [])
      console.log(recipes)
    } catch (error) {
      console.error("Failed to load recipes:", error)
      setError("Failed to load recipes")
    }
  }

  const fetchMealPlans = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await authorizedFetch(`${MEAL_PLAN_URL}/user/${USER_ID}`)

      if (!response.ok) throw new Error(`Failed to fetch meal plans: ${response.status}`)

      const data: ApiResponse<MealPlan[]> = await response.json()
      setMealPlans(data.data || [])
    } catch (error) {
      console.error("Failed to load meal plans:", error)
      setError("Failed to load meal plans")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMealPlan = async (mealPlanData: Partial<MealPlan>) => {
    try {
      setLoading(true)
      setError("")

      const payload = {
        user_id: USER_ID,
        date: selectedDate,
        meal_type: selectedMealType,
        recipe_id: mealPlanData.recipe_id,
        recipe_title: mealPlanData.recipe_title,
        notes: mealPlanData.notes || "",
      }

      let response: Response
      if (selectedMealPlan) {
        // Update existing meal plan
        response = await authorizedFetch(`${MEAL_PLAN_URL}/${selectedMealPlan.meal_plan_id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      } else {
        // Create new meal plan
        response = await authorizedFetch(`${MEAL_PLAN_URL}/`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        throw new Error(`Failed to save meal plan: ${response.status}`)
      }

      const data: ApiResponse<MealPlan> = await response.json()

      if (selectedMealPlan) {
        setMealPlans((prev) => prev.map((mp) => (mp.meal_plan_id === selectedMealPlan.meal_plan_id ? data.data : mp)))
      } else {
        setMealPlans((prev) => [...prev, data.data])
      }

      setShowMealPlanModal(false)
      setSelectedMealPlan(undefined)
    } catch (error) {
      console.error("Failed to save meal plan:", error)
      setError("Failed to save meal plan")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMealPlan = async (mealPlanId: string) => {
    if (!window.confirm("Are you sure you want to delete this meal plan?")) return

    try {
      setLoading(true)
      setError("")

      const response = await authorizedFetch(`${MEAL_PLAN_URL}/${mealPlanId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete meal plan: ${response.status}`)
      }

      setMealPlans((prev) => prev.filter((mp) => mp.meal_plan_id !== mealPlanId))
    } catch (error) {
      console.error("Failed to delete meal plan:", error)
      setError("Failed to delete meal plan")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMeal = (date: string, mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    setSelectedDate(date)
    setSelectedMealType(mealType)
    setSelectedMealPlan(undefined)
    setShowMealPlanModal(true)
  }

  const handleEditMeal = (mealPlan: MealPlan) => {
    setSelectedDate(mealPlan.date)
    setSelectedMealType(mealPlan.meal_type)
    setSelectedMealPlan(mealPlan)
    setShowMealPlanModal(true)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setWeekOffset((prev) => (direction === "next" ? prev + 1 : prev - 1))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth)
      if (direction === "next") {
        newMonth.setMonth(newMonth.getMonth() + 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() - 1)
      }
      return newMonth
    })
  }

  const handleDateClick = (date: string) => {
    console.log("Selected date:", date) // Debug log
    setSelectedDate(date)
  }

  const handleViewModeChange = (mode: "week" | "month") => {
    setViewMode(mode)
  }

  const handleViewRecipe = (recipeId?: string) => {
    if (recipeId) {
      navigate(`/recipes/${recipeId}`)
    }
  }

  const handleIngredientCheck = (recipeIndex: number, ingredientIndex: number) => {
    setShoppingList((prev) =>
      prev.map((recipe, rIndex) =>
        rIndex === recipeIndex
          ? {
              ...recipe,
              ingredients: recipe.ingredients.map((ingredient, iIndex) =>
                iIndex === ingredientIndex ? { ...ingredient, checked: !ingredient.checked } : ingredient,
              ),
            }
          : recipe,
      ),
    )
  }

  const generateShoppingList = async () => {
    setIsGeneratingShoppingList(true)
    setError("")

    try {
      // Get all meal plans for the selected date
      const selectedDateMeals = mealPlans.filter((meal) => meal.date === selectedDate)

      if (selectedDateMeals.length === 0) {
        setError("No meals planned for the selected date")
        setShoppingList([])
        return
      }

      // Get unique recipe IDs
      const recipeIds = [...new Set(selectedDateMeals.map((meal) => meal.recipe_id).filter(Boolean))]

      if (recipeIds.length === 0) {
        setError("No recipes found for the planned meals")
        setShoppingList([])
        return
      }

      // Fetch detailed recipe content for each recipe
      const recipeContents = await Promise.all(
        recipeIds.map(async (recipeId) => {
          try {
            const response = await authorizedFetch(`${RECIPE_URL}/${recipeId}`)
            if (!response.ok) throw new Error(`Failed to fetch recipe ${recipeId}`)
            const data: ApiResponse<Recipe> = await response.json()
            return data.data
          } catch (error) {
            console.error(`Error fetching recipe ${recipeId}:`, error)
            return null
          }
        }),
      )

      // Extract ingredients from recipe content, grouped by recipe
      const groupedIngredients: { recipeTitle: string; ingredients: { text: string; checked: boolean }[] }[] = []

      recipeContents.forEach((recipe) => {
        if (recipe?.content?.text) {
          const ingredients = extractIngredientsFromContent(recipe.content.text)
          if (ingredients.length > 0) {
            groupedIngredients.push({
              recipeTitle: recipe.title,
              ingredients: ingredients
                .filter((ingredient) => ingredient.trim().length > 0)
                .map((ingredient) => ({ text: ingredient, checked: false })),
            })
          }
        }
      })

      setShoppingList(groupedIngredients)
    } catch (error) {
      console.error("Failed to generate shopping list:", error)
      setError("Failed to generate shopping list")
      setShoppingList([])
    } finally {
      setIsGeneratingShoppingList(false)
    }
  }

  const extractIngredientsFromContent = (content: string): string[] => {
    const lines = content.split("\n")
    const ingredients: string[] = []
    let inIngredientsSection = false
    let foundIngredientsHeading = false

    // Patterns to identify ingredients sections
    const ingredientHeadingPatterns = [
      /^#{1,6}\s*ingredients?:?\s*$/i, // ### Ingredients: or ## Ingredients
      /^\*\*ingredients?\*\*:?\s*$/i, // **Ingredients** or **Ingredients:**
      /^ingredients?:?\s*$/i, // Ingredients: or Ingredients
      /^ingredients?\s+list:?\s*$/i, // Ingredients List:
      /^what\s+you\s+need:?\s*$/i, // What you need:
      /^shopping\s+list:?\s*$/i, // Shopping list:
      /^you\s+will\s+need:?\s*$/i, // You will need:
    ]

    // Patterns to identify when ingredients section ends
    const sectionEndPatterns = [
      /^#{1,6}\s*(?!ingredients)/i, // Any heading that's not ingredients
      /^\*\*(?!ingredients)/i, // Any bold text that's not ingredients
      /^(instructions?|directions?|method|steps?|preparation|how\s+to\s+make):?\s*$/i,
      /^(notes?|tips?|variations?):?\s*$/i,
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Skip empty lines
      if (trimmedLine.length === 0) continue

      // Check if this line is an ingredients heading
      const isIngredientsHeading = ingredientHeadingPatterns.some((pattern) => pattern.test(trimmedLine))

      if (isIngredientsHeading) {
        inIngredientsSection = true
        foundIngredientsHeading = true
        continue
      }

      // Check if we've hit another section (end of ingredients)
      if (inIngredientsSection && sectionEndPatterns.some((pattern) => pattern.test(trimmedLine))) {
        break
      }

      // If we're in the ingredients section, collect items
      if (inIngredientsSection && trimmedLine.length > 0) {
        let ingredient = trimmedLine

        // Remove various list markers
        ingredient = ingredient.replace(/^[-*•·]\s+/, "") // - * • · bullets
        ingredient = ingredient.replace(/^\d+\.\s+/, "") // 1. 2. 3. numbered
        ingredient = ingredient.replace(/^$$\d+$$\s+/, "") // (1) (2) (3) numbered
        ingredient = ingredient.replace(/^[a-zA-Z]\.\s+/, "") // a. b. c. lettered
        ingredient = ingredient.replace(/^\[\s*\]\s+/, "") // [ ] checkboxes
        ingredient = ingredient.replace(/^[►▶→]\s+/, "") // arrow bullets

        // Clean up the ingredient text
        ingredient = ingredient.trim()

        // Skip lines that look like sub-headings or notes
        if (ingredient.match(/^(for\s+the|optional|garnish|to\s+serve):?/i)) {
          continue
        }

        // Skip lines that are too short or look like section dividers
        if (ingredient.length < 2 || ingredient.match(/^[-=_]{3,}$/)) {
          continue
        }

        if (ingredient.length > 0) {
          ingredients.push(ingredient)
        }
      }
    }

    // If no explicit ingredients heading was found, try to extract from common patterns
    if (!foundIngredientsHeading) {
      return extractIngredientsFromUnstructuredContent(content)
    }

    return ingredients
  }

  // Fallback function for recipes without clear ingredients sections
  const extractIngredientsFromUnstructuredContent = (content: string): string[] => {
    const lines = content.split("\n")
    const ingredients: string[] = []

    // Look for lines that look like ingredients (contain measurements, food items, etc.)
    const ingredientPatterns = [
      /\d+\s*(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?|cloves?|pieces?)/i,
      /\d+\/\d+\s*(cups?|tbsp|tsp)/i, // Fractions like 1/2 cup
      /\d+\s*-\s*\d+\s*(cups?|tbsp|tsp|oz)/i, // Ranges like 2-3 cups
      /^[-*•·]\s*\d/, // Bulleted lists starting with numbers
      /^[-*•·]\s*[a-zA-Z]/, // Bulleted lists starting with text
    ]

    const commonIngredients = [
      "salt",
      "pepper",
      "oil",
      "butter",
      "flour",
      "sugar",
      "eggs?",
      "milk",
      "water",
      "onions?",
      "garlic",
      "tomatoes?",
      "cheese",
      "chicken",
      "beef",
      "pork",
      "fish",
      "rice",
      "pasta",
      "bread",
      "herbs?",
      "spices?",
      "vanilla",
      "lemon",
      "lime",
    ]

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Skip empty lines and very short lines
      if (trimmedLine.length < 3) continue

      // Skip lines that look like headings
      if (trimmedLine.match(/^#{1,6}/) || trimmedLine.match(/^\*\*.*\*\*$/)) continue

      // Check if line matches ingredient patterns
      const matchesPattern = ingredientPatterns.some((pattern) => pattern.test(trimmedLine))
      const containsCommonIngredient = commonIngredients.some((ingredient) =>
        new RegExp(`\\b${ingredient}\\b`, "i").test(trimmedLine),
      )

      if (matchesPattern || containsCommonIngredient) {
        let ingredient = trimmedLine

        // Clean up the ingredient
        ingredient = ingredient.replace(/^[-*•·]\s+/, "")
        ingredient = ingredient.replace(/^\d+\.\s+/, "")
        ingredient = ingredient.replace(/^$$\d+$$\s+/, "")
        ingredient = ingredient.trim()

        if (ingredient.length > 2) {
          ingredients.push(ingredient)
        }
      }
    }

    // If we still don't have many ingredients, try a more liberal approach
    if (ingredients.length < 3) {
      return extractLiberalIngredients(content)
    }

    return ingredients
  }

  // Very liberal extraction for recipes with minimal structure
  const extractLiberalIngredients = (content: string): string[] => {
    const lines = content.split("\n")
    const ingredients: string[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Skip empty lines, headings, and very long lines (likely instructions)
      if (trimmedLine.length < 3 || trimmedLine.length > 100) continue
      if (trimmedLine.match(/^#{1,6}/) || trimmedLine.match(/^\*\*.*\*\*$/)) continue

      // Look for lines that start with common list markers or contain measurements
      if (
        trimmedLine.match(/^[-*•·]/) ||
        trimmedLine.match(/\d+/) ||
        trimmedLine.match(/\b(cup|tsp|tbsp|oz|lb|gram|ml|liter)\b/i)
      ) {
        let ingredient = trimmedLine
        ingredient = ingredient.replace(/^[-*•·]\s+/, "")
        ingredient = ingredient.replace(/^\d+\.\s+/, "")
        ingredient = ingredient.trim()

        if (ingredient.length > 2) {
          ingredients.push(ingredient)
        }
      }
    }

    return ingredients
  }

  const downloadShoppingListHTML = () => {
    const totalItems = shoppingList.reduce((total, recipe) => total + recipe.ingredients.length, 0)
    const selectedDateFormatted = new Date(selectedDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopping List - ${selectedDateFormatted}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%);
            min-height: 100vh;
            color: white;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(30, 41, 59, 0.3);
            border-radius: 16px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 2rem;
            margin-bottom: 10px;
            color: #10b981;
        }
        
        .header p {
            color: #cbd5e1;
            font-size: 1.1rem;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .stat {
            background: rgba(8, 120, 90, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            color: #6ee7b7;
        }
        
        .recipe-section {
            background: rgba(30, 41, 59, 0.3);
            border-radius: 16px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            backdrop-filter: blur(10px);
            margin-bottom: 20px;
            overflow: hidden;
        }
        
        .recipe-header {
            background: rgba(16, 185, 129, 0.2);
            padding: 16px 20px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }
        
        .recipe-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #6ee7b7;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .recipe-progress {
            font-size: 0.9rem;
            color: #cbd5e1;
            margin-top: 5px;
        }
        
        .ingredients-list {
            padding: 20px;
        }
        
        .ingredient-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            margin-bottom: 8px;
            background: rgba(51, 65, 85, 0.5);
            border-radius: 8px;
            border: 1px solid rgba(148, 163, 184, 0.2);
            transition: all 0.2s ease;
            cursor: pointer;
        }
        
        .ingredient-item:hover {
            background: rgba(51, 65, 85, 0.7);
            border-color: rgba(16, 185, 129, 0.3);
        }
        
        .ingredient-item.checked {
            opacity: 0.6;
            background: rgba(51, 65, 85, 0.3);
        }
        
        .ingredient-checkbox {
            width: 18px;
            height: 18px;
            accent-color: #10b981;
            cursor: pointer;
        }
        
        .ingredient-text {
            flex: 1;
            font-size: 0.95rem;
            transition: all 0.2s ease;
        }
        
        .ingredient-text.checked {
            text-decoration: line-through;
            color: #64748b;
        }
        
        .controls {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        
        .btn-primary:hover {
            background: linear-gradient(135deg, #34d399, #10b981);
        }
        
        .btn-secondary {
            background: rgba(51, 65, 85, 0.7);
            color: #cbd5e1;
            border: 1px solid rgba(148, 163, 184, 0.2);
        }
        
        .btn-secondary:hover {
            background: rgba(51, 65, 85, 0.9);
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #64748b;
            font-size: 0.9rem;
        }
        
        @media (max-width: 640px) {
            .header h1 {
                font-size: 1.5rem;
            }
            
            .stats {
                flex-direction: column;
                align-items: center;
            }
            
            .controls {
                flex-direction: column;
                align-items: center;
            }
            
            .btn {
                width: 200px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 Shopping List</h1>
            <p>${selectedDateFormatted}</p>
            <div class="stats">
                <div class="stat">${totalItems} Total Items</div>
                <div class="stat">${shoppingList.length} Recipes</div>
                <div class="stat" id="progress-stat">0% Complete</div>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="checkAll()">✓ Check All</button>
            <button class="btn btn-secondary" onclick="uncheckAll()">✗ Uncheck All</button>
            <button class="btn btn-secondary" onclick="clearCompleted()">🗑️ Clear Completed</button>
        </div>
        
        ${shoppingList
          .map(
            (recipe, recipeIndex) => `
        <div class="recipe-section">
            <div class="recipe-header">
                <div class="recipe-title">
                    🍽️ ${recipe.recipeTitle}
                </div>
                <div class="recipe-progress" id="recipe-progress-${recipeIndex}">
                    0 of ${recipe.ingredients.length} items completed
                </div>
            </div>
            <div class="ingredients-list">
                ${recipe.ingredients
                  .map(
                    (ingredient, ingredientIndex) => `
                <div class="ingredient-item" onclick="toggleIngredient(${recipeIndex}, ${ingredientIndex})">
                    <input 
                        type="checkbox" 
                        class="ingredient-checkbox" 
                        id="ingredient-${recipeIndex}-${ingredientIndex}"
                        onchange="updateProgress()"
                    >
                    <span class="ingredient-text" id="text-${recipeIndex}-${ingredientIndex}">
                        ${ingredient.text}
                    </span>
                </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
        `,
          )
          .join("")}
        
        <div class="footer">
            <p>Generated from your meal planner • ${new Date().toLocaleDateString()}</p>
            <p>Your progress is automatically saved in your browser</p>
        </div>
    </div>
    
    <script>
        // Load saved state from localStorage
        function loadSavedState() {
            const saved = localStorage.getItem('shoppingList_${selectedDate}');
            if (saved) {
                const state = JSON.parse(saved);
                state.forEach((recipeState, recipeIndex) => {
                    recipeState.forEach((checked, ingredientIndex) => {
                        const checkbox = document.getElementById(\`ingredient-\${recipeIndex}-\${ingredientIndex}\`);
                        const text = document.getElementById(\`text-\${recipeIndex}-\${ingredientIndex}\`);
                        const item = checkbox.parentElement;
                        
                        if (checkbox && checked) {
                            checkbox.checked = true;
                            text.classList.add('checked');
                            item.classList.add('checked');
                        }
                    });
                });
                updateProgress();
            }
        }
        
        // Save state to localStorage
        function saveState() {
            const state = [];
            ${shoppingList
              .map(
                (recipe, recipeIndex) => `
            state[${recipeIndex}] = [];
            ${recipe.ingredients
              .map(
                (_, ingredientIndex) => `
            const checkbox${recipeIndex}_${ingredientIndex} = document.getElementById('ingredient-${recipeIndex}-${ingredientIndex}');
            state[${recipeIndex}][${ingredientIndex}] = checkbox${recipeIndex}_${ingredientIndex} ? checkbox${recipeIndex}_${ingredientIndex}.checked : false;
            `,
              )
              .join("")}
            `,
              )
              .join("")}
            
            localStorage.setItem('shoppingList_${selectedDate}', JSON.stringify(state));
        }
        
        function toggleIngredient(recipeIndex, ingredientIndex) {
            const checkbox = document.getElementById(\`ingredient-\${recipeIndex}-\${ingredientIndex}\`);
            const text = document.getElementById(\`text-\${recipeIndex}-\${ingredientIndex}\`);
            const item = checkbox.parentElement;
            
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                text.classList.add('checked');
                item.classList.add('checked');
            } else {
                text.classList.remove('checked');
                item.classList.remove('checked');
            }
            
            updateProgress();
            saveState();
        }
        
        function updateProgress() {
            let totalItems = 0;
            let checkedItems = 0;
            
            ${shoppingList
              .map(
                (recipe, recipeIndex) => `
            let recipe${recipeIndex}Total = ${recipe.ingredients.length};
            let recipe${recipeIndex}Checked = 0;
            
            ${recipe.ingredients
              .map(
                (_, ingredientIndex) => `
            const checkbox${recipeIndex}_${ingredientIndex} = document.getElementById('ingredient-${recipeIndex}-${ingredientIndex}');
            if (checkbox${recipeIndex}_${ingredientIndex} && checkbox${recipeIndex}_${ingredientIndex}.checked) {
                recipe${recipeIndex}Checked++;
                checkedItems++;
            }
            totalItems++;
            `,
              )
              .join("")}
            
            document.getElementById('recipe-progress-${recipeIndex}').textContent = 
                \`\${recipe${recipeIndex}Checked} of \${recipe${recipeIndex}Total} items completed\`;
            `,
              )
              .join("")}
            
            const percentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
            document.getElementById('progress-stat').textContent = \`\${percentage}% Complete\`;
        }
        
        function checkAll() {
            document.querySelectorAll('.ingredient-checkbox').forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    const text = document.getElementById(checkbox.id.replace('ingredient-', 'text-'));
                    const item = checkbox.parentElement;
                    text.classList.add('checked');
                    item.classList.add('checked');
                }
            });
            updateProgress();
            saveState();
        }
        
        function uncheckAll() {
            document.querySelectorAll('.ingredient-checkbox').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    const text = document.getElementById(checkbox.id.replace('ingredient-', 'text-'));
                    const item = checkbox.parentElement;
                    text.classList.remove('checked');
                    item.classList.remove('checked');
                }
            });
            updateProgress();
            saveState();
        }
        
        function clearCompleted() {
            document.querySelectorAll('.ingredient-checkbox').forEach(checkbox => {
                if (checkbox.checked) {
                    const item = checkbox.parentElement;
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        item.remove();
                        updateProgress();
                        saveState();
                    }, 300);
                }
            });
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            loadSavedState();
            updateProgress();
        });
    </script>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `shopping-list-${selectedDate}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Generate days for the week view
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() + weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() - startDate.getDay() + i) // Start from Sunday

    // Ensure consistent date formatting
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateStr = `${year}-${month}-${day}`

    return {
      dateStr,
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      isCurrentDay: date.toDateString() === today.toDateString(),
      isSelected: dateStr === selectedDate,
    }
  })

  // Generate days for the month view
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const generateMonthDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)

      // Ensure consistent date formatting
      const dateYear = date.getFullYear()
      const dateMonth = String(date.getMonth() + 1).padStart(2, "0")
      const dateDay = String(date.getDate()).padStart(2, "0")
      const dateStr = `${dateYear}-${dateMonth}-${dateDay}`

      days.push({
        dateStr,
        dayNumber: i,
        isCurrentDay: date.toDateString() === today.toDateString(),
        isSelected: dateStr === selectedDate,
      })
    }

    return days
  }

  const monthDays = generateMonthDays()

  const weekStart = weekDays[0]
  const weekEnd = weekDays[6]
  const weekHeader = `${weekStart.month} ${weekStart.dayNumber} - ${weekEnd.month} ${weekEnd.dayNumber}, ${today.getFullYear()}`

  const mealTypeOptions: MealTypeOption[] = [
    { value: "breakfast", label: "Breakfast", icon: <Clock size={16} /> },
    { value: "lunch", label: "Lunch", icon: <Utensils size={16} /> },
    { value: "dinner", label: "Dinner", icon: <Utensils size={16} /> },
    { value: "snack", label: "Snack", icon: <Utensils size={16} /> },
  ]

  // Get meals for a specific date and meal type
  const getMealsForDateAndType = (date: string, mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    return mealPlans.filter((meal) => meal.date === date && meal.meal_type === mealType)
  }

  // Get all meals for a specific date
  const getMealsForDate = (date: string) => {
    return mealPlans.filter((meal) => meal.date === date)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden flex">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #10b981 0%, #059669 100%); border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #34d399 0%, #10b981 100%); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #10b981 transparent; }
      `}</style>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Header */}
        <header
          className={`sticky top-0 z-40 transition-all duration-300 ${
            scrollY > 10 ? "bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50" : ""
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
                <h1 className="text-xl font-semibold">Meal Planner</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/chat")}
                  className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                  title="Chat with Food AI"
                >
                  <MessageSquare size={20} />
                </button>
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <ChefHat size={20} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <span className="text-red-300">{error}</span>
              <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-300">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Calendar Controls */}
          <section className="mb-6">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Calendar className="text-green-400" size={24} />
                    {viewMode === "week"
                      ? weekHeader
                      : currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-700/50 rounded-lg p-1 flex">
                    <button
                      onClick={() => handleViewModeChange("week")}
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        viewMode === "week"
                          ? "bg-green-500 text-white"
                          : "text-gray-300 hover:text-white hover:bg-slate-600/50"
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => handleViewModeChange("month")}
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        viewMode === "month"
                          ? "bg-green-500 text-white"
                          : "text-gray-300 hover:text-white hover:bg-slate-600/50"
                      }`}
                    >
                      Month
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => (viewMode === "week" ? navigateWeek("prev") : navigateMonth("prev"))}
                      className="p-2 bg-slate-700/50 rounded-lg hover:bg-slate-600/70 text-gray-300 hover:text-white transition-all duration-200"
                      aria-label={viewMode === "week" ? "Previous week" : "Previous month"}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date()
                        const year = today.getFullYear()
                        const month = String(today.getMonth() + 1).padStart(2, "0")
                        const day = String(today.getDate()).padStart(2, "0")
                        const todayStr = `${year}-${month}-${day}`

                        setSelectedDate(todayStr)
                        setWeekOffset(0)
                        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                      }}
                      className="p-2 bg-slate-700/50 rounded-lg hover:bg-slate-600/70 text-gray-300 hover:text-white transition-all duration-200"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => (viewMode === "week" ? navigateWeek("next") : navigateMonth("next"))}
                      className="p-2 bg-slate-700/50 rounded-lg hover:bg-slate-600/70 text-gray-300 hover:text-white transition-all duration-200"
                      aria-label={viewMode === "week" ? "Next week" : "Next month"}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Week View */}
              {viewMode === "week" && (
                <div className="grid grid-cols-7 gap-3">
                  {weekDays.map((day) => (
                    <div
                      key={day.dateStr}
                      className={`flex flex-col rounded-lg cursor-pointer transition-all duration-200 ${
                        day.isSelected
                          ? "bg-green-500/20 border-2 border-green-500"
                          : day.isCurrentDay
                            ? "bg-slate-700/50 border-2 border-slate-500"
                            : "bg-slate-800/50 border border-slate-700/30 hover:bg-slate-700/50"
                      }`}
                      onClick={() => handleDateClick(day.dateStr)}
                    >
                      <div className="text-center p-2 border-b border-slate-700/30">
                        <div className="text-sm font-medium text-gray-300">{day.dayName}</div>
                        <div className="text-lg font-semibold">{day.dayNumber}</div>
                        <div className="text-xs text-gray-400">{day.month}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Month View */}
              {viewMode === "month" && (
                <>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-gray-400 font-medium py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {monthDays.map((day, index) => (
                      <div key={index} className="aspect-square">
                        {day ? (
                          <div
                            onClick={() => handleDateClick(day.dateStr)}
                            className={`w-full h-full flex flex-col rounded-lg cursor-pointer transition-all duration-200 ${
                              day.isSelected
                                ? "bg-green-500/20 border-2 border-green-500"
                                : day.isCurrentDay
                                  ? "bg-slate-700/50 border-2 border-slate-500"
                                  : "bg-slate-800/50 border border-slate-700/30 hover:bg-slate-700/50"
                            }`}
                          >
                            <div className="p-2 text-center">
                              <div className="text-lg font-semibold">{day.dayNumber}</div>
                              {getMealsForDate(day.dateStr).length > 0 && (
                                <div className="mt-1 flex justify-center">
                                  <span className="bg-green-500/30 text-green-300 text-xs px-1.5 py-0.5 rounded-full">
                                    {getMealsForDate(day.dateStr).length}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-slate-800/20 rounded-lg"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Selected Day Meal Plan */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">
                Meals for{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 animate-pulse"
                  >
                    <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-3"></div>
                    <div className="h-20 bg-slate-700/50 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mealTypeOptions.map((mealType) => {
                  const meals = getMealsForDateAndType(selectedDate, mealType.value)
                  return (
                    <div
                      key={mealType.value}
                      className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          {mealType.icon}
                          {mealType.label}
                        </h3>
                        <button
                          onClick={() => handleAddMeal(selectedDate, mealType.value)}
                          className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          title={`Add ${mealType.label}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {meals.length > 0 ? (
                        <div className="space-y-3">
                          {meals.map((meal) => (
                            <div
                              key={meal.meal_plan_id}
                              className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 hover:border-green-500/30 transition-all duration-200 group"
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium group-hover:text-green-400 transition-colors">
                                  {meal.recipe_title}
                                </h4>
                                <div className="flex items-center">
                                  <button
                                    onClick={() => handleEditMeal(meal)}
                                    className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                                    title="Edit meal"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMealPlan(meal.meal_plan_id)}
                                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                    title="Remove meal"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              {meal.notes && <p className="text-sm text-gray-400 mt-1">{meal.notes}</p>}
                              {meal.recipe_id && (
                                <button
                                  onClick={() => handleViewRecipe(meal.recipe_id)}
                                  className="mt-2 text-green-400 text-sm hover:text-green-300 transition-colors flex items-center gap-1"
                                >
                                  View Recipe
                                  <ChevronRight size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                          <p className="text-gray-400 text-sm">No {mealType.label.toLowerCase()} planned</p>
                          <button
                            onClick={() => handleAddMeal(selectedDate, mealType.value)}
                            className="mt-2 text-green-400 text-sm hover:text-green-300 transition-colors flex items-center gap-1 justify-center mx-auto"
                          >
                            <Plus size={14} />
                            Add {mealType.label}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* {process.env.NODE_ENV === "development" && (
            <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-300 text-sm">
                Debug: Selected Date = {selectedDate} | Meals found = {getMealsForDate(selectedDate).length} | All meal
                dates = {mealPlans.map((m) => m.date).join(", ")}
              </p>
            </div>
          )} */}

          {/* Shopping List Preview */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Shopping List</h2>
              {shoppingList.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const listText = shoppingList
                        .map(
                          (recipe) =>
                            `${recipe.recipeTitle}:\n${recipe.ingredients.map((item) => `  ${item.checked ? "☑" : "☐"} ${item.text}`).join("\n")}`,
                        )
                        .join("\n\n")
                      navigator.clipboard.writeText(listText)
                    }}
                    className="text-green-400 hover:text-green-500 flex items-center gap-1 text-sm"
                  >
                    Copy List <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={downloadShoppingListHTML}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    📱 Download Interactive List
                  </button>
                </div>
              )}
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <p className="text-gray-300">
                  Generate a shopping list based on your meal plan for{" "}
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <button
                  onClick={generateShoppingList}
                  disabled={isGeneratingShoppingList || getMealsForDate(selectedDate).length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarDays size={18} />
                  {isGeneratingShoppingList ? "Generating..." : "Generate Shopping List"}
                </button>
              </div>

              {isGeneratingShoppingList ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-3"></div>
                  <p className="text-gray-400">Extracting ingredients from your recipes...</p>
                </div>
              ) : shoppingList.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-green-400">
                      Shopping List ({shoppingList.reduce((total, recipe) => total + recipe.ingredients.length, 0)}{" "}
                      items from {shoppingList.length} recipes)
                    </h3>
                    <button
                      onClick={() => setShoppingList([])}
                      className="text-gray-400 hover:text-red-400 transition-colors text-sm"
                    >
                      Clear List
                    </button>
                  </div>
                  <div className="space-y-6 max-h-80 overflow-y-auto custom-scrollbar">
                    {shoppingList.map((recipe, recipeIndex) => (
                      <div key={recipeIndex} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                        <h4 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                          <Utensils size={18} />
                          {recipe.recipeTitle}
                        </h4>
                        <div className="space-y-2">
                          {recipe.ingredients.map((ingredient, ingredientIndex) => (
                            <div
                              key={ingredientIndex}
                              className={`bg-slate-800/50 rounded-lg p-3 border border-slate-600/50 flex items-center gap-3 transition-all duration-200 ${
                                ingredient.checked ? "opacity-60 bg-slate-800/30" : "hover:bg-slate-800/70"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={ingredient.checked}
                                onChange={() => handleIngredientCheck(recipeIndex, ingredientIndex)}
                                className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                              />
                              <span
                                className={`text-sm flex-1 ${ingredient.checked ? "line-through text-gray-500" : ""}`}
                              >
                                {ingredient.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CalendarDays size={32} className="mx-auto mb-3 opacity-50" />
                  {getMealsForDate(selectedDate).length === 0 ? (
                    <>
                      <p className="text-sm">No meals planned for the selected date</p>
                      <p className="text-xs mt-1">Add meals to your plan to generate a shopping list</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">Click "Generate Shopping List" to extract ingredients</p>
                      <p className="text-xs mt-1">Ingredients will be extracted from your planned recipes</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">Plan your meals for a healthier lifestyle</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Meal Plan Modal */}
      {showMealPlanModal && (
        <MealPlanModal
          isOpen={showMealPlanModal}
          onClose={() => {
            setShowMealPlanModal(false)
            setSelectedMealPlan(undefined)
          }}
          onSave={handleSaveMealPlan}
          recipes={recipes}
          date={selectedDate}
          mealType={selectedMealType}
          existingMeal={selectedMealPlan}
        />
      )}
    </div>
  )
}

// Meal Plan Modal Component (Recipe Selection Only)
const MealPlanModal: React.FC<MealPlanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recipes,
  date,
  mealType,
  existingMeal,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(
    existingMeal?.recipe_id ? recipes.find((r) => r.recipe_id === existingMeal.recipe_id) || null : null,
  )
  const [notes, setNotes] = useState<string>(existingMeal?.notes || "")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the search input when the modal opens
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSave = () => {
    if (selectedRecipe) {
      onSave({
        recipe_id: selectedRecipe.recipe_id,
        recipe_title: selectedRecipe.title,
        notes,
      })
    }
  }

  const filteredRecipes = recipes.filter((recipe) => recipe.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const mealTypeLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <h3 className="text-xl font-semibold mb-2">
          {existingMeal ? "Edit" : "Add"} {mealTypeLabel}
        </h3>
        <p className="text-gray-300 mb-4">For {formattedDate}</p>

        {/* Recipe Selection */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-60">
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.recipe_id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRecipe?.recipe_id === recipe.recipe_id
                        ? "bg-green-500/20 border border-green-500/30"
                        : "bg-slate-700/50 hover:bg-slate-700/70 border border-slate-700/30"
                    }`}
                  >
                    <h4 className="font-medium">{recipe.title}</h4>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? (
                    <>
                      <p>No recipes match your search</p>
                      <button onClick={() => setSearchQuery("")} className="text-green-400 hover:text-green-500 mt-2">
                        Clear search
                      </button>
                    </>
                  ) : (
                    <p>No recipes available. Create a recipe first.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 mt-4">
            <label htmlFor="meal-notes" className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="meal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this meal..."
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 h-24 resize-none custom-scrollbar"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedRecipe}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {existingMeal ? "Update" : "Add to Plan"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MealPlanPage
