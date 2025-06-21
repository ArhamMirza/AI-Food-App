// src/context/OnboardingContext.tsx
import { createContext, useContext, useState } from 'react'

const OnboardingContext = createContext({
  allowOnboarding: false,
  setAllowOnboarding: (value: boolean) => {},
})

export const useOnboarding = () => useContext(OnboardingContext)

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [allowOnboarding, setAllowOnboarding] = useState(false)

  return (
    <OnboardingContext.Provider value={{ allowOnboarding, setAllowOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  )
}
