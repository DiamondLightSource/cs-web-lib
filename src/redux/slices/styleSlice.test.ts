import { describe, it, expect, vi, beforeEach } from "vitest";
import styleReducer, {
  addClassStyle,
  setCurrentClass,
  initialStyleState,
  selectClassStyle,
  selectCurrentClass,
  selectStyle
} from "./styleSlice";

const mockState = {
  classes: {
    MY_CLASSboolbutton: {
      textAlign: "left"
    },

    MY_CLASSactionbutton: {
      textAlign: "right"
    }
  }
};

describe("style slice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("styleReducer", () => {
    it("should return the initial state", () => {
      // @ts-expect-error - Testing reducer initialisation with undefined action type
      expect(styleReducer(undefined, { type: undefined })).toEqual(
        initialStyleState
      );
    });

    describe("addStyle", () => {
      it("should add style", () => {
        const nextState = styleReducer(
          initialStyleState,
          addClassStyle(mockState)
        );
        expect(nextState.classes).toEqual({
          MY_CLASSactionbutton: {
            textAlign: "right"
          },
          MY_CLASSboolbutton: {
            textAlign: "left"
          }
        });
      });
    });

    describe("setCurrentClass", () => {
      it("should set the current class", () => {
        const nextState = styleReducer(
          initialStyleState,
          setCurrentClass("MY_CLASSboolbutton")
        );
        expect(nextState.currentClass).toEqual("MY_CLASSboolbutton");
      });
    });
  });

  describe("selectors", () => {
    describe("selectStyle", () => {
      it("should select all style", () => {
        const result = selectStyle({ style: mockState });
        expect(result).toEqual(mockState.classes);
      });
    });

    describe("selectClassStyle", () => {
      it("should select a specific class by name", () => {
        const result = selectClassStyle(
          { style: mockState },
          "MY_CLASSboolbutton"
        );
        expect(result).toEqual({ textAlign: "left" });
      });

      it("should return undefined when class does not exist", () => {
        const result = selectClassStyle({ style: mockState }, "MY_CLASSlabel");
        expect(result).toBeUndefined();
      });
    });

    describe("selectCurrentClass", () => {
      it("should select the current class", () => {
        const result = selectCurrentClass({
          style: { ...mockState, currentClass: "MY_CLASSboolbutton" }
        });
        expect(result).toEqual("MY_CLASSboolbutton");
      });
    });
  });
});
