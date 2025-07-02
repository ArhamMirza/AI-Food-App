import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import HomeLandingPage from './pages/HomeLandingPage'
import Dashboard from './pages/Dashboard'
import ChatPage from './pages/ChatPage'
import RecipesPage from './pages/RecipesPage'
import RecipeViewPage from './pages/RecipeViewPage'
import MealPlanPage from './pages/MealPlanPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute' // ✅ import this
import OnboardingPage from './pages/OnboardingPage'
import OnboardingGuard from './components/OnboardingGuard'
import TestRedirect from './pages/TestRedirect'


function App() {
  return (
    <div>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomeLandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />


        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes"
          element={
            <ProtectedRoute>
              <RecipesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes/:recipeId"
          element={
            <ProtectedRoute>
              <RecipeViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meal-plans"
          element={
            <ProtectedRoute>
              <MealPlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <OnboardingPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/test-auth" element={<TestRedirect />} />


      </Routes>
    </div>
  )
}

export default App
