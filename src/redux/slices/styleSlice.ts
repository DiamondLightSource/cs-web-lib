import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface StyleStack {
  classes: { [className: string]: any };
}

export const initialStyleState: StyleStack = {
  classes: {}
};

const styleSlice = createSlice({
  name: "style",
  initialState: initialStyleState,
  reducers: {
    addClassStyle(state, action: PayloadAction<{ classes: any }>) {
      const newStyle = action.payload.classes;
      state.classes = newStyle;
    }
  },
  selectors: {
    selectStyle: state => state.classes
  }
});

export const { addClassStyle } = styleSlice.actions;
export default styleSlice.reducer;

export const { selectStyle } = styleSlice.selectors;

export const selectClassStyle = createSelector(
  [selectStyle, (_state, className: string) => className],
  (classes, className) => classes?.[className]
);
