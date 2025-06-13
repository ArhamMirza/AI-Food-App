import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import HomeLandingPage from './pages/HomeLandingPage'
import Dashboard from './pages/Dashboard'
import CreateRecipe from './pages/CreateRecipe'
import ChatPage from './pages/ChatPage'
import RecipesPage from './pages/RecipesPage'
import RecipeViewPage from './pages/RecipeViewPage'
function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<HomeLandingPage/>} />
        <Route path="/auth" element={<AuthPage/>} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-recipe" element={<CreateRecipe/>}/>
        <Route path="/chat" element={<ChatPage/>}/>
        <Route path="/recipes" element={<RecipesPage/>}/>
        <Route path="/recipes/:recipeId" element={<RecipeViewPage/>}/>





      </Routes>
    </div>
  )
}

export default App
