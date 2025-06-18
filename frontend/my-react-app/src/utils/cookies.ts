// Cookie utility functions for secure token management
export const CookieUtils = {
  // Set a secure cookie (this will be called from the backend)
  setSecureCookie: (name: string, value: string, days = 7) => {
    // This is just for reference - actual secure cookies should be set by the backend
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
  },

  // Get cookie value
  getCookie: (name: string): string | null => {
    const nameEQ = name + "="
    const ca = document.cookie.split(";")
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === " ") c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  },

  // Delete cookie
  deleteCookie: (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`
  },

  // Clear all auth cookies
  clearAuthCookies: () => {
    CookieUtils.deleteCookie("refresh_token")
    // Also clear access token from localStorage for now
    localStorage.removeItem("access_token")
  },
}
