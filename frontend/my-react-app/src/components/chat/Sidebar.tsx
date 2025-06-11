import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, X, ChefHat } from 'lucide-react';
import ConversationItem from './ConversationItem';
import RecipeItem from '../recipe/RecipeItem'; // Import the new RecipeItem

interface Conversation {
  conversation_id: string;
  title?: string;
}

interface Recipe {
  recipe_id: string;
  title: string;
}

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  selectedConversation: string | null;
  error: string | null;
  editingTitle: string | null;
  editTitle: string;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onEditTitle: (id: string, title: string | undefined) => void;
  onSaveTitle: (id: string, title: string) => void;
  onCancelEdit: () => void;
  onDeleteConversation: (id: string) => void;
  onEditTitleChange: (title: string) => void;
}

const USER_ID = '683ac8b1dcd4216109341d9f';
const BASE_URL = 'http://localhost:8000/api/v1';

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  conversations,
  selectedConversation,
  error,
  editingTitle,
  editTitle,
  onClose,
  onNewChat,
  onSelectConversation,
  onEditTitle,
  onSaveTitle,
  onCancelEdit,
  onDeleteConversation,
  onEditTitleChange,
}) => {
  const [view, setView] = useState<'chats' | 'recipes'>('chats');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [editingRecipeTitle, setEditingRecipeTitle] = useState<string | null>(null);
  const [editRecipeTitle, setEditRecipeTitle] = useState('');

  // Fetch recipes when switching to recipes view
  useEffect(() => {
    if (view === 'recipes') {
      const fetchRecipes = async () => {
        try {
          const res = await fetch(`${BASE_URL}/recipe/${USER_ID}`, {
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) throw new Error('Failed to load recipes');
          const json = await res.json();
          const data = json.data;
          setRecipes(Array.isArray(data) ? data : []);
          setRecipeError(null);

        } catch (err) {
          setRecipeError('Failed to load recipes');
        }
      };
      fetchRecipes();
    }
  }, [view]);

  // Handle recipe selection
  const handleSelectRecipe = (recipeId: string) => {
    setSelectedRecipe(recipeId);
    // Optionally, trigger an action to display recipe details in the main content area
  };

  // Handle recipe title editing
  const handleEditRecipeTitle = (recipeId: string, title: string) => {
    setEditingRecipeTitle(recipeId);
    setEditRecipeTitle(title);
  };

  const handleSaveRecipeTitle = async (recipeId: string, title: string) => {
    try {
      const res = await fetch(`${BASE_URL}/recipe/${recipeId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update recipe title');
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.recipe_id === recipeId ? { ...recipe, title: title.trim() } : recipe
        )
      );
      setEditingRecipeTitle(null);
      setEditRecipeTitle('');
    } catch (err) {
      setRecipeError('Failed to update recipe title');
    }
  };

  const handleCancelEditRecipe = () => {
    setEditingRecipeTitle(null);
    setEditRecipeTitle('');
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/recipe/${recipeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete recipe');
      setRecipes((prev) => prev.filter((recipe) => recipe.recipe_id !== recipeId));
      if (selectedRecipe === recipeId) {
        setSelectedRecipe(null);
      }
    } catch (err) {
      setRecipeError('Failed to delete recipe');
    }
  };

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 lg:w-72 xl:w-80
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-300 ease-in-out
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
        `}
      </style>

      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
            {view === 'chats' ? (
              <MessageSquare size={18} className="text-white" />
            ) : (
              <ChefHat size={18} className="text-white" />
            )}
          </div>
          <span className="text-white font-bold text-lg">{view === 'chats' ? 'Food AI' : 'My Recipes'}</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      {/* Toggle Buttons */}
      <div className="p-4 flex gap-2">
        <button
          onClick={() => setView('chats')}
          className={`
            flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200
            ${view === 'chats' ? 'bg-green-600 text-white' : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'}
          `}
        >
          Chats
        </button>
        <button
          onClick={() => setView('recipes')}
          className={`
            flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200
            ${view === 'recipes' ? 'bg-green-600 text-white' : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'}
          `}
        >
          Recipes
        </button>
      </div>

      {/* Content Area */}
      <nav className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar relative">
        <div className="view-transition view-enter-active">
          {view === 'chats' ? (
            <>
              {/* New Chat Button */}
              <div className="p-4">
                <button
                  onClick={onNewChat}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <Plus size={18} />
                  New Chat
                </button>
              </div>

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
              {recipeError && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700/50 rounded-lg text-red-200 text-sm">
                  {recipeError}
                </div>
              )}
              {recipes.length === 0 && !recipeError && (
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
                    isEditing={editingRecipeTitle === recipe.recipe_id}
                    editTitle={editRecipeTitle}
                    onSelect={() => handleSelectRecipe(recipe.recipe_id)}
                    onEdit={() => handleEditRecipeTitle(recipe.recipe_id, recipe.title)}
                    onSave={() => handleSaveRecipeTitle(recipe.recipe_id, editRecipeTitle)}
                    onCancel={handleCancelEditRecipe}
                    onDelete={() => handleDeleteRecipe(recipe.recipe_id)}
                    onEditTitleChange={setEditRecipeTitle}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Navigation Links */}
      <nav className="p-4 border-t border-slate-700/50 space-y-2">
        {['Dashboard', 'Meal Plans'].map((item) => (
          <a
            key={item}
            href={`/${item.toLowerCase().replace(' ', '-')}`}
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
    </aside>
  );
};

export default Sidebar;