"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  ChefHat,
  ArrowLeft,
  Edit3,
  Save,
  X,
  User,
  Settings,
  Camera,
  Check,
  AlertCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "../redux/hooks"
import { updateUser } from "../redux/slices/userSlice"
import { authorizedFetch } from "../utils/auth"


interface UserPreferences {
  dietary_restrictions: string[]
  allergies: string[]
  favorite_cuisines: string[]
  disliked_ingredients: string[]
  cooking_skill_level: "beginner" | "intermediate" | "advanced"
  preferred_meal_prep_time: number | null
}

interface ProfileFormData {
  username: string
  email: string
  preferences: UserPreferences
}

const ProfilePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [scrollY, setScrollY] = useState<number>(0)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "security">("profile")

  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user:any = useAppSelector((state) => state.user.user)

  const BASE_URL = import.meta.env.VITE_API_URL


  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || "",
    email: user?.email || "",
    preferences: {
      dietary_restrictions: user?.preferences?.dietary_restrictions || [],
      allergies: user?.preferences?.allergies || [],
      favorite_cuisines: user?.preferences?.favorite_cuisines || [],
      disliked_ingredients: user?.preferences?.disliked_ingredients || [],
      cooking_skill_level: user?.preferences?.cooking_skill_level || "beginner",
      preferred_meal_prep_time: user?.preferences?.preferred_meal_prep_time || null,
    },
  })

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        preferences: {
          dietary_restrictions: user.preferences?.dietary_restrictions || [],
          allergies: user.preferences?.allergies || [],
          favorite_cuisines: user.preferences?.favorite_cuisines || [],
          disliked_ingredients: user.preferences?.disliked_ingredients || [],
          cooking_skill_level: user.preferences?.cooking_skill_level || "beginner",
          preferred_meal_prep_time: user.preferences?.preferred_meal_prep_time || null,
        },
      })
    }
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("preferences.")) {
      const prefField = field.replace("preferences.", "")
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleArrayAdd = (field: string, value: string) => {
    if (!value.trim()) return
    const prefField = field.replace("preferences.", "")
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [prefField]: [...(prev.preferences[prefField as keyof UserPreferences] as string[]), value.trim()],
      },
    }))
  }

  const handleArrayRemove = (field: string, index: number) => {
    const prefField = field.replace("preferences.", "")
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [prefField]: (prev.preferences[prefField as keyof UserPreferences] as string[]).filter((_, i) => i !== index),
      },
    }))
  }

