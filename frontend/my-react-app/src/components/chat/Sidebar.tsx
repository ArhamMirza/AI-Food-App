"use client"

import type React from "react"
import { useState } from "react"
import { MessageSquare, ChefHat, Plus, Edit3, Check, X, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import type { Conversation, Recipe } from "./types"

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  conversations: Conversation[]
  recipes: Recipe[]
  selectedConversation: string | null
  selectedRecipe: string | null
  error: string | null
  editingTitle: string | null
  editTitle: string
  onClose: () => void
  onToggleCollapse: () => void
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onSelectRecipe: (id: string) => void
  onEditTitle: (id: string, title: string) => void
  onSaveTitle: (id: string, title: string) => void
  onCancelEdit: () => void
  onDeleteConversation: (id: string) => void
  onEditTitleChange: (title: string) => void
  onEditRecipeTitle: (id: string, title: string) => void
  onSaveRecipeTitle: (id: string, title: string) => void
  onCancelEditRecipe: () => void
  onDeleteRecipe: (id: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversations,
  recipes,
  selectedConversation,
  selectedRecipe,
  editingTitle,
  editTitle,
  onClose,
  onNewChat,
  onSelectConversation,
  onSelectRecipe,
  onEditTitle,
  onSaveTitle,
  onCancelEdit,
  onDeleteConversation,
  onEditTitleChange,
  onEditRecipeTitle,
  onSaveRecipeTitle,
  onCancelEditRecipe,
  onDeleteRecipe,
}) => {
  const [conversationsCollapsed, setConversationsCollapsed] = useState(false)
  const [recipesCollapsed, setRecipesCollapsed] = useState(false)

  return (
    <>
      <style>{`
        .sidebar-scrollable::-webkit-scrollbar {
          display: none;
        }
        .sidebar-scrollable {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:w-80 flex flex-col sidebar-scrollable`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Food AI</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 sidebar-scrollable">
          {/* Conversations Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setConversationsCollapsed(!conversationsCollapsed)}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {conversationsCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                <MessageSquare size={16} />
                Conversations ({conversations.length})
              </button>
              <button
                onClick={onNewChat}
                className="p-1 text-green-400 hover:bg-green-400/10 rounded transition-colors"
                title="New Chat"
              >
                <Plus size={16} />
              </button>
            </div>

            {!conversationsCollapsed && (
              <div className="space-y-2 max-h-64 overflow-y-auto sidebar-scrollable">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      selectedConversation === conv.conversation_id
                        ? "bg-green-500/20 border border-green-500/30"
                        : "bg-slate-700/30 hover:bg-slate-700/50"
                    }`}
                  >
                    {editingTitle === conv.conversation_id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => onEditTitleChange(e.target.value)}
                          className="flex-1 bg-slate-600 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onSaveTitle(conv.conversation_id, editTitle)
                            } else if (e.key === "Escape") {
                              onCancelEdit()
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => onSaveTitle(conv.conversation_id, editTitle)}
                          className="p-1 text-green-400 hover:bg-green-400/10 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button onClick={onCancelEdit} className="p-1 text-gray-400 hover:bg-slate-600 rounded">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div onClick={() => onSelectConversation(conv.conversation_id)}>
                          <h4 className="text-white text-sm font-medium truncate">{conv.title}</h4>
                          <p className="text-gray-400 text-xs mt-1">{new Date(conv.updated_at).toLocaleDateString()}</p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditTitle(conv.conversation_id, conv.title)
                            }}
                            className="p-1 text-gray-400 hover:text-white hover:bg-slate-600 rounded"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm("Delete this conversation?")) {
                                onDeleteConversation(conv.conversation_id)
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recipes Section */}
          <div>
            <button
              onClick={() => setRecipesCollapsed(!recipesCollapsed)}
              className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3 hover:text-white transition-colors"
            >
              {recipesCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              <ChefHat size={16} />
              Saved Recipes ({recipes.length})
            </button>

            {!recipesCollapsed && (
              <div className="space-y-2 max-h-64 overflow-y-auto sidebar-scrollable">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.recipe_id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      selectedRecipe === recipe.recipe_id
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : "bg-slate-700/30 hover:bg-slate-700/50"
                    }`}
                  >
                    {editingTitle === recipe.recipe_id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => onEditTitleChange(e.target.value)}
                          className="flex-1 bg-slate-600 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onSaveRecipeTitle(recipe.recipe_id, editTitle)
                            } else if (e.key === "Escape") {
                              onCancelEditRecipe()
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => onSaveRecipeTitle(recipe.recipe_id, editTitle)}
                          className="p-1 text-green-400 hover:bg-green-400/10 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button onClick={onCancelEditRecipe} className="p-1 text-gray-400 hover:bg-slate-600 rounded">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div onClick={() => onSelectRecipe(recipe.recipe_id)}>
                          <h4 className="text-white text-sm font-medium truncate">{recipe.title}</h4>
                          <p className="text-gray-400 text-xs mt-1">
                            {new Date(recipe.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditRecipeTitle(recipe.recipe_id, recipe.title)
                            }}
                            className="p-1 text-gray-400 hover:text-white hover:bg-slate-600 rounded"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm("Delete this recipe?")) {
                                onDeleteRecipe(recipe.recipe_id)
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
