"use client"

import type React from "react"
import { useAppSelector } from "../redux/hooks"

import { useState, useEffect, useRef } from "react"
import {
  ChefHat,
  Plus,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Calendar,
  Save,
  ArrowLeft,
  Clock,
  Utensils,
  Trash2,
  Edit3,
  ChevronDown,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Recipe {
  recipe_id: string
  title: string
  content: {
    text: string
  }
  created_at: string
  updated_at?: string
}

interface MealPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (date: string, mealType: string) => void
  recipe: Recipe | null
}

const RecipesPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [scrollY, setScrollY] = useState<number>(0)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null)
  const [newRecipeTitle, setNewRecipeTitle] = useState<string>("")
  const [newRecipeContent, setNewRecipeContent] = useState<string>("")
  const [showMealPlanModal, setShowMealPlanModal] = useState<boolean>(false)
  const [selectedRecipeForMealPlan, setSelectedRecipeForMealPlan] = useState<Recipe | null>(null)

  const navigate = useNavigate()

  const API_BASE_URL = "http://localhost:8000/api/v1"
  const RECIPE_URL = `${API_BASE_URL}/recipe`
  const user:any = useAppSelector((state) => state.user.user)
  const USER_ID = user.id

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    fetchUserRecipes()
  }, [])

  const fetchUserRecipes = async () => {
    try {
      setLoading(true);

      const accessToken = localStorage.getItem("access_token"); // or from memory/sessionStorage

      const response = await fetch(`${RECIPE_URL}/user/${USER_ID}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error(`API call failed: ${response.status}`);

      const data = await response.json();
      setRecipes(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to load recipes:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateRecipe = async () => {
    if (!newRecipeTitle.trim() || !newRecipeContent.trim()) return;

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");

      const response = await fetch(RECIPE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: USER_ID,
          title: newRecipeTitle.trim(),
          content: newRecipeContent.trim(),
        }),
      });

      if (!response.ok) throw new Error(`API call failed: ${response.status}`);

      await fetchUserRecipes();
      setNewRecipeTitle("");
      setNewRecipeContent("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecipe = async () => {
    if (!currentRecipe || !newRecipeTitle.trim() || !newRecipeContent.trim()) return;

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");

      const response = await fetch(`${RECIPE_URL}/${currentRecipe.recipe_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: newRecipeTitle.trim(),
          content: newRecipeContent.trim(),
        }),
      });

      if (!response.ok) throw new Error(`API call failed: ${response.status}`);

      await fetchUserRecipes();
      setNewRecipeTitle("");
      setNewRecipeContent("");
      setCurrentRecipe(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update recipe:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteRecipe = async (recipeId: string) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");

      const response = await fetch(`${RECIPE_URL}/${recipeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error(`API call failed: ${response.status}`);

      await fetchUserRecipes();
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    } finally {
      setLoading(false);
    }
  };




  const handleEditRecipe = (recipe: Recipe) => {
    setCurrentRecipe(recipe)
    setNewRecipeTitle(recipe.title)
    setNewRecipeContent(recipe.content?.text || "")
    setIsEditing(true)
  }

  const handleAddToMealPlan = (recipe: Recipe) => {
    setSelectedRecipeForMealPlan(recipe)
    setShowMealPlanModal(true)
  }

  const handleSaveToMealPlan = async (date: string, mealType: string) => {
    if (!selectedRecipeForMealPlan) return

    try {
      setLoading(true)
      // This would be replaced with an actual API call to save to meal plan
      console.log(`Adding recipe ${selectedRecipeForMealPlan.recipe_id} to meal plan on ${date} as ${mealType}`)

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Close modal
      setShowMealPlanModal(false)
      setSelectedRecipeForMealPlan(null)

      // Show success message
      alert(`Recipe added to meal plan for ${date} as ${mealType}`)
    } catch (error) {
      console.error("Failed to add to meal plan:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecipes = recipes.filter((recipe) => recipe.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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

      {/* Sidebar - simplified for this example */}
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
        {/* Sidebar header */}
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

        {/* Sidebar content - simplified */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="space-y-2">
              <a
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <ChevronLeft size={18} />
                <span>Back to Dashboard</span>
              </a>
            </div>
          )}
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
                <h1 className="text-xl font-semibold">My Recipes</h1>
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
          {isCreating || isEditing ? (
            <div className="max-w-4xl mx-auto">
              {/* Recipe Editor */}
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setIsEditing(false)
                    setCurrentRecipe(null)
                    setNewRecipeTitle("")
                    setNewRecipeContent("")
                  }}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Back to Recipes</span>
                </button>
                <h2 className="text-2xl font-semibold">{isEditing ? "Edit Recipe" : "Create New Recipe"}</h2>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="mb-6">
                  <label htmlFor="recipe-title" className="block text-sm font-medium text-gray-300 mb-2">
                    Recipe Title
                  </label>
                  <input
                    type="text"
                    id="recipe-title"
                    value={newRecipeTitle}
                    onChange={(e) => setNewRecipeTitle(e.target.value)}
                    className="w-full bg-slate-900/50 text-white border border-slate-600/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    placeholder="Enter recipe title..."
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="recipe-content" className="block text-sm font-medium text-gray-300 mb-2">
                    Recipe Content
                  </label>
                  <textarea
                    id="recipe-content"
                    value={newRecipeContent}
                    onChange={(e) => setNewRecipeContent(e.target.value)}
                    className="w-full h-96 bg-slate-900/50 text-white border border-slate-600/50 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none custom-scrollbar"
                    placeholder="Enter recipe instructions, ingredients, and notes..."
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setIsEditing(false)
                      setCurrentRecipe(null)
                      setNewRecipeTitle("")
                      setNewRecipeContent("")
                    }}
                    className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isEditing ? handleUpdateRecipe : handleCreateRecipe}
                    disabled={!newRecipeTitle.trim() || !newRecipeContent.trim() || loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save size={18} />
                    {isEditing ? "Update Recipe" : "Save Recipe"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Recipe List View */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-semibold">Your Recipes</h2>
                  <span className="bg-slate-700/50 text-gray-300 px-3 py-1 rounded-full text-sm">
                    {recipes.length} {recipes.length === 1 ? "Recipe" : "Recipes"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search recipes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/30 w-full"
                    />
                  </div>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={18} />
                    New Recipe
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 animate-pulse"
                    >
                      <div className="h-7 bg-slate-700/50 rounded w-1/3 mb-4"></div>
                      <div className="h-4 bg-slate-700/50 rounded w-full mb-2"></div>
                      <div className="h-4 bg-slate-700/50 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : filteredRecipes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredRecipes.map((recipe) => (
                    <div
                      key={recipe.recipe_id}
                      className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/recipes/${recipe.recipe_id}`)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>Created {formatDate(recipe.created_at)}</span>
                            </div>
                            {recipe.content?.text && (
                              <div className="flex items-center gap-1">
                                <Utensils size={14} />
                                <span>
                                  {recipe.content.text.length > 200
                                    ? `${recipe.content.text.substring(0, 200)}...`
                                    : recipe.content.text}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2 self-end md:self-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAddToMealPlan(recipe)}
                            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            title="Add to Meal Plan"
                          >
                            <Calendar size={18} />
                          </button>
                          <button
                            onClick={() => handleEditRecipe(recipe)}
                            className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                            title="Edit Recipe"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecipe(recipe.recipe_id)}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete Recipe"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                     
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
                  {searchQuery ? (
                    <>
                      <Search size={40} className="mx-auto text-gray-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Matching Recipes</h3>
                      <p className="text-gray-400 mb-6">No recipes match your search for "{searchQuery}"</p>
                      <button onClick={() => setSearchQuery("")} className="text-green-400 hover:text-green-500">
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <ChefHat size={40} className="mx-auto text-gray-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Recipes Yet</h3>
                      <p className="text-gray-400 mb-6">
                        Create your first recipe or chat with Food AI to generate one
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={() => setIsCreating(true)}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          Create Recipe
                        </button>
                        <button
                          onClick={() => navigate("/chat")}
                          className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={18} />
                          Chat with Food AI
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>
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
          onSave={handleSaveToMealPlan}
          recipe={selectedRecipeForMealPlan}
        />
      )}
    </div>
  )
}

