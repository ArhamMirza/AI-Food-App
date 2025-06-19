"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  ChefHat,
  Sparkles,
  Bot,
  Utensils,
  LogOut,
  Home,
  Calendar,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  Search,
  Clock,
  Coffee,
  Soup,
  User
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAppSelector } from "../redux/hooks"
import { authorizedFetch } from "../utils/auth" // adjust path as needed


interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

interface Recipe {
  recipe_id: string
  title: string
  content?: string
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
  onSave: (recipe: string | Recipe, isCustom: boolean) => void
  recipes: Recipe[]
  date: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

const Dashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [scrollY, setScrollY] = useState<number>(0)
  const [weekOffset, setWeekOffset] = useState<number>(0)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [showMealPlanModal, setShowMealPlanModal] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const navigate = useNavigate()

  const user:any = useAppSelector((state) => state.user.user)

  const API_BASE_URL = "http://localhost:8000/api/v1"
  const RECIPE_URL = `${API_BASE_URL}/recipe`
  const MEAL_PLAN_URL = `${API_BASE_URL}/meal-plan`
  const USER_ID = user.id // This would normally come from auth context
  console.log(user)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    fetchUserRecipes()
    fetchMealPlans()
  }, [])

  const fetchUserRecipes = async () => {
    try {
      setLoading(true);

      const response = await authorizedFetch(`${RECIPE_URL}/user/${USER_ID}`);

      if (!response.ok) throw new Error(`API call failed: ${response.status}`);

      const data: ApiResponse<Recipe[]> = await response.json();
      const fetchedRecipes = Array.isArray(data.data) ? data.data : [];
      setRecipes(fetchedRecipes);

    } catch (error) {
      console.error("Failed to load recipes:", error);
    } finally {
      setLoading(false);
    }
  };



  const fetchMealPlans = async () => {
    try {
      const response = await authorizedFetch(`${MEAL_PLAN_URL}/user/${USER_ID}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch meal plans: ${response.status}`)
      }

      const data: ApiResponse<MealPlan[]> = await response.json()
      setMealPlans(data.data || [])
    } catch (error) {
      console.error("Failed to load meal plans:", error)
      setMealPlans([])
    }
  }


  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/login")
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setWeekOffset((prev) => (direction === "next" ? prev + 1 : prev - 1))
  }

  const handleAddMeal = (date: string) => {
    setSelectedDate(date)
    setShowMealPlanModal(true)
  }

  const handleSaveMeal = async (recipeData: string | Recipe, isCustom: boolean) => {
    try {
      // Create meal plan via API
      const payload = {
        user_id: USER_ID,
        date: selectedDate,
        meal_type: "dinner", // Default to dinner for dashboard
        recipe_id: isCustom ? undefined : (recipeData as Recipe).recipe_id,
        recipe_title: isCustom ? (recipeData as string) : (recipeData as Recipe).title,
        notes: "",
      }

      const response = await fetch(MEAL_PLAN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to save meal plan: ${response.status}`)
      }

      const data: ApiResponse<MealPlan> = await response.json()

      // Update the meal plans state
      setMealPlans((prev) => [...prev, data.data])

      // Close the modal
      setShowMealPlanModal(false)
    } catch (error) {
      console.error("Failed to save meal plan:", error)
    }
  }

  const handleViewRecipe = (mealPlan: MealPlan) => {
    if (mealPlan.recipe_id) {
      // For recipes, navigate to the recipe page
      navigate(`/recipes/${mealPlan.recipe_id}`)
    } else {
      // For custom meals, show alert with meal title
      alert(`Meal: ${mealPlan.recipe_title}`)
    }
  }

  const navItems: NavItem[] = [
    { icon: <Home className="w-6 h-6" />, label: "Dashboard", href: "/dashboard" },
    { icon: <Bot className="w-6 h-6" />, label: "Recipes", href: "/recipes" },
    { icon: <Calendar className="w-6 h-6" />, label: "Meal Plans", href: "/meal-plans" },
    { icon: <Utensils className="w-6 h-6" />, label: "Community", href: "/community" },
    { icon: <LogOut className="w-6 h-6" />, label: "Logout", href: "#logout" },
  ]

  const currentDate = new Date()
  const startDate = new Date(currentDate)
  startDate.setDate(currentDate.getDate() + weekOffset * 7)
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    return {
      dateStr: date.toISOString().split("T")[0],
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      isCurrentDay: date.toDateString() === currentDate.toDateString(),
    }
  })

  const weekStart = calendarDays[0]
  const weekEnd = calendarDays[6]
  const weekHeader = `Your Meal Plan - ${weekStart.month} ${weekStart.dayNumber} - ${weekEnd.month} ${weekEnd.dayNumber}, ${currentDate.getFullYear()}`

  // Helper function to get all meals for a specific date, sorted by meal type
  const getMealsForDate = (date: string) => {
    const mealsForDate = mealPlans.filter((mp) => mp.date === date)
    // Sort by meal type priority: breakfast, lunch, dinner, snack
    const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 }
    return mealsForDate.sort((a, b) => mealOrder[a.meal_type] - mealOrder[b.meal_type])
  }

  // Helper function to get meal type icon and color
  const getMealTypeInfo = (mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    switch (mealType) {
      case "breakfast":
        return { icon: <Coffee size={12} />, color: "bg-orange-500/20 text-orange-400 border-orange-500/30" }
      case "lunch":
        return { icon: <Soup size={12} />, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
      case "dinner":
        return { icon: <Utensils size={12} />, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" }
      case "snack":
        return { icon: <Clock size={12} />, color: "bg-green-500/20 text-green-400 border-green-500/30" }
      default:
        return { icon: <Utensils size={12} />, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" }
    }
  }

  // Helper function to truncate long meal names
  const truncateMealName = (name: string, maxLength = 20) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
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

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 
          ${isCollapsed ? "w-16" : "w-80 lg:w-72 xl:w-80"}
          transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          transition-all duration-300 ease-in-out
          bg-gradient-to-b from-slate-800 to-slate-900 
          border-r border-slate-700/50 backdrop-blur-xl
          flex flex-col shadow-2xl
        `}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <ChefHat size={18} className="text-white" />
                </div>
                <span className="text-white font-bold text-lg">Food AI</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="hidden lg:block text-gray-400 hover:text-white transition-colors p-1"
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <button
                onClick={() => setIsCollapsed(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Expand sidebar"
              >
                <ChevronRight size={20} />
              </button>
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <ChefHat size={18} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {!isCollapsed ? (
              navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => {
                    if (item.href === "#logout") {
                      e.preventDefault()
                      handleLogout()
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))
            ) : (
              <div className="flex flex-col items-center gap-4">
                {navItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href === "#logout") {
                        e.preventDefault()
                        handleLogout()
                      }
                    }}
                    className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    title={item.label}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? "md:ml-16" : "md:ml-0"}`}>
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
                  className="lg:hidden text-gray-300 hover:text-white transition-colors p-2 -ml-2 bg-slate-800/50 rounded-lg"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <h1 className="text-xl font-semibold">Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/chat")}
                  className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                  title="Chat with Food AI"
                >
                  <MessageSquare size={20} />
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                  title="View Profile"
                >
                  <User size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          {/* Welcome Section */}
          <section className="mb-10">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome, <span className="text-green-400">{user?.username || "Chef"}</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-3xl">
                Explore personalized recipes, plan your meals with our AI cooking assistant to elevate your cooking
                experience.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/chat")}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center gap-2"
                >
                  <Bot size={18} /> Start Chatting
                </button>
                {recipes.length > 0 && (
                  <button
                    onClick={() => navigate("/recipes")}
                    className="bg-slate-700/50 hover:bg-slate-700/70 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center gap-2"
                  >
                    <ChefHat size={18} /> View Your Recipes
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Saved Recipes Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Your Saved Recipes</h2>
              <button
                onClick={() => navigate("/recipes")}
                className="text-green-400 hover:text-green-500 flex items-center gap-1 text-sm"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 animate-pulse h-32"
                  >
                    <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.recipe_id}
                    onClick={() => navigate(`/recipes/${recipe.recipe_id}`)}
                    className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <ChefHat size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1 group-hover:text-green-400 transition-colors line-clamp-2">
                          {recipe.title}
                        </h3>
                        <p className="text-gray-400 text-sm">Click to view recipe</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
                <ChefHat size={40} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Recipes Yet</h3>
                <p className="text-gray-400 mb-6">Start chatting with Food AI to create and save recipes</p>
                <button
                  onClick={() => navigate("/chat")}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center gap-2 mx-auto"
                >
                  <Bot size={18} /> Chat Now
                </button>
              </div>
            )}
          </section>

          {/* Weekly Meal Plan Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">{weekHeader}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => navigateWeek("prev")}
                  className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/70 text-gray-300 hover:text-white transition-all duration-200"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => navigateWeek("next")}
                  className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/70 text-gray-300 hover:text-white transition-all duration-200"
                  aria-label="Next week"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                {calendarDays.map((day) => {
                  const meals = getMealsForDate(day.dateStr)
                  return (
                    <div key={day.dateStr} className="flex flex-col">
                      <div className="text-center text-gray-300 font-medium mb-2">{day.dayName}</div>
                      <div
                        className={`p-3 rounded-lg ${
                          day.isCurrentDay
                            ? "bg-green-500/20 border border-green-500/30"
                            : "bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30"
                        } transition-all duration-200 min-h-[160px] flex flex-col`}
                      >
                        {/* Date Header */}
                        <div className="text-center mb-3">
                          <div className="text-gray-300 font-medium">
                            {day.month} {day.dayNumber}
                          </div>
                        </div>

                        {/* Meals List */}
                        <div className="flex-1 space-y-2">
                          {meals.length > 0 ? (
                            meals.map((meal) => {
                              const mealInfo = getMealTypeInfo(meal.meal_type)
                              return (
                                <div
                                  key={meal.meal_plan_id}
                                  onClick={() => handleViewRecipe(meal)}
                                  className={`p-2 rounded-md border cursor-pointer hover:scale-105 transition-transform ${mealInfo.color}`}
                                >
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {mealInfo.icon}
                                    <span className="text-xs font-medium capitalize">{meal.meal_type}</span>
                                  </div>
                                  <div className="text-xs text-gray-200 leading-tight">
                                    {truncateMealName(meal.recipe_title || "Unknown Meal")}
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-400 text-xs mb-2">No meals planned</p>
                            </div>
                          )}
                        </div>

                        {/*   */}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="relative">
                <ChefHat className="w-6 h-6 text-green-400" />
                <Sparkles className="w-3 h-3 text-green-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-lg font-bold">Food AI Assistant</span>
            </div>
            <div className="flex space-x-8 text-gray-400">
              <a href="#" className="hover:text-green-400 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-green-400 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-green-400 transition-colors">
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Meal Plan Modal */}
      {showMealPlanModal && (
        <MealPlanModal
          isOpen={showMealPlanModal}
          onClose={() => setShowMealPlanModal(false)}
          onSave={handleSaveMeal}
          recipes={recipes}
          date={selectedDate}
        />
      )}
    </div>
  )
}

// Meal Plan Modal Component
const MealPlanModal: React.FC<MealPlanModalProps> = ({ isOpen, onClose, onSave, recipes, date }) => {
  const [selectedTab, setSelectedTab] = useState<"existing" | "custom">("existing")
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [customRecipe, setCustomRecipe] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the search input when the modal opens
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, selectedTab])

  const handleSave = () => {
    if (selectedTab === "existing" && selectedRecipe) {
      onSave(selectedRecipe, false)
    } else if (selectedTab === "custom" && customRecipe.trim()) {
      onSave(customRecipe.trim(), true)
    }
  }

  const filteredRecipes = recipes.filter((recipe) => recipe.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <h3 className="text-xl font-semibold mb-2">Add Meal to Plan</h3>
        <p className="text-gray-300 mb-4">For {formattedDate}</p>

        {/* Tab Navigation */}
        <div className="flex mb-4 border-b border-slate-700">
          <button
            className={`px-4 py-2 ${
              selectedTab === "existing"
                ? "text-green-400 border-b-2 border-green-400"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setSelectedTab("existing")}
          >
            Choose Recipe
          </button>
          <button
            className={`px-4 py-2 ${
              selectedTab === "custom" ? "text-green-400 border-b-2 border-green-400" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setSelectedTab("custom")}
          >
            Custom Meal
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {selectedTab === "existing" ? (
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
          ) : (
            <div>
              <div className="mb-4">
                <label htmlFor="custom-meal" className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Meal Name
                </label>
                <input
                  type="text"
                  id="custom-meal"
                  value={customRecipe}
                  onChange={(e) => setCustomRecipe(e.target.value)}
                  placeholder="E.g., Takeout Pizza"
                  className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  autoFocus
                />
              </div>
            </div>
          )}
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
            disabled={
              (selectedTab === "existing" && !selectedRecipe) || (selectedTab === "custom" && !customRecipe.trim())
            }
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar size={16} />
            Add to Plan
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
