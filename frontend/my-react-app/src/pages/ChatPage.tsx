"use client"

import { useState, useEffect, useRef } from "react"
import {
  SendHorizontal,
  Loader2,
  Menu,
  X,
  Edit3,
  Check,
  MessageSquare,
  Smartphone,
  ChefHat,
  Copy,
  Save,
  Globe,
  Youtube,
  Trash2,
  Plus,
} from "lucide-react"

import Sidebar from "../components/chat/Sidebar"
import ChatMessage from "../components/chat/ChatMessage"
import NewChatModal from "../components/chat/NewChatModal"
import SaveRecipeModal from "../components/chat/SaveRecipeModal"
import Notification from "../components/chat/Notification"
import useNotifications from "../components/chat/useNotifications"
import type { Message, Conversation, Recipe } from "../components/chat/types"
import React from "react"
import { useAppSelector } from "../redux/hooks"
import { authorizedFetch } from "../utils/auth"

const BASE_URL = import.meta.env.VITE_API_URL

const BASE_CHAT_URL = `${BASE_URL}/chatbot/chat`
const RECIPE_URL = `${BASE_URL}/recipe`

const extractRecipeContent = (content: string) => {
  // Define regex to detect the beginning of structured recipe sections
  const sectionMarkerRegex = /(^|\n)(\s*(###|[\*\-]|\d+\.)\s+|\s*\w+\s*:\s*)/i;

  const match = sectionMarkerRegex.exec(content);
  
  if (match && match.index > 0) {
    // Return content *after* the first section marker
    return content.slice(match.index).trim();
  }

  // If no marker is found, fall back to default
  return content.trim();
};


const reconstructFullContent = (originalContent: string, editedRecipe: string) => {
  const sentences = originalContent.split(/(?<=[.!?])\s+/)
  return sentences.length <= 1 ? editedRecipe : `${sentences[0]} ${editedRecipe}`.trim()
}

const ChatPage = () => {
  // State management
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const user:any = useAppSelector((state) => state.user.user)
  const preferences = useAppSelector((state) => state.user.user?.preferences)


  const USER_ID = user.id

  // Modal states
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState("")
  const [showSaveRecipeModal, setShowSaveRecipeModal] = useState(false)
  const [recipeTitle, setRecipeTitle] = useState("")
  const [recipeContentToSave, setRecipeContentToSave] = useState<string | null>(null)

  // Edit states
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  // Search states
  const [search, setSearch] = useState(false)
  const [searchType, setSearchType] = useState("")

  // Editor states
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorContent, setEditorContent] = useState("")
  const [originalContent, setOriginalContent] = useState("")
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Recipe display states
  const [isEditingRecipe, setIsEditingRecipe] = useState(false)
  const [recipeContent, setRecipeContent] = useState("")
  const [recipeDisplayTitle, setRecipeDisplayTitle] = useState("")
  const [isEditingRecipeTitle, setIsEditingRecipeTitle] = useState(false)

  const { notifications, showNotification, removeNotification } = useNotifications()
  const chatRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // API functions - Chat API
  // utils/apiCall.ts

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await authorizedFetch(`${BASE_CHAT_URL}${endpoint}`, options)
  if (!response.ok) throw new Error(`API call failed: ${response.status}`)
  return response.json()
}

 const recipeApiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await authorizedFetch(`${RECIPE_URL}${endpoint}`, options)
  if (!response.ok) throw new Error(`Recipe API call failed: ${response.status}`)
  return response.json()
}



  const fetchUserConversations = async () => {
    try {
      setError(null)
      const data = await apiCall(`/user/${USER_ID}`)
      setConversations(Array.isArray(data) ? data : [])
      // Removed auto-selection of first conversation
    } catch (err) {
      setError("Failed to load conversations")
      showNotification("Failed to load conversations", "error")
    }
  }

  const fetchUserRecipes = async () => {
    try {
      setError(null)
      const response = await recipeApiCall(`/user/${USER_ID}`)
      setRecipes(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError("Failed to load recipes")
      showNotification("Failed to load recipes", "error")
    }
  }

  const loadConversationMessages = async (conversationId: string) => {
    try {
      setError(null)
      setLoading(true)
      setSelectedRecipe(null)
      setIsEditingRecipe(false)
      const data = await apiCall(`/${conversationId}`)
      setMessages(Array.isArray(data.messages) ? data.messages : [])
      setSelectedConversation(conversationId)
      setSidebarOpen(false)
    } catch (err) {
      setError("Failed to load messages")
      showNotification("Failed to load messages", "error")
    } finally {
      setLoading(false)
    }
  }

  const loadRecipeContent = async (recipeId: string) => {
    try {
      setError(null)
      setLoading(true)
      setSelectedConversation(null)
      setMessages([])
      const response = await recipeApiCall(`/${recipeId}`)
      const recipe = response.data
      setRecipeContent(recipe.content.text || recipe.title)
      setRecipeDisplayTitle(recipe.title)
      setSelectedRecipe(recipeId)
      setIsEditingRecipe(false)
      setSidebarOpen(false)
    } catch (err) {
      setError("Failed to load recipe")
      showNotification("Failed to load recipe", "error")
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !selectedConversation) return

    const preferencesText = `
      User Preferences:
      - Dietary Restrictions: ${preferences?.dietary_restrictions?.join(", ") || "None"}
      - Allergies: ${preferences?.allergies?.join(", ") || "None"}
      - Favorite Cuisines: ${preferences?.favorite_cuisines?.join(", ") || "None"}
      - Disliked Ingredients: ${preferences?.disliked_ingredients?.join(", ") || "None"}
      - Cooking Skill Level: ${preferences?.cooking_skill_level || "Unknown"}
      - Preferred Meal Prep Time: ${preferences?.preferred_meal_prep_time ? preferences.preferred_meal_prep_time + " minutes" : "Any"}
      `.trim()

    const fullMessage = `${input.trim()}\n\n${preferencesText}`
    console.log(fullMessage)

    const userMessage = { role: "user", content: fullMessage }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const params = new URLSearchParams({
        user_id: USER_ID,
        conversation_id: selectedConversation,
        search: search.toString(),
        search_type: searchType,
      })

      const data = await apiCall(`?${params}`, {
        method: "POST",
        body: JSON.stringify({ message: fullMessage }),
      })

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])

      if (data.conversation_id !== selectedConversation) {
        setSelectedConversation(data.conversation_id)
        fetchUserConversations()
      }
    } catch (error) {
      setError("Failed to send message")
      showNotification("Failed to send message", "error")
      setMessages((prev) => prev.filter((msg) => msg !== userMessage))
    } finally {
      setLoading(false)
    }
  }


  const deleteConversation = async (conversationId: string) => {
    try {
      await apiCall(`/${conversationId}`, { method: "DELETE" })
      setConversations((prev) => prev.filter((c) => c.conversation_id !== conversationId))
      if (selectedConversation === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }
      showNotification("Conversation deleted successfully", "success")
    } catch (error) {
      showNotification("Failed to delete conversation", "error")
    }
  }

  const deleteRecipe = async (recipeId: string) => {
    try {
      await recipeApiCall(`/${recipeId}`, { method: "DELETE" })
      setRecipes((prev) => prev.filter((r) => r.recipe_id !== recipeId))
      if (selectedRecipe === recipeId) {
        setSelectedRecipe(null)
        setRecipeContent("")
        setRecipeDisplayTitle("")
        setIsEditingRecipe(false)
      }
      showNotification("Recipe deleted successfully", "success")
    } catch (error) {
      showNotification("Failed to delete recipe", "error")
    }
  }

  const startNewChat = async () => {
    if (!newChatTitle.trim()) return

    setLoading(true)
    setShowNewChatModal(false)

    try {
      const data = await apiCall(`/create?user_id=${USER_ID}`, {
        method: "POST",
        body: JSON.stringify({ title: newChatTitle.trim() }),
      })

      setMessages([])
      setSelectedConversation(data.conversation_id)
      setSelectedRecipe(null)
      setIsEditingRecipe(false)
      setNewChatTitle("")
      await fetchUserConversations()
      showNotification("New chat created successfully", "success")
    } catch (error) {
      showNotification("Failed to start new chat", "error")
    } finally {
      setLoading(false)
    }
  }

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      await apiCall(`/${conversationId}/title`, {
        method: "PUT",
        body: JSON.stringify({ title: title.trim() }),
      })

      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? { ...conv, title: title.trim() } : conv)),
      )
      setEditingTitle(null)
      setEditTitle("")
      showNotification("Title updated successfully", "success")
    } catch (error) {
      showNotification("Failed to update title", "error")
    }
  }

  const updateRecipeTitle = async (recipeId: string, title: string) => {
    try {
      await recipeApiCall(`/${recipeId}/title`, {
        method: "PUT",
        body: JSON.stringify({ title: title.trim() }),
      })

      setRecipes((prev) =>
        prev.map((recipe) => (recipe.recipe_id === recipeId ? { ...recipe, title: title.trim() } : recipe)),
      )
      setRecipeDisplayTitle(title.trim())
      setEditingTitle(null)
      setEditTitle("")
      setIsEditingRecipeTitle(false)
      showNotification("Recipe title updated successfully", "success")
    } catch (error) {
      showNotification("Failed to update recipe title", "error")
    }
  }

  const updateRecipeContent = async () => {
    if (!selectedRecipe) return

    try {
      setLoading(true)
      await recipeApiCall(`/${selectedRecipe}`, {
        method: "PUT",
        body: JSON.stringify({ content: recipeContent }),
      })

      setRecipes((prev) =>
        prev.map((recipe) => (recipe.recipe_id === selectedRecipe ? { ...recipe, content: recipeContent } : recipe)),
      )
      setIsEditingRecipe(false)
      showNotification("Recipe updated successfully", "success")
    } catch (error) {
      showNotification("Failed to update recipe", "error")
    } finally {
      setLoading(false)
    }
  }

  // Recipe handling
  const handleSaveRecipe = (content: string) => {
    if (!window.confirm("Add this recipe to your saved recipes?")) return
    setRecipeContentToSave(content)
    setRecipeTitle(content.substring(0, 50) + (content.length > 50 ? "..." : ""))
    setShowSaveRecipeModal(true)
  }

  const handleConfirmSaveRecipe = async (title: string) => {
    if (!recipeContentToSave || !title.trim()) return

    setLoading(true)
    try {
      const data = await apiCall("/save-recipe", {
        method: "POST",
        body: JSON.stringify({
          user_id: USER_ID,
          content: recipeContentToSave,
          title: title.trim(),
        }),
      })

      setRecipes((prev) => [...prev, data])
      showNotification("Recipe saved successfully!", "success")
      setShowSaveRecipeModal(false)
      setRecipeTitle("")
      setRecipeContentToSave(null)
    } catch (error) {
      showNotification("Failed to save recipe", "error")
    } finally {
      setLoading(false)
    }
  }

  // Editor functions
  const handleOpenEditor = (content: string, messageIndex?: number) => {
    setOriginalContent(content)
    setEditorContent(extractRecipeContent(content))
    setEditingMessageIndex(messageIndex ?? null)
    setEditorOpen(true)
    setHasUnsavedChanges(false)
  }

  const handleCloseEditor = () => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Close anyway?")) return
    setEditorOpen(false)
    setEditorContent("")
    setOriginalContent("")
    setEditingMessageIndex(null)
    setHasUnsavedChanges(false)
  }

  const handleCopyContent = () => {
    const contentToCopy = selectedRecipe ? recipeContent : editorContent
    navigator.clipboard.writeText(contentToCopy)
    showNotification("Recipe copied to clipboard!", "success")
  }

  const handleSaveContent = async () => {
    try {
      if (editingMessageIndex !== null && selectedConversation) {
        const updatedFullContent = reconstructFullContent(originalContent, editorContent)

        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[editingMessageIndex] = {
            ...newMessages[editingMessageIndex],
            content: updatedFullContent,
          }
          return newMessages
        })

        try {
          await apiCall(`/${selectedConversation}/message/${editingMessageIndex}`, {
            method: "PUT",
            body: JSON.stringify({
              content: updatedFullContent,
              role: messages[editingMessageIndex]?.role || "assistant",
            }),
          })
          showNotification("Recipe updated successfully!", "success")
        } catch (serverError) {
          showNotification("Recipe updated locally (server sync failed)", "warning")
        }

        setHasUnsavedChanges(false)
        setOriginalContent(updatedFullContent)
      } else {
        localStorage.setItem("saved-recipe", editorContent)
        showNotification("Recipe saved locally!", "success")
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      showNotification("Failed to save recipe", "error")
    }
  }

  // Search toggles
  const toggleSearch = (type: string) => {
    if (search && searchType === type) {
      setSearch(false)
      setSearchType("")
    } else {
      setSearch(true)
      setSearchType(type)
    }
  }

  // Effects
  useEffect(() => {
    fetchUserConversations()
    fetchUserRecipes()
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const currentConversation = conversations.find((c) => c.conversation_id === selectedConversation)
  const currentRecipe = recipes.find((r) => r.recipe_id === selectedRecipe)

  // Recipe Display Component
  const RecipeDisplay = () => (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Recipe Header */}
      <div className="p-4 md:p-6 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            {isEditingRecipeTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={recipeDisplayTitle}
                  onChange={(e) => setRecipeDisplayTitle(e.target.value)}
                  className="text-xl md:text-2xl font-bold bg-slate-700/50 text-white px-3 py-2 rounded-lg border border-slate-600/50 focus:outline-none focus:border-green-500/50 w-full sm:w-auto"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateRecipeTitle(selectedRecipe!, recipeDisplayTitle)
                    } else if (e.key === "Escape") {
                      setIsEditingRecipeTitle(false)
                      setRecipeDisplayTitle(currentRecipe?.title || "")
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => updateRecipeTitle(selectedRecipe!, recipeDisplayTitle)}
                  className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingRecipeTitle(false)
                    setRecipeDisplayTitle(currentRecipe?.title || "")
                  }}
                  className="p-2 text-gray-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <ChefHat size={24} className="text-green-400 flex-shrink-0" />
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">{recipeDisplayTitle}</h1>
                <button
                  onClick={() => setIsEditingRecipeTitle(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyContent}
              className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
              title="Copy recipe"
            >
              <Copy size={18} />
            </button>
            {isEditingRecipe ? (
              <button
                onClick={updateRecipeContent}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Save"}
              </button>
            ) : (
              <button
                onClick={() => setIsEditingRecipe(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit3 size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this recipe?")) {
                  deleteRecipe(selectedRecipe!)
                }
              }}
              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Delete recipe"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="flex-1 p-4 md:p-6 overflow-hidden">
        {isEditingRecipe ? (
          <div className="h-full flex flex-col">
            <textarea
              value={recipeContent}
              onChange={(e) => setRecipeContent(e.target.value)}
              className="w-full h-full min-h-[300px] bg-slate-900/50 text-gray-100 border border-slate-600/50 rounded-lg p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none custom-scrollbar"
              placeholder="Enter your recipe content here..."
            />
          </div>
        ) : (
          <div className="bg-slate-900/30 rounded-lg p-4 md:p-6 h-full overflow-y-auto custom-scrollbar">
            <div className="prose prose-invert prose-headings:text-green-400 prose-strong:text-emerald-300 prose-em:text-blue-300 max-w-none">
              {recipeContent.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4 text-gray-100 leading-relaxed">
                  {paragraph.split("\n").map((line, j) => (
                    <React.Fragment key={j}>
                      {line}
                      {j < paragraph.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #10b981 0%, #059669 100%); border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #34d399 0%, #10b981 100%); }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #10b981 transparent; }
        
        @media (max-width: 768px) {
          .editor-open-mobile {
            flex-direction: column;
          }
          .editor-open-mobile > div:first-child,
          .editor-open-mobile > div:last-child {
            width: 100%;
            height: 50%;
          }
        }
      `}</style>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        conversations={conversations}
        recipes={recipes}
        selectedConversation={selectedConversation}
        selectedRecipe={selectedRecipe}
        error={error}
        editingTitle={editingTitle}
        editTitle={editTitle}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewChat={() => setShowNewChatModal(true)}
        onSelectConversation={loadConversationMessages}
        onSelectRecipe={loadRecipeContent}
        onEditTitle={(id, title) => {
          setEditingTitle(id)
          setEditTitle(title || "")
        }}
        onSaveTitle={updateConversationTitle}
        onCancelEdit={() => {
          setEditingTitle(null)
          setEditTitle("")
        }}
        onDeleteConversation={deleteConversation}
        onEditTitleChange={setEditTitle}
        onEditRecipeTitle={(id, title) => {
          setEditingTitle(id)
          setEditTitle(title)
        }}
        onSaveRecipeTitle={updateRecipeTitle}
        onCancelEditRecipe={() => {
          setEditingTitle(null)
          setEditTitle("")
        }}
        onDeleteRecipe={deleteRecipe}
      />

      <div className={`flex flex-1 min-w-0 max-h-screen overflow-hidden ${editorOpen ? "editor-open-mobile" : ""}`}>
        <div
          className={`transition-all duration-300 ${editorOpen ? "w-1/2" : "w-full"} flex flex-col max-h-screen overflow-hidden`}
        >
          {/* Header */}
          <header className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors p-2 -ml-2 bg-slate-800/50 rounded-lg"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-semibold">
                  {selectedRecipe ? "Recipe Mode" : "Chat with Food AI"}
                </h1>
                {(selectedConversation || selectedRecipe) && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-none">
                    {selectedConversation
                      ? currentConversation?.title || "Untitled Chat"
                      : currentRecipe?.title || "Untitled Recipe"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!selectedRecipe && (
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                  title="New Chat"
                >
                  <Plus size={20} />
                </button>
              )}
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                <Smartphone size={14} />
                <span>Mobile Optimized</span>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          {selectedRecipe ? (
            <RecipeDisplay />
          ) : (
            <>
              {/* Chat Area */}
              <div
                ref={chatRef}
                className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-gradient-to-b from-transparent to-slate-900/20 custom-scrollbar"
              >
                {!selectedConversation ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={28} className="text-white" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">Welcome to Food AI</h2>
                      <p className="text-gray-400 mb-6">Select a conversation or recipe to begin!</p>
                      <button
                        onClick={() => setShowNewChatModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      >
                        Start New Chat
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.slice(1).map((msg, idx) => (
                      <ChatMessage
                        key={idx + 1}
                        message={msg}
                        index={idx + 1}
                        showNotification={showNotification}
                        onOpenEditor={(content) => handleOpenEditor(content, idx + 1)}
                        onSaveRecipe={() => handleSaveRecipe(msg.content)}
                      />
                    ))}

                    {loading && (
                      <div className="flex items-center gap-3 text-gray-400 px-4">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                          <Loader2 className="animate-spin" size={14} />
                        </div>
                        <span className="text-sm">Food AI is thinking...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input Area */}
              <footer className="p-4 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      className="w-full resize-none rounded-2xl bg-slate-800/80 text-white px-4 py-3 pr-20 border border-slate-700/50 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 backdrop-blur-sm transition-all duration-200 text-sm placeholder-gray-400"
                      placeholder={
                        selectedConversation
                          ? "Ask about recipes, meal planning, or cooking tips..."
                          : "Select a chat to start messaging"
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      disabled={!selectedConversation || loading}
                      style={{ minHeight: "48px", maxHeight: "120px" }}
                    />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button
                        onClick={() => toggleSearch("web")}
                        className={`p-2 rounded-lg transition-colors ${
                          search && searchType === "web"
                            ? "bg-green-600 text-white"
                            : "bg-slate-700/50 text-gray-400 hover:bg-slate-600/50"
                        }`}
                        title="Search Web"
                        disabled={!selectedConversation || loading}
                      >
                        <Globe size={16} />
                      </button>
                      <button
                        onClick={() => toggleSearch("youtube")}
                        className={`p-2 rounded-lg transition-colors ${
                          search && searchType === "youtube"
                            ? "bg-green-600 text-white"
                            : "bg-slate-700/50 text-gray-400 hover:bg-slate-600/50"
                        }`}
                        title="Search YouTube"
                        disabled={!selectedConversation || loading}
                      >
                        <Youtube size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading || !selectedConversation}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.05] disabled:transform-none"
                  >
                    <SendHorizontal size={18} className="text-white" />
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>

        {/* Editor Panel */}
        {editorOpen && (
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
                  onClick={handleCopyContent}
                  className="p-1.5 sm:p-2 text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Copy recipe"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={handleSaveContent}
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
                  onClick={handleCloseEditor}
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
                value={editorContent}
                onChange={(e) => {
                  setEditorContent(e.target.value)
                  setHasUnsavedChanges(true)
                }}
                className="w-full h-full bg-slate-900/50 text-gray-100 border border-slate-600/50 rounded-lg p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none custom-scrollbar"
                placeholder="Recipe content will appear here..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={showNewChatModal}
        title={newChatTitle}
        loading={loading}
        onClose={() => {
          setShowNewChatModal(false)
          setNewChatTitle("")
        }}
        onTitleChange={setNewChatTitle}
        onCreate={startNewChat}
      />

      <SaveRecipeModal
        isOpen={showSaveRecipeModal}
        title={recipeTitle}
        loading={loading}
        onClose={() => {
          setShowSaveRecipeModal(false)
          setRecipeTitle("")
          setRecipeContentToSave(null)
        }}
        onTitleChange={setRecipeTitle}
        onSave={handleConfirmSaveRecipe}
      />

      {/* Notifications */}
      {notifications.map(({ id, message, type }) => (
        <Notification key={id} message={message} type={type} onClose={() => removeNotification(id)} />
      ))}
    </div>
  )
}

export default ChatPage
