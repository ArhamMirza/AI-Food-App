import { useState, useEffect } from 'react';
import useNotifications from '../components/chat/useNotifications';

// Define interfaces for type safety
interface Recipe {
  recipe_id: string;
  user_id: string;
  content: string;
  title: string;
}

interface ApiResponse<T> {
  data: T;
}

interface NotificationHook {
  showNotification: (message: string, type: 'success' | 'error' ) => void;
}

const USER_ID = '683ac8b1dcd4216109341d9f';
const RECIPE_URL = 'http://localhost:8000/api/v1/recipe';

const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { showNotification }: NotificationHook = useNotifications();

  const recipeApiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    const response = await fetch(`${RECIPE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) throw new Error(`Recipe API call failed: ${response.status}`);
    return response.json();
  };

  const fetchUserRecipes = async (): Promise<void> => {
    try {
      setError(null);
      const response = await recipeApiCall<Recipe[]>(`/user/${USER_ID}`);
      setRecipes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to load recipes');
      showNotification('Failed to load recipes', 'error');
    }
  };

  const loadRecipeContent = async (recipeId: string): Promise<string | null> => {
    try {
      setError(null);
      setLoading(true);
      const response = await recipeApiCall<{ content: { text: string }, title: string }>(`/${recipeId}`);
      setSelectedRecipe(recipeId);
      return response.data.content.text || response.data.title;
    } catch (err) {
      setError('Failed to load recipe');
      showNotification('Failed to load recipe', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async (content: string, title: string): Promise<Recipe | null> => {
    if (!content || !title.trim()) return null;

    setLoading(true);
    try {
      const data = await recipeApiCall<Recipe>('', {
        method: 'POST',
        body: JSON.stringify({
          user_id: USER_ID,
          content,
          title: title.trim(),
        }),
      });

      setRecipes(prev => [...prev, data.data]);
      showNotification('Recipe saved successfully!', 'success');
      return data.data;
    } catch (error) {
      showNotification('Failed to save recipe', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateRecipe = async (recipeId: string, content: string): Promise<void> => {
    try {
      await recipeApiCall(`/${recipeId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
      
      setRecipes(prev =>
        prev.map(recipe =>
          recipe.recipe_id === recipeId ? { ...recipe, content } : recipe
        )
      );
      showNotification('Recipe updated successfully!', 'success');
    } catch (error) {
      showNotification('Recipe updated locally (server sync failed)', 'error');
    }
  };

  const updateRecipeTitle = async (recipeId: string, title: string): Promise<void> => {
    try {
      await recipeApiCall(`/${recipeId}/title`, {
        method: 'PUT',
        body: JSON.stringify({ title: title.trim() }),
      });

      setRecipes(prev =>
        prev.map(recipe =>
          recipe.recipe_id === recipeId ? { ...recipe, title: title.trim() } : recipe
        )
      );
      showNotification('Recipe title updated successfully', 'success');
    } catch (error) {
      showNotification('Failed to update recipe title', 'error');
    }
  };

  const deleteRecipe = async (recipeId: string): Promise<void> => {
    try {
      await recipeApiCall(`/${recipeId}`, { method: 'DELETE' });
      setRecipes(prev => prev.filter(r => r.recipe_id !== recipeId));
      if (selectedRecipe === recipeId) {
        setSelectedRecipe(null);
      }
      showNotification('Recipe deleted successfully', 'success');
    } catch (error) {
      showNotification('Failed to delete recipe', 'error');
    }
  };

  useEffect(() => {
    fetchUserRecipes();
  }, []);

  return {
    recipes,
    selectedRecipe,
    loading,
    error,
    loadRecipeContent,
    saveRecipe,
    updateRecipe,
    updateRecipeTitle,
    deleteRecipe,
    setSelectedRecipe,
  };
};

export default useRecipes;