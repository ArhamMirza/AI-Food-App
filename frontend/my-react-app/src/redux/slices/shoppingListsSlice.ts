// import { createSlice } from '@reduxjs/toolkit';
// import type { PayloadAction } from '@reduxjs/toolkit';
// import type { ShoppingList } from '../types';

// interface ShoppingListsState {
//   lists: ShoppingList[];
// }

// const initialState: ShoppingListsState = {
//   lists: [],
// };

// const shoppingListsSlice = createSlice({
//   name: 'shoppingLists',
//   initialState,
//   reducers: {
//     addShoppingList: (state, action: PayloadAction<ShoppingList>) => {
//       state.lists.push(action.payload);
//     },
//     updateShoppingList: (state, action: PayloadAction<ShoppingList>) => {
//       const index = state.lists.findIndex(list => list.id === action.payload.id);
//       if (index !== -1) {
//         state.lists[index] = action.payload;
//       }
//     },
//     removeShoppingList: (state, action: PayloadAction<string>) => {
//       state.lists = state.lists.filter(list => list.id !== action.payload);
//     },
//   },
// });

// export const { addShoppingList, updateShoppingList, removeShoppingList } = shoppingListsSlice.actions;
// export default shoppingListsSlice.reducer;