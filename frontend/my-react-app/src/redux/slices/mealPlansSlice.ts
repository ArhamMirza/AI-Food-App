import { createSlice} from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MealPlan } from '../types';

interface MealPlansState {
  plans: { [date: string]: MealPlan };
}

const initialState: MealPlansState = {
  plans: {},
};

const mealPlansSlice = createSlice({
  name: 'mealPlans',
  initialState,
  reducers: {
    addMealPlan: (state, action: PayloadAction<MealPlan>) => {
      state.plans[action.payload.date] = action.payload;
    },
    removeMealPlan: (state, action: PayloadAction<string>) => {
      delete state.plans[action.payload];
    },
  },
});

export const { addMealPlan, removeMealPlan } = mealPlansSlice.actions;
export default mealPlansSlice.reducer;