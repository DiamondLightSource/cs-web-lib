import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface StyleStack {
  classes: { [className: string]: any };
  currentClass: string;
}

export const initialStyleState: StyleStack = {
  classes: {},
  currentClass: "DEFAULT"
};

const styleSlice = createSlice({
  name: "style",
  initialState: initialStyleState,
  reducers: {
    addClassStyle(state, action: PayloadAction<{ classes: any }>) {
      const newStyle = action.payload.classes;
      state.classes = newStyle;
    },
    setCurrentClass(state, action: PayloadAction<string>) {
      state.currentClass = action.payload;
    }
  },
  selectors: {
    selectStyle: state => state.classes,
    selectCurrentClass: state => state.currentClass
  }
});

export const { addClassStyle } = styleSlice.actions;
export const { setCurrentClass } = styleSlice.actions;
export default styleSlice.reducer;

export const { selectStyle } = styleSlice.selectors;
export const { selectCurrentClass } = styleSlice.selectors;

export const selectClassStyle = createSelector(
  [selectStyle, (_state, className: string) => className],
  (classes, className) => classes?.[className]
);
