// src/components/OnboardingGuard.tsx
import { useOnboarding } from '../context/OnboardingContext'
import { Navigate } from 'react-router-dom'

const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { allowOnboarding } = useOnboarding()
  return allowOnboarding ? <>{children}</> : <Navigate to="/dashboard" />
}

export default OnboardingGuard