// Replace the MealPlanModal component with this improved version that has a centered calendar popup

// Meal Plan Modal Component
const MealPlanModal: React.FC<MealPlanModalProps> = ({ isOpen, onClose, onSave, recipe }) => {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedMealType, setSelectedMealType] = useState<string>("dinner")
  const [showCalendar, setShowCalendar] = useState<boolean>(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set default date to today
    const today = new Date()
    setSelectedDate(today.toISOString().split("T")[0])
  }, [])

  const handleSave = () => {
    if (!selectedDate || !selectedMealType) return
    onSave(selectedDate, selectedMealType)
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month with proper date objects
    for (let i = 1; i <= daysInMonth; i++) {
      // Create a new date object for each day to avoid reference issues
      const date = new Date(year, month, i)
      days.push(date)
    }

    return days
  }

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  const handleSelectDate = (date: Date) => {
    // Create a new Date object to avoid timezone issues
    const selectedDate = new Date(date)
    // Format with local timezone to ensure correct date
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth() + 1 // getMonth() is 0-indexed
    const day = selectedDate.getDate()

    // Format as YYYY-MM-DD ensuring proper padding with leading zeros
    const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
    setSelectedDate(formattedDate)
    setShowCalendar(false)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false

    const selected = new Date(selectedDate)

    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Add to Meal Plan</h3>

        {recipe && (
          <p className="text-gray-300 mb-4">
            Adding <span className="font-semibold text-green-400">{recipe.title}</span> to your meal plan
          </p>
        )}

        <div className="mb-4">
          <label htmlFor="meal-date" className="block text-sm font-medium text-gray-300 mb-2">
            Date
          </label>
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 text-left flex justify-between items-center hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-green-400" />
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>
            <ChevronDown size={16} />
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="meal-type" className="block text-sm font-medium text-gray-300 mb-2">
            Meal Type
          </label>
          <select
            id="meal-type"
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value)}
            className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Calendar size={16} />
            Add to Plan
          </button>
        </div>

        {/* Calendar Popup */}
        {showCalendar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              ref={calendarRef}
              className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in duration-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Select Date</h3>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="p-1 hover:bg-slate-700 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="font-medium text-lg">
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <div className="font-medium text-lg">
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-3">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-gray-400 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((date, index) => (
                  <div key={index} className="aspect-square">
                    {date ? (
                      <button
                        type="button"
                        onClick={() => handleSelectDate(date)}
                        className={`w-full h-full flex items-center justify-center rounded-lg text-sm transition-colors
                          ${
                            isSelectedDate(date)
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : isToday(date)
                                ? "bg-slate-700 text-white hover:bg-slate-600"
                                : "hover:bg-slate-700 text-gray-200"
                          }`}
                      >
                        {date.getDate()}
                      </button>
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowCalendar(false)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipesPage
