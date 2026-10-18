"use client"

import { useEffect, useState } from "react"
import { getRedirectResult, type User } from "firebase/auth"
import { auth } from "../firebase/firebase"

export const useAuthRedirect = (onSuccess: (user: User) => void, onError: (error: any) => void) => {
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkRedirectResult = async () => {
      try {
        // Add a small delay to ensure Firebase is fully initialized
        await new Promise((resolve) => setTimeout(resolve, 100))

        const result = await getRedirectResult(auth)

        if (!mounted) return

        if (result && result.user) {
          onSuccess(result.user)
        }
      } catch (error: any) {
        console.error("[AUTH] Redirect result error:", error)
        if (mounted) {
          onError(error)
        }
      } finally {
        if (mounted) {
          setIsCheckingRedirect(false)
        }
      }
    }

    // Check immediately and also after a short delay
    checkRedirectResult()

    // Also check after a longer delay in case of slow networks
    const timeoutId = setTimeout(checkRedirectResult, 1000)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [onSuccess, onError])

  return { isCheckingRedirect }
}
