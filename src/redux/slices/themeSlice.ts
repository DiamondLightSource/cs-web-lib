import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ThemeState {
  currentClass: string;
}

const initialState: ThemeState = {
  currentClass: "DEFAULT"
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setCurrentClass(state, action: PayloadAction<string>) {
      state.currentClass = action.payload;
    }
  },
  selectors: {
    selectCurrentClass: state => state.currentClass
  }
});

export const { setCurrentClass } = themeSlice.actions;
export const { selectCurrentClass } = themeSlice.selectors;

export default themeSlice.reducer;
