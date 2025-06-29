"use client"

import type React from "react"
import { X, Loader2 } from "lucide-react"

interface SaveRecipeModalProps {
  isOpen: boolean
  title: string
  loading: boolean
  onClose: () => void
  onTitleChange: (title: string) => void
  onSave: (title: string) => void
}

const SaveRecipeModal: React.FC<SaveRecipeModalProps> = ({
  isOpen,
  title,
  loading,
  onClose,
  onTitleChange,
  onSave,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Save Recipe</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Recipe Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full bg-slate-700/50 text-white px-4 py-3 rounded-lg border border-slate-600/50 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20"
              placeholder="Enter recipe title..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  onSave(title)
                }
              }}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(title)}
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                "Save Recipe"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SaveRecipeModal