const handleSave = async () => {
  try {
    setLoading(true)
    setError("")
    console.log(formData)

    const response = await authorizedFetch(`${BASE_URL}/user/update`, {
      method: "PUT",
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error("Failed to update profile")
    }

    const updatedUser = await response.json()

    dispatch(updateUser(updatedUser)) // ✅ Redux state updated

    setIsEditing(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  } catch (error) {
    console.error("Failed to update profile:", error)
    setError("Failed to update profile. Please try again.")
  } finally {
    setLoading(false)
  }
}



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const skillLevels = [
    { value: "beginner", label: "Beginner", description: "Just starting out" },
    { value: "intermediate", label: "Intermediate", description: "Some cooking experience" },
    { value: "advanced", label: "Advanced", description: "Experienced cook" },
  ]

  const commonDietaryRestrictions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Keto",
    "Paleo",
    "Low-Carb",
    "Halal",
    "Kosher",
  ]

  const commonAllergies = ["Nuts", "Shellfish", "Eggs", "Dairy", "Soy", "Wheat", "Fish", "Sesame"]

  const commonCuisines = [
    "Italian",
    "Mexican",
    "Chinese",
    "Japanese",
    "Indian",
    "Thai",
    "French",
    "Mediterranean",
    "American",
    "Korean",
  ]

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
                <User size={18} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar content - simplified */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="space-y-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors w-full text-left"
              >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </button>
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
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
                <h1 className="text-xl font-semibold">Profile Settings</h1>
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
          <div className="max-w-4xl mx-auto">
            {/* Success Message */}
            {saveSuccess && (
              <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                <Check className="text-green-400" size={20} />
                <span className="text-green-300">Profile updated successfully!</span>
              </div>
            )}

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

            {/* Profile Header */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center relative group cursor-pointer">
                    <User size={32} className="text-white" />
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{user?.username}</h1>
                    <p className="text-gray-400">{user?.email}</p>
                    <p className="text-sm text-gray-500">
                      Member since {user?.created_at ? formatDate(user.created_at) : "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Edit3 size={16} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save size={16} />
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl mb-6">
              <div className="flex border-b border-slate-700/30">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === "profile"
                      ? "border-green-500 text-green-400"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <User size={18} />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("preferences")}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === "preferences"
                      ? "border-green-500 text-green-400"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Settings size={18} />
                  Preferences
                </button>
              </div>

              <div className="p-6">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange("username", e.target.value)}
                          disabled={!isEditing}
                          className="w-full bg-slate-900/50 text-white border border-slate-600/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cooking Skill Level</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {skillLevels.map((level) => (
                          <button
                            key={level.value}
                            onClick={() => handleInputChange("preferences.cooking_skill_level", level.value)}
                            disabled={!isEditing}
                            className={`p-4 rounded-lg border transition-colors text-left ${
                              formData.preferences.cooking_skill_level === level.value
                                ? "border-green-500 bg-green-500/20"
                                : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                            } disabled:opacity-50`}
                          >
                            <div className="font-medium">{level.label}</div>
                            <div className="text-sm text-gray-400">{level.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Preferred Meal Prep Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.preferences.preferred_meal_prep_time || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "preferences.preferred_meal_prep_time",
                            Number.parseInt(e.target.value) || null,
                          )
                        }
                        disabled={!isEditing}
                        placeholder="e.g., 30"
                        className="w-full bg-slate-900/50 text-white border border-slate-600/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50"
                      />
                    </div>

                    <ArrayField
                      label="Dietary Restrictions"
                      values={formData.preferences.dietary_restrictions}
                      suggestions={commonDietaryRestrictions}
                      onAdd={(value) => handleArrayAdd("preferences.dietary_restrictions", value)}
                      onRemove={(index) => handleArrayRemove("preferences.dietary_restrictions", index)}
                      isEditing={isEditing}
                    />

                    <ArrayField
                      label="Allergies"
                      values={formData.preferences.allergies}
                      suggestions={commonAllergies}
                      onAdd={(value) => handleArrayAdd("preferences.allergies", value)}
                      onRemove={(index) => handleArrayRemove("preferences.allergies", index)}
                      isEditing={isEditing}
                    />

                    <ArrayField
                      label="Favorite Cuisines"
                      values={formData.preferences.favorite_cuisines}
                      suggestions={commonCuisines}
                      onAdd={(value) => handleArrayAdd("preferences.favorite_cuisines", value)}
                      onRemove={(index) => handleArrayRemove("preferences.favorite_cuisines", index)}
                      isEditing={isEditing}
                    />
                  </div>
                )}

                {/* Security Tab */}
                
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  )
}

// Array Field Component for managing lists
interface ArrayFieldProps {
  label: string
  values: string[]
  suggestions: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  isEditing: boolean
}

const ArrayField: React.FC<ArrayFieldProps> = ({ label, values, suggestions, onAdd, onRemove, isEditing }) => {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleAdd = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onAdd(inputValue.trim())
      setInputValue("")
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (!values.includes(suggestion)) {
      onAdd(suggestion)
    }
    setShowSuggestions(false)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="space-y-3">
        {/* Current values */}
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
            >
              {value}
              {isEditing && (
                <button onClick={() => onRemove(index)} className="hover:text-green-300">
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>

        {/* Add new */}
        {isEditing && (
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
                placeholder={`Add ${label.toLowerCase()}`}
                className="flex-1 bg-slate-900/50 text-white border border-slate-600/50 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>

            {/* Suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                {suggestions
                  .filter((suggestion) => !values.includes(suggestion))
                  .filter((suggestion) => suggestion.toLowerCase().includes(inputValue.toLowerCase()))
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage