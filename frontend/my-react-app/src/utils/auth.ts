let accessToken = localStorage.getItem("access_token") || ""

const refreshAccessToken = async () => {
  const res = await fetch("http://localhost:8000/api/v1/auth/refresh", {
    method: "POST",
    credentials: "include", // important!
  })

  if (!res.ok) throw new Error("Failed to refresh access token")

  const data = await res.json()
  accessToken = data.access_token
  localStorage.setItem("access_token", data.access_token)
}

export const authorizedFetch = async (url: string, options: any = {}, retry = true) => {
  // 🚨 Check if token exists before making request
  accessToken = localStorage.getItem("access_token") || ""
  if (!accessToken) {
    window.location.href = "/auth"
    return
  }

  const opts = {
    ...options,
    credentials: "include", // send cookies
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  }

  const res = await fetch(url, opts)

  // 🔁 Handle expired access token
  if (res.status === 401 && retry) {
    try {
      await refreshAccessToken()
      return await authorizedFetch(url, options, false)
    } catch (e) {
      window.location.href = "/auth"
    }
  }

  return res
}
