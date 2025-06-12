"use client"

import type React from "react"
import { useState } from "react"
import { MessageSquare, X, ChefHat, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import ConversationItem from "./ConversationItem"
import RecipeItem from "../recipe/RecipeItem"

interface Conversation {
  conversation_id: string
  title?: string
}

interface Recipe {
  recipe_id: string
  title: string
  content?: string
}

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
  onEditTitle: (id: string, title: string | undefined) => void
  onSaveTitle: (id: string, title: string) => void
  onCancelEdit: () => void
  onDeleteConversation: (id: string) => void
  onEditTitleChange: (title: string) => void
  onEditRecipeTitle: (recipeId: string, title: string) => void
  onSaveRecipeTitle: (recipeId: string, title: string) => void
  onCancelEditRecipe: () => void
  onDeleteRecipe: (recipeId: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  conversations,
  recipes,
  selectedConversation,
  selectedRecipe,
  error,
  editingTitle,
  editTitle,
  onClose,
  onToggleCollapse,
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
  const [view, setView] = useState<"chats" | "recipes">("chats")

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50 
        ${isCollapsed ? "w-16" : "w-80 lg:w-72 xl:w-80"}
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        transition-all duration-300 ease-in-out
        bg-gradient-to-b from-slate-800 to-slate-900 
        border-r border-slate-700/50 backdrop-blur-xl
        flex flex-col shadow-2xl
      `}
    >
      <style>
        {`
          .view-transition {
            transition: all 0.3s ease-in-out;
          }
          .view-enter-active {
            opacity: 1;
            transform: translateX(0);
          }
          .view-exit-active {
            opacity: 0;
            transform: translateX(20px);
            position: absolute;
          }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #10b981 0%, #059669 100%); border-radius: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #34d399 0%, #10b981 100%); }
          .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #10b981 transparent; }
        `}
      </style>

      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                {view === "chats" ? (
                  <MessageSquare size={18} className="text-white" />
                ) : (
                  <ChefHat size={18} className="text-white" />
                )}
              </div>
              <span className="text-white font-bold text-lg">{view === "chats" ? "Food AI" : "My Recipes"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block text-gray-400 hover:text-white transition-colors p-1"
                title="Collapse sidebar"
              >
                <ChevronLeft size={20} />
              </button>
              <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              onClick={onToggleCollapse}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="Expand sidebar"
            >
              <ChevronRight size={20} />
            </button>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setView("chats")}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                  ${view === "chats" ? "bg-green-600 text-white" : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"}
                `}
                title="Chats"
              >
                <MessageSquare size={16} />
              </button>
              <button
                onClick={() => setView("recipes")}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                  ${view === "recipes" ? "bg-green-600 text-white" : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"}
                `}
                title="Recipes"
              >
                <ChefHat size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Toggle Buttons */}
          <div className="p-4 flex gap-2">
            <button
              onClick={() => setView("chats")}
              className={`
                flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200
                ${view === "chats" ? "bg-green-600 text-white" : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"}
              `}
            >
              Chats
            </button>
            <button
              onClick={() => setView("recipes")}
              className={`
                flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200
                ${view === "recipes" ? "bg-green-600 text-white" : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"}
              `}
            >
              Recipes
            </button>
          </div>

          {/* New Chat Button - only show in chats view */}
          {view === "chats" && (
            <div className="px-4 pb-4">
              <button
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                title="Start new chat"
              >
                <Plus size={18} />
                New Chat
              </button>
            </div>
          )}

          {/* Content Area */}
          <nav className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar relative">
            <div className="view-transition view-enter-active">
              {view === "chats" ? (
                <>
                  {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700/50 rounded-lg text-red-200 text-sm">
                      {error}
                    </div>
                  )}
                  {conversations.length === 0 && !error && (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs mt-1">Start a new chat to begin</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <ConversationItem
                        key={conversation.conversation_id}
                        conversation={conversation}
                        isSelected={selectedConversation === conversation.conversation_id}
                        isEditing={editingTitle === conversation.conversation_id}
                        editTitle={editTitle}
                        onSelect={() => onSelectConversation(conversation.conversation_id)}
                        onEdit={() => onEditTitle(conversation.conversation_id, conversation.title)}
                        onSave={() => onSaveTitle(conversation.conversation_id, editTitle)}
                        onCancel={onCancelEdit}
                        onDelete={() => onDeleteConversation(conversation.conversation_id)}
                        onEditTitleChange={onEditTitleChange}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {recipes.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <ChefHat size={32} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No recipes yet</p>
                      <p className="text-xs mt-1">Save a recipe to see it here</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {recipes.map((recipe) => (
                      <RecipeItem
                        key={recipe.recipe_id}
                        recipe={recipe}
                        isSelected={selectedRecipe === recipe.recipe_id}
                        isEditing={editingTitle === recipe.recipe_id}
                        editTitle={editTitle}
                        onSelect={() => onSelectRecipe(recipe.recipe_id)}
                        onEdit={() => onEditRecipeTitle(recipe.recipe_id, recipe.title)}
                        onSave={() => onSaveRecipeTitle(recipe.recipe_id, editTitle)}
                        onCancel={onCancelEditRecipe}
                        onDelete={() => onDeleteRecipe(recipe.recipe_id)}
                        onEditTitleChange={onEditTitleChange}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Navigation Links */}
          <nav className="p-4 border-t border-slate-700/50 space-y-2">
            {["Dashboard", "Meal Plans"].map((item) => (
              <a
                key={item}
                href={`/${item.toLowerCase().replace(" ", "-")}`}
                className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                {item}
              </a>
            ))}
            <a
              href="/logout"
              className="block px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors mt-4"
            >
              Logout
            </a>
          </nav>
        </>
      )}

      {/* Collapsed Content */}
      {isCollapsed && (
        <nav className="flex-1 px-2 py-4 overflow-y-auto custom-scrollbar">
          {/* Collapsed New Chat Button */}
          {isCollapsed && view === "chats" && (
            <div className="px-2 pb-2">
              <button
                onClick={onNewChat}
                className="w-full h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
                title="Start new chat"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          )}
          <div className="space-y-2">
            {view === "chats"
              ? conversations.slice(0, 8).map((conversation) => (
                  <button
                    key={conversation.conversation_id}
                    onClick={() => onSelectConversation(conversation.conversation_id)}
                    className={`
                    w-full h-10 rounded-lg flex items-center justify-center transition-all duration-200
                    ${
                      selectedConversation === conversation.conversation_id
                        ? "bg-green-600 text-white"
                        : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"
                    }
                  `}
                    title={conversation.title || "Untitled Chat"}
                  >
                    <MessageSquare size={16} />
                  </button>
                ))
              : recipes.slice(0, 8).map((recipe) => (
                  <button
                    key={recipe.recipe_id}
                    onClick={() => onSelectRecipe(recipe.recipe_id)}
                    className={`
                    w-full h-10 rounded-lg flex items-center justify-center transition-all duration-200
                    ${
                      selectedRecipe === recipe.recipe_id
                        ? "bg-green-600 text-white"
                        : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"
                    }
                  `}
                    title={recipe.title}
                  >
                    <ChefHat size={16} />
                  </button>
                ))}
          </div>
        </nav>
      )}
    </aside>
  )
}

export default Sidebar
