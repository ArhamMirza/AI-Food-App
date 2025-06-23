"use client"

import type React from "react"
import { useState } from "react"
import {
  ChefHat,
  Sparkles,
  ArrowRight,
  SkipBackIcon as Skip,
  Save,
  X,
  Check,
  AlertCircle,
  Clock,
  Utensils,
  Heart,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "../redux/hooks"
import { authorizedFetch } from "../utils/auth"
import { updateUser } from "../redux/slices"

interface UserPreferences {
  dietary_restrictions: string[]
  allergies: string[]
  favorite_cuisines: string[]
  disliked_ingredients: string[]
  cooking_skill_level: "beginner" | "intermediate" | "advanced"
  preferred_meal_prep_time: number | null
}

interface OnboardingFormData {
  preferences: UserPreferences
}

const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<boolean>(false)

  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user :any = useAppSelector((state) => state.user.user)

  const BASE_URL = import.meta.env.VITE_API_URL


  const [formData, setFormData] = useState<OnboardingFormData>({
    preferences: {
      dietary_restrictions: [],
      allergies: [],
      favorite_cuisines: [],
      disliked_ingredients: [],
      cooking_skill_level: "beginner",
      preferred_meal_prep_time: null,
    },
  })

  const totalSteps = 4

  const handleInputChange = (field: string, value: any) => {
    const prefField = field.replace("preferences.", "")
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [prefField]: value,
      },
    }))
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

      const response = await authorizedFetch(`${BASE_URL}/user/update`, {
        method: "PUT",
        body: JSON.stringify({
          user_id: user?.id,
          preferences: formData.preferences,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to update profile")
      }
      dispatch(updateUser({ preferences: formData.preferences }))

      setSuccess(true)
      setTimeout(() => {
        navigate("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Failed to update profile:", error)
      setError(error instanceof Error ? error.message : "Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate("/dashboard")
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skillLevels = [
    {
      value: "beginner",
      label: "Beginner",
      description: "Just starting out, learning the basics",
      icon: <Clock size={24} />,
    },
    {
      value: "intermediate",
      label: "Intermediate",
      description: "Some cooking experience, comfortable with recipes",
      icon: <Utensils size={24} />,
    },
    {
      value: "advanced",
      label: "Advanced",
      description: "Experienced cook, comfortable experimenting",
      icon: <ChefHat size={24} />,
    },
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
    "Low-Sodium",
  ]

  const commonAllergies = [
    "Nuts",
    "Peanuts",
    "Shellfish",
    "Fish",
    "Eggs",
    "Dairy",
    "Soy",
    "Wheat",
    "Sesame",
    "Sulfites",
  ]

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
    "Greek",
    "Spanish",
  ]

  const prepTimes = [
    { value: 15, label: "15 minutes", description: "Quick meals" },
    { value: 30, label: "30 minutes", description: "Standard cooking time" },
    { value: 45, label: "45 minutes", description: "More involved recipes" },
    { value: 60, label: "1 hour", description: "Complex dishes" },
    { value: 90, label: "1.5 hours", description: "Special occasion cooking" },
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/20">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Welcome to Food AI!</h2>
          <p className="text-gray-300 mb-6 text-sm sm:text-base">
            Your preferences have been saved. Let's start cooking!
          </p>
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-400 text-sm sm:text-base">Redirecting to dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-[#3A2F5F] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-20 sm:top-40 right-10 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-[#4A406F] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 sm:left-80 w-48 h-48 sm:w-72 sm:h-72 bg-[#5A517F] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl">
          {/* Enhanced Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center ring-4 ring-green-500/20">
                  <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-green-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Welcome to Food AI!</h1>
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg">Let's personalize your cooking experience</p>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs sm:text-sm text-gray-400 font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-xs sm:text-sm text-gray-400 font-medium">
                {Math.round((currentStep / totalSteps) * 100)}% complete
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 sm:h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Enhanced Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-500/20 border border-red-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-3 backdrop-blur-sm">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
              <span className="text-red-300 text-sm sm:text-base flex-1">{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Enhanced Main Content */}
          <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
            {/* Step 1: Cooking Skill Level */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">What's your cooking skill level?</h2>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">
                  This helps us suggest recipes that match your experience
                </p>

                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {skillLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleInputChange("preferences.cooking_skill_level", level.value)}
                      className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-300 text-left group ${
                        formData.preferences.cooking_skill_level === level.value
                          ? "border-green-500 bg-green-500/20 scale-[1.02] shadow-lg shadow-green-500/20"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
                            formData.preferences.cooking_skill_level === level.value
                              ? "bg-green-500/30 text-green-400 scale-110"
                              : "bg-slate-600/50 text-gray-400 group-hover:bg-slate-600/70"
                          }`}
                        >
                          {level.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-base sm:text-lg">{level.label}</div>
                          <div className="text-gray-400 text-xs sm:text-sm mt-1">{level.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Preferred Meal Prep Time */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                  How much time do you usually have for cooking?
                </h2>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">
                  We'll prioritize recipes that fit your schedule
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {prepTimes.map((time) => (
                    <button
                      key={time.value}
                      onClick={() => handleInputChange("preferences.preferred_meal_prep_time", time.value)}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 text-left group ${
                        formData.preferences.preferred_meal_prep_time === time.value
                          ? "border-green-500 bg-green-500/20 scale-[1.02] shadow-lg shadow-green-500/20"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="font-semibold text-sm sm:text-base">{time.label}</div>
                      <div className="text-gray-400 text-xs sm:text-sm mt-1">{time.description}</div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 sm:mt-8">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Or enter a custom time (minutes)
                  </label>
                  <input
                    type="number"
                    value={
                      prepTimes.find((t) => t.value === formData.preferences.preferred_meal_prep_time)
                        ? ""
                        : formData.preferences.preferred_meal_prep_time || ""
                    }
                    onChange={(e) =>
                      handleInputChange("preferences.preferred_meal_prep_time", Number.parseInt(e.target.value) || null)
                    }
                    placeholder="e.g., 25"
                    className="w-full sm:w-48 bg-slate-900/50 text-white border border-slate-600/50 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Dietary Restrictions & Allergies */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                  Any dietary restrictions or allergies?
                </h2>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">
                  We'll make sure to avoid ingredients that don't work for you
                </p>

                <div className="space-y-6 sm:space-y-8">
                  <MultiSelectField
                    label="Dietary Restrictions"
                    description="Select any that apply to you"
                    values={formData.preferences.dietary_restrictions}
                    options={commonDietaryRestrictions}
                    onAdd={(value) => handleArrayAdd("preferences.dietary_restrictions", value)}
                    onRemove={(index) => handleArrayRemove("preferences.dietary_restrictions", index)}
                    icon={<Heart size={16} />}
                  />

                  <MultiSelectField
                    label="Allergies"
                    description="Important for your safety"
                    values={formData.preferences.allergies}
                    options={commonAllergies}
                    onAdd={(value) => handleArrayAdd("preferences.allergies", value)}
                    onRemove={(index) => handleArrayRemove("preferences.allergies", index)}
                    icon={<AlertCircle size={16} />}
                    variant="warning"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Favorite Cuisines */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">What cuisines do you love?</h2>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">
                  We'll suggest more recipes from your favorite cuisines
                </p>

                <MultiSelectField
                  label="Favorite Cuisines"
                  description="Select as many as you like"
                  values={formData.preferences.favorite_cuisines}
                  options={commonCuisines}
                  onAdd={(value) => handleArrayAdd("preferences.favorite_cuisines", value)}
                  onRemove={(index) => handleArrayRemove("preferences.favorite_cuisines", index)}
                  icon={<ChefHat size={16} />}
                />
              </div>
            )}

            {/* Enhanced Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-700/50 gap-4 sm:gap-0">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base font-medium"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  className="px-4 sm:px-6 py-2 sm:py-3 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Skip size={16} />
                  Skip for now
                </button>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                {currentStep < totalSteps ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base font-semibold"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save & Continue
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Multi-Select Field Component
interface MultiSelectFieldProps {
  label: string
  description: string
  values: string[]
  options: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  icon: React.ReactNode
  variant?: "default" | "warning"
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  description,
  values,
  options,
  onAdd,
  onRemove,
  icon,
  variant = "default",
}) => {
  const [showAll, setShowAll] = useState(false)
  const displayOptions = showAll ? options : options.slice(0, 8)

  const colorClasses = {
    default: {
      selected: "bg-green-500/20 text-green-400 border-green-500/30 shadow-lg shadow-green-500/20",
      unselected: "bg-slate-700/30 text-gray-300 border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/50",
      icon: "text-green-400",
      selectedChip: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    warning: {
      selected: "bg-red-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/20",
      unselected: "bg-slate-700/30 text-gray-300 border-slate-600/50 hover:border-slate-500 hover:bg-slate-700/50",
      icon: "text-red-400",
      selectedChip: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  }

  const colors = colorClasses[variant]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`${colors.icon} flex-shrink-0`}>{icon}</span>
        <h3 className="text-base sm:text-lg font-semibold">{label}</h3>
      </div>
      <p className="text-gray-400 text-xs sm:text-sm mb-4">{description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
        {displayOptions.map((option) => {
          const isSelected = values.includes(option)
          return (
            <button
              key={option}
              onClick={() => (isSelected ? onRemove(values.indexOf(option)) : onAdd(option))}
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-300 text-xs sm:text-sm font-medium hover:scale-[1.02] ${
                isSelected ? colors.selected : colors.unselected
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {options.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 sm:mt-4 text-green-400 hover:text-green-300 text-xs sm:text-sm font-medium transition-colors"
        >
          {showAll ? "Show less" : `Show ${options.length - 8} more`}
        </button>
      )}

      {values.length > 0 && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-700/20 rounded-lg sm:rounded-xl border border-slate-700/30">
          <p className="text-xs sm:text-sm text-gray-400 mb-3 font-medium">Selected ({values.length}):</p>
          <div className="flex flex-wrap gap-2">
            {values.map((value, index) => (
              <span
                key={index}
                className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all duration-300 ${colors.selectedChip}`}
              >
                {value}
                <button onClick={() => onRemove(index)} className="hover:opacity-70 transition-opacity ml-1">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OnboardingPage
