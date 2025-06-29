"use client"

import { ChefHat, Copy, Save, X } from "lucide-react"

interface RecipeEditorProps {
  isOpen: boolean
  content: string
  hasUnsavedChanges: boolean
  editingMessageIndex: number | null
  onContentChange: (content: string) => void
  onCopy: () => void
  onSave: () => void
  onClose: () => void
}

export default function RecipeEditor({
  isOpen,
  content,
  hasUnsavedChanges,
  editingMessageIndex,
  onContentChange,
  onCopy,
  onSave,
  onClose,
}: RecipeEditorProps) {
  if (!isOpen) return null

  return (
    <div className="w-1/2 border-l border-slate-600/50 bg-slate-800/50 backdrop-blur-sm flex flex-col max-h-screen overflow-hidden">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-600/50">
        <h3 className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
          <ChefHat size={18} className="text-blue-400" />
          <span className="truncate">Recipe Editor</span>
          {hasUnsavedChanges && (
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Unsaved</span>
          )}
        </h3>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onCopy}
            className="p-1.5 sm:p-2 text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Copy recipe"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onSave}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              hasUnsavedChanges
                ? "text-green-400 hover:bg-green-400/10 bg-green-400/5"
                : "text-green-400 hover:bg-slate-700/50"
            }`}
            title={editingMessageIndex !== null ? "Save to database" : "Save locally"}
          >
            <Save size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {editingMessageIndex !== null && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-slate-600/50">
          <p className="text-sm text-blue-400">
            Editing message #{editingMessageIndex + 1} • Changes will be saved to database and chat
          </p>
        </div>
      )}

      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full h-full bg-slate-900/50 text-gray-100 border border-slate-600/50 rounded-lg p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none custom-scrollbar"
          placeholder="Recipe content will appear here..."
        />
      </div>
    </div>
  )
}
