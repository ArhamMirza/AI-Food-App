import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import HomeLandingPage from './pages/HomeLandingPage'
import Dashboard from './pages/Dashboard'
import CreateRecipe from './pages/CreateRecipe'
import ChatPage from './pages/ChatPage'
import RecipesPage from './pages/RecipesPage'
import RecipeViewPage from './pages/RecipeViewPage'
import MealPlanPage from './pages/MealPlanPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute' // ✅ import this
import OnboardingPage from './pages/OnboardingPage'

function App() {
  return (
    <div>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomeLandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />

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
          path="/create-recipe"
          element={
            <ProtectedRoute>
              <CreateRecipe />
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
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
