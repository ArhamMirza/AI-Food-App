"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChefHat, Sparkles, Bot, Utensils, BookOpen, Users, Menu, X, ArrowRight } from "lucide-react"
import { useAppSelector } from "../redux/hooks"

const HomeLandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const user = useAppSelector((state) => state.user.user)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleGetStarted = () => {
    if (user) {
      window.location.href = "/dashboard"
    } else {
      window.location.href = "/auth"
    }
  }

  const features = [
    {
      icon: <Bot className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "AI-Powered Recipes",
      description:
        "Get personalized recipe suggestions based on your preferences, dietary restrictions, and available ingredients.",
    },
    {
      icon: <Utensils className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Smart Meal Planning",
      description:
        "Plan your weekly meals effortlessly with our intelligent meal planning system that considers your schedule.",
    },
    {
      icon: <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Cooking Guidance",
      description: "Step-by-step cooking instructions with tips and techniques to help you master any dish.",
    },
    {
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Community Recipes",
      description: "Share and discover amazing recipes from our community of food enthusiasts worldwide.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <style>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 sm:w-96 sm:h-96 bg-slate-800 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-64 h-64 sm:w-80 sm:h-80 bg-purple-800 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-60 h-60 sm:w-72 sm:h-72 bg-emerald-800 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? "bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <ChefHat className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-lg sm:text-xl font-bold">Food AI</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-300 hover:text-green-400 transition-colors text-sm">
                Features
              </a>
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm"
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300 hover:text-green-400 p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50">
            <div className="px-4 py-4 space-y-4">
              <a
                href="#features"
                className="block text-gray-300 hover:text-green-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  handleGetStarted()
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-2 rounded-lg font-semibold transition-all duration-200 text-sm"
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/25">
                <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
              </div>
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-400 absolute -top-1 -right-1 sm:-top-2 sm:-right-2 animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Your Personal
            <span className="text-green-400 block mt-1 sm:mt-2">AI Chef Assistant</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Discover personalized recipes, plan meals effortlessly, and elevate your cooking game with the power of
            artificial intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 px-4">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center"
            >
              {user ? "Go to Dashboard" : "Start Cooking Now"}
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">10K+</div>
              <div className="text-gray-400 text-sm sm:text-base">Recipes Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">5K+</div>
              <div className="text-gray-400 text-sm sm:text-base">Happy Cooks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">4.9★</div>
              <div className="text-gray-400 text-sm sm:text-base">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Powerful Features for
              <span className="text-green-400 block mt-1 sm:mt-2">Modern Cooking</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Everything you need to transform your kitchen experience and become a better cook.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 sm:p-6 hover:bg-slate-800/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 text-green-400">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Transform Your
              <span className="text-green-400 block mt-1 sm:mt-2">Cooking Experience?</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of home cooks who are already using AI to create amazing meals every day.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-semibold text-lg sm:text-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
            >
              {user ? "Go to Dashboard" : "Get Started Free Today"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 sm:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <div className="relative">
                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-lg sm:text-xl font-bold">Food AI Assistant</span>
            </div>
            <div className="flex space-x-6 sm:space-x-8 text-gray-400 text-sm sm:text-base">
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
          <div className="border-t border-slate-700/50 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>© 2025 Food AI Assistant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomeLandingPage
