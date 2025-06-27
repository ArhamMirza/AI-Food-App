import React, { useEffect, useState } from "react"
import { auth, googleProvider } from "../firebase/firebase"
import { getRedirectResult, signInWithRedirect } from "firebase/auth"

const TestRedirect: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [status, setStatus] = useState("Checking redirect result...")

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth)
        console.log("[TEST] getRedirectResult() returned:", result)

        if (result?.user) {
          const token = await result.user.getIdToken()
          console.log("[TEST] Signed in user:", result.user.email)
          console.log("[TEST] ID token:", token)
          setUserEmail(result.user.email || "No email")
          setStatus("Sign-in successful!")
        } else {
          console.log("[TEST] No user returned from redirect.")
          setStatus("No user signed in yet.")
        }
      } catch (err) {
        console.error("[TEST] Redirect error:", err)
        setStatus("Error during sign-in. Check console.")
      }
    }

    checkRedirect()
  }, [])

  const handleSignIn = async () => {
    try {
      console.log("[TEST] Initiating redirect sign-in...")
      setStatus("Redirecting to Google...")
      await signInWithRedirect(auth, googleProvider)
    } catch (err) {
      console.error("[TEST] signInWithRedirect error:", err)
      setStatus("Error starting sign-in.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Test Firebase Google Redirect</h1>
      <p>Status: <span className="text-green-400">{status}</span></p>

      {userEmail ? (
        <p className="text-lg">✅ Signed in as: <strong>{userEmail}</strong></p>
      ) : (
        <button
          onClick={handleSignIn}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg text-white font-semibold transition"
        >
          Sign in with Google
        </button>
      )}
    </div>
  )
}

export default TestRedirect
