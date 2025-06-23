import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './slices/userSlice';
import preferencesReducer from './slices/preferencesSlice';
// import mealPlansReducer from './slices/mealPlansSlice';
// import savedRecipesReducer from './slices/savedRecipesSlice';
// import shoppingListsReducer from './slices/shoppingListsSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'], // Persist user state
};

const persistedUserReducer = persistReducer(persistConfig, userReducer);

export const store = configureStore({
  reducer: {
    user: persistedUserReducer,
    preferences: preferencesReducer,
    // mealPlans: mealPlansReducer,
    // savedRecipes: savedRecipesReducer,
    // shoppingLists: shoppingListsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;