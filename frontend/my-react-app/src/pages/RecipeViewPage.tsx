"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  ChefHat,
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  ShoppingBag,
  Check,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
  Save,
  Clock,
  Share2,
  Printer,
  FileText,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

interface Recipe {
  recipe_id: string
  title: string
  content: {
    text: string
  }
  created_at: string
  updated_at?: string
}

interface Ingredient {
  id: string
  name: string
  checked: boolean
  quantity?: string
}

type ViewMode = "recipe" | "shopping-list"

const RecipeViewPage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editTitle, setEditTitle] = useState<string>("")
  const [editContent, setEditContent] = useState<string>("")
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [scrollY, setScrollY] = useState<number>(0)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [newIngredient, setNewIngredient] = useState<string>("")
  const [newIngredientQuantity, setNewIngredientQuantity] = useState<string>("")
  const [showAddIngredient, setShowAddIngredient] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<ViewMode>("recipe")
  const navigate = useNavigate()

  const API_BASE_URL = import.meta.env.VITE_API_URL
  const RECIPE_URL = `${API_BASE_URL}/recipe`

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (recipeId) {
      fetchRecipe(recipeId)
    }
  }, [recipeId])

  const fetchRecipe = async (id: string) => {
    try {
      setLoading(true);

      const accessToken = localStorage.getItem("access_token"); // or sessionStorage, or from memory

      const response = await fetch(`${RECIPE_URL}/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error(`API call failed: ${response.status}`);

      const data = await response.json();

      if (data.data) {
        setRecipe(data.data);
        setEditTitle(data.data.title);
        setEditContent(data.data.content?.text || "");

        // Extract ingredients from recipe content
        extractIngredients(data.data.content?.text || "");
      }
    } catch (error) {
      console.error("Failed to load recipe:", error);
    } finally {
      setLoading(false);
    }
  };


  const extractIngredients = (content: string) => {
    const lines = content.split("\n")
    const extractedIngredients: Ingredient[] = []

    let inIngredientsSection = false
    let currentSectionStart = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // Check if this line is a heading (starts with #)
      if (trimmedLine.startsWith("#")) {
        // If we were in an ingredients section, stop here
        if (inIngredientsSection && currentSectionStart !== i) {
          break
        }

        // Check if this heading contains ingredients-related keywords
        const headingText = trimmedLine.toLowerCase()
        if (
          headingText.includes("ingredient") ||
          headingText.includes("you'll need") ||
          headingText.includes("you need") ||
          headingText.includes("shopping list") ||
          headingText.includes("what you need") ||
          headingText.includes("supplies") ||
          headingText.includes("materials")
        ) {
          inIngredientsSection = true
          currentSectionStart = i
          continue
        } else {
          inIngredientsSection = false
        }
      }

      // If we're in the ingredients section and the line isn't empty and isn't a heading
      if (inIngredientsSection && trimmedLine && !trimmedLine.startsWith("#")) {
        // Skip lines that look like section headers or recipe step titles
        const lowerLine = trimmedLine.toLowerCase()

        // Skip lines that end with colon (likely section headers)
        if (trimmedLine.endsWith(":")) {
          continue
        }

        // Skip lines that start with "For the" or "For" followed by a colon or capitalized word
        if (lowerLine.startsWith("for the ") || lowerLine.startsWith("for ")) {
          continue
        }

        // Skip lines that look like recipe step headers
        if (lowerLine.includes("step ") || lowerLine.includes("phase ") || lowerLine.includes("part ")) {
          continue
        }

        // Try to separate quantity from ingredient name
        const match = trimmedLine.match(
          /^([\d/.\s]+\s*(?:cup|cups|tbsp|tsp|tablespoon|teaspoon|oz|ounce|lb|pound|g|gram|ml|liter|pinch|dash|to taste|handful|piece|clove|cloves|bunch|can|package|stick|slice|slices)s?\.?)?\s*(.+)$/i,
        )

        if (match && match[2]) {
          const ingredientName = match[2].trim().replace(/^[-*•]\s*/, "")
          // Skip if the ingredient name looks like a section header
          if (!ingredientName.endsWith(":") && !ingredientName.toLowerCase().startsWith("for the")) {
            extractedIngredients.push({
              id: `ing-${extractedIngredients.length}`,
              name: ingredientName,
              quantity: match[1]?.trim() || "",
              checked: false,
            })
          }
        } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || trimmedLine.startsWith("• ")) {
          // Handle bullet points
          const ingredientText = trimmedLine.substring(2).trim()
          if (!ingredientText.endsWith(":") && !ingredientText.toLowerCase().startsWith("for the")) {
            extractedIngredients.push({
              id: `ing-${extractedIngredients.length}`,
              name: ingredientText,
              quantity: "",
              checked: false,
            })
          }
        } else if (/^\d+\./.test(trimmedLine)) {
          // Handle numbered lists
          const ingredientText = trimmedLine.replace(/^\d+\.\s*/, "").trim()
          if (!ingredientText.endsWith(":") && !ingredientText.toLowerCase().startsWith("for the")) {
            extractedIngredients.push({
              id: `ing-${extractedIngredients.length}`,
              name: ingredientText,
              quantity: "",
              checked: false,
            })
          }
        } else {
          // Handle plain text ingredients
          if (!trimmedLine.endsWith(":") && !lowerLine.startsWith("for the")) {
            extractedIngredients.push({
              id: `ing-${extractedIngredients.length}`,
              name: trimmedLine,
              quantity: "",
              checked: false,
            })
          }
        }
      }
    }

    // If we didn't find a dedicated ingredients section with # headings,
    // fall back to the original method for backward compatibility
    if (extractedIngredients.length === 0) {
      let inIngredientsSection = false

      for (const line of lines) {
        const trimmedLine = line.trim()
        const lowerLine = trimmedLine.toLowerCase()

        // Check if this line might be a section header for ingredients (non-# format)
        if (
          lowerLine.includes("ingredient") ||
          lowerLine.includes("you'll need") ||
          lowerLine.includes("you need") ||
          lowerLine.includes("shopping list")
        ) {
          inIngredientsSection = true
          continue
        }

        // Check if we've reached the end of the ingredients section
        if (
          inIngredientsSection &&
          (lowerLine.includes("instruction") ||
            lowerLine.includes("direction") ||
            lowerLine.includes("method") ||
            lowerLine.includes("step") ||
            trimmedLine === "")
        ) {
          inIngredientsSection = false
        }

        // If we're in the ingredients section and the line isn't empty
        if (inIngredientsSection && trimmedLine) {
          // Skip section headers
          if (trimmedLine.endsWith(":") || lowerLine.startsWith("for the")) {
            continue
          }

          if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || /^\d+\./.test(trimmedLine)) {
            const ingredientText = trimmedLine.replace(/^[-*\d.]+\s*/, "").trim()
            if (!ingredientText.endsWith(":") && !ingredientText.toLowerCase().startsWith("for the")) {
              extractedIngredients.push({
                id: `ing-${extractedIngredients.length}`,
                name: ingredientText,
                quantity: "",
                checked: false,
              })
            }
          }
        }
      }
    }

    setIngredients(extractedIngredients)
  }

  const handleUpdateRecipe = async () => {
    if (!recipe || !editTitle.trim() || !editContent.trim()) return;

    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");

      const response = await fetch(`${RECIPE_URL}/${recipe.recipe_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });

      if (!response.ok) throw new Error(`API call failed: ${response.status}`);

      // Update the local recipe state
      setRecipe({
        ...recipe,
        title: editTitle.trim(),
        content: { text: editContent.trim() },
        updated_at: new Date().toISOString(),
      });

      extractIngredients(editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipe || !window.confirm("Are you sure you want to delete this recipe?")) return

    try {
      setLoading(true)
      const response = await fetch(`${RECIPE_URL}/${recipe.recipe_id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error(`API call failed: ${response.status}`)

      // Navigate back to recipes page
      navigate("/recipes")
    } catch (error) {
      console.error("Failed to delete recipe:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToMealPlan = () => {
    // This would open the meal plan modal
    alert("Add to meal plan functionality would open the modal here")
  }

  const toggleIngredientCheck = (id: string) => {
    setIngredients(ingredients.map((ing) => (ing.id === id ? { ...ing, checked: !ing.checked } : ing)))
  }

  const handleAddIngredient = () => {
    if (!newIngredient.trim()) return

    setIngredients([
      ...ingredients,
      {
        id: `ing-${Date.now()}`,
        name: newIngredient.trim(),
        quantity: newIngredientQuantity.trim(),
        checked: false,
      },
    ])

    setNewIngredient("")
    setNewIngredientQuantity("")
    setShowAddIngredient(false)
  }

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id))
  }

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
              <button
                onClick={() => navigate("/recipes")}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <ChevronLeft size={18} />
                <span>Back to Recipes</span>
              </button>
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
                <button
                  onClick={() => navigate("/recipes")}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="hidden sm:inline">Back to Recipes</span>
                </button>
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
          {loading ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 animate-pulse">
                <div className="h-8 bg-slate-700/50 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-slate-700/50 rounded w-1/4 mb-8"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                  <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                  <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : recipe ? (
            <div className="max-w-4xl mx-auto">
              {/* Recipe Header */}
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">{recipe.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>Created {formatDate(recipe.created_at)}</span>
                      </div>
                      {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
                        <div className="flex items-center gap-1">
                          <Edit3 size={14} />
                          <span>Updated {formatDate(recipe.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddToMealPlan()}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="Add to Meal Plan"
                    >
                      <Calendar size={18} />
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                      title="Edit Recipe"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={handleDeleteRecipe}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete Recipe"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-2 text-gray-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                      title="Print Recipe"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => alert("Share functionality would be implemented here")}
                      className="p-2 text-gray-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                      title="Share Recipe"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex border-b border-slate-700/30 mb-6">
                  <button
                    onClick={() => setViewMode("recipe")}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                      viewMode === "recipe"
                        ? "border-green-500 text-green-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <FileText size={16} />
                    Recipe
                  </button>
                  {/* <button
                    onClick={() => setViewMode("shopping-list")}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                      viewMode === "shopping-list"
                        ? "border-green-500 text-green-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <ShoppingBag size={16} />
                    Shopping List
                    {ingredients.length > 0 && (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">
                        {ingredients.length}
                      </span>
                    )}
                  </button> */}
                </div>

                {isEditing ? (
                  /* Recipe Editor */
                  <div>
                    <div className="mb-6">
                      <label htmlFor="recipe-title" className="block text-sm font-medium text-gray-300 mb-2">
                        Recipe Title
                      </label>
                      <input
                        type="text"
                        id="recipe-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
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
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-96 bg-slate-900/50 text-white border border-slate-600/50 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none custom-scrollbar"
                        placeholder="Enter recipe instructions, ingredients, and notes..."
                      />
                    </div>

                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateRecipe}
                        disabled={!editTitle.trim() || !editContent.trim() || loading}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Save size={18} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Recipe Content or Shopping List */
                  <>
                    {viewMode === "recipe" ? (
                      /* Recipe Content */
                      <div className="prose prose-invert prose-headings:text-green-400 prose-strong:text-emerald-300 prose-em:text-blue-300 max-w-none">
                        {recipe.content?.text.split("\n\n").map((paragraph, i) => (
                          <p key={i} className="mb-4 text-gray-100 leading-relaxed">
                            {paragraph.split("\n").map((line, j) => (
                              <React.Fragment key={j}>
                                {line}
                                {j < paragraph.split("\n").length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </p>
                        ))}
                      </div>
                    ) : (
                      /* Shopping List */
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-semibold flex items-center gap-2">
                            <ShoppingBag size={20} className="text-green-400" />
                            Shopping List
                          </h2>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowAddIngredient(true)}
                              className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                            >
                              <Plus size={14} />
                              Add Item
                            </button>
                          </div>
                        </div>

                        {showAddIngredient && (
                          <div className="mb-4 p-4 bg-slate-700/30 rounded-lg">
                            <div className="flex flex-col sm:flex-row gap-3 mb-3">
                              <div className="flex-1">
                                <label
                                  htmlFor="ingredient-name"
                                  className="block text-xs font-medium text-gray-400 mb-1"
                                >
                                  Ingredient
                                </label>
                                <input
                                  type="text"
                                  id="ingredient-name"
                                  value={newIngredient}
                                  onChange={(e) => setNewIngredient(e.target.value)}
                                  className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                                  placeholder="e.g., Tomatoes"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="ingredient-quantity"
                                  className="block text-xs font-medium text-gray-400 mb-1"
                                >
                                  Quantity
                                </label>
                                <input
                                  type="text"
                                  id="ingredient-quantity"
                                  value={newIngredientQuantity}
                                  onChange={(e) => setNewIngredientQuantity(e.target.value)}
                                  className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                                  placeholder="e.g., 2 cups"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setShowAddIngredient(false)}
                                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleAddIngredient}
                                disabled={!newIngredient.trim()}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}

                        {ingredients.length > 0 ? (
                          <div className="space-y-2">
                            {ingredients.map((ingredient) => (
                              <div
                                key={ingredient.id}
                                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg group"
                              >
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleIngredientCheck(ingredient.id)}
                                    className={`w-5 h-5 rounded flex items-center justify-center ${
                                      ingredient.checked
                                        ? "bg-green-500 text-white"
                                        : "bg-slate-800 border border-slate-600 text-transparent"
                                    }`}
                                  >
                                    {ingredient.checked && <Check size={12} />}
                                  </button>
                                  <span
                                    className={`${
                                      ingredient.checked ? "line-through text-gray-500" : "text-white"
                                    } transition-all`}
                                  >
                                    {ingredient.quantity && (
                                      <span className="text-gray-400 mr-2">{ingredient.quantity}</span>
                                    )}
                                    {ingredient.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveIngredient(ingredient.id)}
                                  className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <ShoppingBag size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No ingredients found</p>
                            <p className="text-xs mt-1">Add ingredients to your shopping list</p>
                          </div>
                        )}

                        {ingredients.length > 0 && (
                          <div className="mt-6 flex justify-between items-center">
                            <div className="text-sm text-gray-400">
                              {ingredients.filter((i) => i.checked).length} of {ingredients.length} items checked
                            </div>
                            <button
                              onClick={() => setIngredients(ingredients.map((ing) => ({ ...ing, checked: false })))}
                              className="text-sm text-green-400 hover:text-green-500"
                            >
                              Uncheck All
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto text-center py-12">
              <ChefHat size={48} className="mx-auto text-gray-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Recipe Not Found</h2>
              <p className="text-gray-400 mb-6">The recipe you're looking for doesn't exist or has been deleted.</p>
              <button
                onClick={() => navigate("/recipes")}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-colors"
              >
                Back to Recipes
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  )
}

export default RecipeViewPage
