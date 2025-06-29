"use client"

import type React from "react"
import { useState } from "react"
import { User, Bot, Copy, Check, ChefHat, ExternalLink, Bookmark } from "lucide-react"
import type { Message } from "./types"

interface ChatMessageProps {
  message: Message
  index: number
  showNotification: (message: string, type: "success" | "error") => void
  onOpenEditor: (content: string) => void
  onSaveRecipe: () => void
}

const stripUserPreferences = (text: string): string => {
  return text.replace(/User Preferences:\s*- Dietary Restrictions:.*?- Preferred Meal Prep Time:.*?(\n|$)/s, "").trim()
}

export const renderTextWithLinks = (text: string): (string | React.JSX.Element)[] => {
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi
  urlRegex.lastIndex = 0

  const parts: (string | React.JSX.Element)[] = []
  let lastIndex = 0
  let match
  let linkId = 0

  while ((match = urlRegex.exec(text)) !== null) {
    const matchStart = match.index
    const matchEnd = urlRegex.lastIndex

    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart))
    }

    const rawUrl = match[0]
    const trailingPunctuationMatch = rawUrl.match(/[.,)\]]+$/)
    const cleanedUrl = trailingPunctuationMatch ? rawUrl.slice(0, -trailingPunctuationMatch[0].length) : rawUrl

    parts.push(
      <a
        key={`link-${linkId++}`}
        href={cleanedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {cleanedUrl}
        <ExternalLink size={12} className="flex-shrink-0" />
      </a>,
    )

    lastIndex = matchEnd
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length ? parts : [text]
}

const RecipeDisplay: React.FC<{
  content: string
  showNotification: (message: string, type: "success" | "error") => void
  onOpenEditor: (content: string) => void
  onSaveRecipe: () => void
}> = ({ content, onOpenEditor, onSaveRecipe }) => {
  const lines = content.split("\n")
  const firstSentence = lines[0]
  const recipeContent = lines.slice(1).join("\n").trim()

  const handleOpenEditor = () => {
    onOpenEditor(content)
  }

  return (
    <div className="space-y-3">
      <div className="leading-relaxed">{renderTextWithLinks(firstSentence)}</div>
      {recipeContent && (
        <div className="border border-slate-600/50 rounded-xl overflow-hidden bg-slate-700/30 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={handleOpenEditor}
              className="flex items-center gap-2 hover:bg-slate-600/20 transition-colors px-3 py-2 rounded-lg"
            >
              <ChefHat size={18} className="text-blue-400" />
              <span className="font-medium text-blue-400">Open Recipe Editor</span>
            </button>
            <button
              onClick={onSaveRecipe}
              className="flex items-center gap-2 hover:bg-blue-400/20 transition-colors px-3 py-2 rounded-lg"
              title="Save Recipe to Saved Recipes"
            >
              <Bookmark size={18} className="text-blue-400" />
              <span className="font-medium text-blue-400">Add Recipe</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, showNotification, onOpenEditor, onSaveRecipe }) => {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      showNotification("Message copied to clipboard", "success")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      showNotification("Failed to copy message", "error")
    }
  }

  const hasRecipeContent =
    !isUser &&
    (() => {
      const content = message.content.toLowerCase()
      const includesKeywords = /(###|##|#)?\s*ingredients/.test(content) && /(###|##|#)?\s*instructions/.test(content)

      const hasTimeMetadata =
        /servings/.test(content) || /prep time/.test(content) || /cook time/.test(content) || /total time/.test(content)

      const hasBulletPoints = /(^|\n)[-*\u2022]\s/.test(message.content)
      const hasNumberedSteps = /(^|\n)\d+\.\s/.test(message.content)
      const hasEnoughLines = message.content.split("\n").length > 8

      return includesKeywords && (hasTimeMetadata || hasBulletPoints || hasNumberedSteps) && hasEnoughLines
    })()

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-auto"
              : "bg-slate-800/50 backdrop-blur-sm text-gray-100 border border-slate-700/50"
          }`}
        >
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {hasRecipeContent ? (
              <RecipeDisplay
                content={message.content}
                showNotification={showNotification}
                onOpenEditor={onOpenEditor}
                onSaveRecipe={onSaveRecipe}
              />
            ) : (
              renderTextWithLinks(isUser ? stripUserPreferences(message.content) : message.content)
            )}
          </div>
        </div>

        <div
          className={`flex items-center gap-2 mt-2 text-xs text-gray-400 ${isUser ? "justify-end" : "justify-start"}`}
        >
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded hover:bg-slate-700/50"
            title="Copy message"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  )
}

export default ChatMessage
