import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { browserLocalPersistence, setPersistence } from "firebase/auth"


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validate required config
const requiredConfig = ["apiKey", "authDomain", "projectId"]
const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig])

if (missingConfig.length > 0) {
  console.error("Missing Firebase configuration:", missingConfig)
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(", ")}`)
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

setPersistence(auth, browserLocalPersistence).catch((err) =>
  console.error("Auth persistence error:", err)
)
// Initialize Google Auth Provider with mobile-optimized settings
export const googleProvider = new GoogleAuthProvider()

// Add scopes
googleProvider.addScope("email")
googleProvider.addScope("profile")

// Set custom parameters - optimized for mobile
googleProvider.setCustomParameters({
  prompt: "select_account",
})

export default app
