import { createSlice} from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type{ Preferences } from '../types';

const initialState: Preferences = {
  diet: 'none',
  allergies: [],
  calorieLimit: 2000,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    updatePreferences: (state, action: PayloadAction<Partial<Preferences>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { updatePreferences } = preferencesSlice.actions;
export default preferencesSlice.reducer;