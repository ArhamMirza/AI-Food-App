import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type{ SavedRecipe } from '../types';

interface SavedRecipesState {
  recipes: string[];
  recipeDetails: { [id: string]: SavedRecipe };
  loading: boolean;
  error: string | null;
}

const initialState: SavedRecipesState = {
  recipes: [],
  recipeDetails: {},
  loading: false,
  error: null,
};

export const fetchSavedRecipes = createAsyncThunk('savedRecipes/fetchSavedRecipes', async (recipeIds: string[], { rejectWithValue }) => {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/recipes?ids=${recipeIds.join(',')}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return rejectWithValue(errorData.detail || 'Failed to fetch recipes');
    }
    return await response.json();
  } catch (error) {
    return rejectWithValue('Network error. Please try again.');
  }
});

const savedRecipesSlice = createSlice({
  name: 'savedRecipes',
  initialState,
  reducers: {
    setSavedRecipes: (state, action: PayloadAction<string[]>) => {
      state.recipes = action.payload;
    },
    addSavedRecipe: (state, action: PayloadAction<string>) => {
      if (!state.recipes.includes(action.payload)) {
        state.recipes.push(action.payload);
      }
    },
    removeSavedRecipe: (state, action: PayloadAction<string>) => {
      state.recipes = state.recipes.filter(id => id !== action.payload);
      delete state.recipeDetails[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedRecipes.fulfilled, (state, action: PayloadAction<Recipe[]>) => {
        state.loading = false;
        action.payload.forEach(recipe => {
          state.recipeDetails[recipe.id] = recipe;
        });
      })
      .addCase(fetchSavedRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSavedRecipes, addSavedRecipe, removeSavedRecipe } = savedRecipesSlice.actions;
export default savedRecipesSlice.reducer;