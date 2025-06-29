"use client"

import type React from "react"
import { useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

interface NotificationProps {
  message: string
  type: "success" | "error" | "info"
  onClose: () => void
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} className="text-green-400" />
      case "error":
        return <AlertCircle size={20} className="text-red-400" />
      default:
        return <Info size={20} className="text-blue-400" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-900/90 border-green-500/50 text-green-100"
      case "error":
        return "bg-red-900/90 border-red-500/50 text-red-100"
      default:
        return "bg-blue-900/90 border-blue-500/50 text-blue-100"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg max-w-sm ${getStyles()}`}
      >
        {getIcon()}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default Notification
