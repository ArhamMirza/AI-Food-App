"use client"

import { useState, useCallback } from "react"
import type { NotificationItem } from "./types"

const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const showNotification = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification: NotificationItem = { id, message, type }

    setNotifications((prev) => [...prev, notification])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return {
    notifications,
    showNotification,
    removeNotification,
  }
}

export default useNotifications
