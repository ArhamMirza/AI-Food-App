import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import HomeLandingPage from './pages/HomeLandingPage'
import Dashboard from './pages/Dashboard'
import CreateRecipe from './pages/CreateRecipe'
function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<HomeLandingPage/>} />
        <Route path="/auth" element={<AuthPage/>} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-recipe" element={<CreateRecipe/>}/>



      </Routes>
    </div>
  )
}

export default App
