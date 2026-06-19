import { describe, it, expect, vi, beforeEach } from "vitest";
import styleReducer, {
  addClassStyle,
  initialStyleState,
  selectClassStyle,
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
  });

  describe("selectors", () => {
    describe("selectStyle", () => {
      it("should select all style", () => {
        const result = selectStyle({ style: mockState });
        expect(result).toEqual({ classes: { classes: { mockState } } });
      });
    });

    describe("selectClassStyle", () => {
      it("should select a specific class by name", () => {
        const result = selectClassStyle(mockState, "MY_CLASSboolbutton");
        expect(result).toEqual({});
      });

      it("should return undefined when class does not exist", () => {
        const result = selectClassStyle(mockState, "MY_CLASSlabel");
        expect(result).toBeUndefined();
      });
    });
  });
});
