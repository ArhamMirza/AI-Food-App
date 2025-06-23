"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Mail, Lock, User, ChefHat, Sparkles, X, CheckCircle } from "lucide-react"
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth"
import { auth, googleProvider } from "../firebase/firebase"
import { useAppDispatch, useAppSelector } from "../redux/hooks"
import { fetchUserInfo, setError } from "../redux/slices/userSlice"
import { useNavigate } from "react-router-dom"
import { useOnboarding } from "../context/OnboardingContext"

interface FormData {
  username?: string
  email: string
  password: string
  confirmPassword?: string
}

interface FormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

// Cookie utility functions
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`
}

const getCookie = (name: string): string | null => {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailVerificationPopup, setShowEmailVerificationPopup] = useState(false)
  const [firebaseLoaded, setFirebaseLoaded] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const userError = useAppSelector((state) => state.user.error)
  const { setAllowOnboarding } = useOnboarding()

  const BASE_URL = import.meta.env.VITE_API_URL


  useEffect(() => {
    // Check if Firebase is properly configured
    const checkFirebaseConfig = () => {
      const requiredEnvVars = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID"]

      const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName])

      if (missingVars.length > 0) {
        console.warn("Missing Firebase environment variables:", missingVars)
        setErrors({ general: "Firebase authentication is not configured properly" })
        return false
      }

      setFirebaseLoaded(true)
      return true
    }

    checkFirebaseConfig()

    // Check for redirect result (in case user was redirected back from Google)
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          handleFirebaseAuthSuccess(result.user)
        }
      })
      .catch((error) => {
        console.error("Redirect result error:", error)
        setErrors({ general: "Authentication redirect failed" })
      })
  }, [])

  const handleAuthSuccess = (data: any) => {
    // Store access token in localStorage (short-lived)
    localStorage.setItem("access_token", data.access_token)
    
    // Store refresh token in secure cookie (long-lived)
    if (data.refresh_token) {
      setCookie("refresh_token", data.refresh_token, 30) // 30 days
    }
  }

  const handleFirebaseAuthSuccess = async (user: any) => {
    try {
      setIsLoading(true)
      setErrors({})

      // Get the Firebase ID token
      const idToken = await user.getIdToken()

      // Send the Firebase ID token to your backend with credentials to set secure cookies
      const backendResponse = await fetch(`${BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: This allows cookies to be set
        body: JSON.stringify({ token: idToken }),
      })

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${backendResponse.status}: Authentication failed`)
      }

      const data = await backendResponse.json()
      console.log(data)

      // Handle token storage
      handleAuthSuccess(data)

      // Fetch user info and redirect
      const userInfo = await dispatch(fetchUserInfo(data.access_token)).unwrap()

      // Check if user needs onboarding

      const createdAt = new Date(userInfo.created_at);
      const now = new Date();
      const diffInMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;
      console.log(diffInMinutes)

      // You decide what "empty preferences" means
      const preferences = userInfo.preferences;
      const preferencesAreEmpty =
        (!preferences.dietary_restrictions || preferences.dietary_restrictions.length === 0) &&
        (!preferences.allergies || preferences.allergies.length === 0) &&
        (!preferences.favorite_cuisines || preferences.favorite_cuisines.length === 0)

      const shouldOnboard = (diffInMinutes-300) < 5 && preferencesAreEmpty;


      if (shouldOnboard) {
        setAllowOnboarding(true)
        navigate("/onboarding")
      } else {
        navigate("/dashboard")
      }



    } catch (error) {
      console.error("Firebase auth success handler error:", error)
      const errorMessage = error instanceof Error ? error.message : "Authentication failed"
      dispatch(setError(errorMessage))
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = "Username is required"
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters"
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const endpoint = isLogin ? `${BASE_URL}/auth/login` : `${BASE_URL}/auth/signup`
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: This allows cookies to be set
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log(data.access_token)

      if (response.ok) {
        if (isLogin) {
          // Handle token storage
          handleAuthSuccess(data)

          const userInfo = await dispatch(fetchUserInfo(data.access_token)).unwrap()

          // Check if user needs onboarding
          if (
            userInfo.preferences?.diet === "none" ||
            !userInfo.preferences?.allergies ||
            Object.keys(userInfo.preferences.allergies).length === 0
          ) {
            navigate("/onboarding")
          } else {
            navigate("/dashboard")
          }
        } else {
          setShowEmailVerificationPopup(true)
          setFormData({
            email: "",
            password: "",
            username: "",
            confirmPassword: "",
          })
        }
      } else {
        dispatch(setError(data.detail || "An error occurred"))
        setErrors({ general: data.detail || "An error occurred" })
      }
    } catch (error) {
      dispatch(setError("Network error. Please try again."))
      setErrors({ general: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (!firebaseLoaded) {
      setErrors({ general: "Firebase authentication is not ready. Please try again." })
      return
    }

    try {
      setIsLoading(true)
      setErrors({})

      // Try popup first, fallback to redirect on mobile or if popup is blocked
      try {
        const result = await signInWithPopup(auth, googleProvider)
        await handleFirebaseAuthSuccess(result.user)
      } catch (popupError: any) {
        console.error("Popup error:", popupError)

        // Handle specific Firebase Auth errors
        if (popupError.code === "auth/operation-not-allowed") {
          setErrors({
            general: "Google authentication is not enabled. Please check your Firebase project settings.",
          })
          return
        }

        if (popupError.code === "auth/unauthorized-domain") {
          setErrors({
            general: "This domain is not authorized. Please add it to your Firebase project settings.",
          })
          return
        }

        // If popup is blocked or fails, try redirect
        if (
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/popup-closed-by-user" ||
          popupError.code === "auth/cancelled-popup-request"
        ) {
          console.log("Popup blocked, trying redirect...")
          await signInWithRedirect(auth, googleProvider)
          // The redirect result will be handled in useEffect
        } else {
          throw popupError
        }
      }
    } catch (error: any) {
      console.error("Google auth error:", error)
      let errorMessage = "Google authentication failed"

      // Handle specific Firebase Auth error codes
      switch (error.code) {
        case "auth/operation-not-allowed":
          errorMessage = "Google authentication is not enabled in Firebase. Please enable it in your Firebase console."
          break
        case "auth/unauthorized-domain":
          errorMessage = "This domain is not authorized. Please add it to your Firebase project settings."
          break
        case "auth/popup-blocked":
          errorMessage = "Popup was blocked. Please allow popups and try again."
          break
        case "auth/popup-closed-by-user":
          errorMessage = "Authentication was cancelled"
          break
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection and try again."
          break
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later."
          break
        case "auth/user-disabled":
          errorMessage = "This account has been disabled."
          break
        default:
          if (error.message) {
            errorMessage = error.message
          }
      }

      dispatch(setError(errorMessage))
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const closeEmailVerificationPopup = () => {
    setShowEmailVerificationPopup(false)
    setIsLogin(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A1B3D] to-[#1A1A2E] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#3A2F5F] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-[#4A406F] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-80 w-72 h-72 bg-[#5A517F] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {showEmailVerificationPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2A1B3D]/50 backdrop-blur-sm border border-[#3A2F5F] rounded-2xl p-8 max-w-md w-full relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={closeEmailVerificationPopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#4CAF50] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#4CAF50]/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[#4CAF50]" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Check Your Email</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We've sent a verification link to <span className="text-[#4CAF50] font-medium">{formData.email}</span>.
                Please check your email and click the verification link to activate your account.
              </p>
              <div className="bg-[#2A1B3D]/70 rounded-lg p-4 mb-6">
                <p className="text-gray-400 text-sm">
                  <strong className="text-gray-300">Didn't receive the email?</strong>
                  <br />
                  Check your spam folder or contact support if you need help.
                </p>
              </div>
              <button
                onClick={closeEmailVerificationPopup}
                className="w-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-[#4CAF50]/25"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <ChefHat className="w-12 h-12 text-[#4CAF50]" />
              <Sparkles className="w-6 h-6 text-[#66BB6A] absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Food AI Assistant</h1>
        </div>

        <div className="bg-[#1A1A2E] backdrop-blur-md border border-[#3A2F5F] rounded-2xl p-8 shadow-2xl transform translate-y-[-20px] bg-opacity-90">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">{isLogin ? "Sign In" : "Create Account"}</h2>
            <p className="text-gray-400 mt-2">
              {isLogin ? "Welcome back! Enter your credentials to continue" : "Join us and start your culinary journey"}
            </p>
          </div>

          <div className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ""}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-[#2A1B3D]/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.username
                        ? "border-red-500 focus:ring-red-500"
                        : "border-[#3A2F5F] focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                    }`}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-[#2A1B3D]/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#3A2F5F] focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 bg-[#2A1B3D]/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#3A2F5F] focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-[#4CAF50] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword || ""}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-[#2A1B3D]/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-[#3A2F5F] focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-[#4CAF50] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
              </div>
            )}

            {(errors.general || userError) && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">{errors.general || userError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-[#4CAF50]/25"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#3A2F5F]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1A1A2E] text-gray-400">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading || !firebaseLoaded}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center border border-gray-300"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.60 3.30-4.53 6.16-4.53z"
                />
              </svg>
              {!firebaseLoaded ? "Loading Firebase..." : "Continue with Google"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#4CAF50] hover:text-[#66BB6A] font-medium transition-colors"
              >
                {isLogin ? "Sign up here" : "Sign in here"}
              </button>
            </p>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <a href="#" className="text-[#4CAF50] hover:text-[#66BB6A] text-sm transition-colors">
                Forgot your password?
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          By {isLogin ? "signing in" : "creating an account"}, you agree to our{" "}
          <a href="#" className="text-[#4CAF50] hover:text-[#66BB6A] transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-[#4CAF50] hover:text-[#66BB6A] transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}

export default AuthPage