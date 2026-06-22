import { UseStyleResult } from "../ui/hooks/useStyle";

const defaultStyle = {
  colors: {
    color: "rgb(155, 160, 209)",
    backgroundColor: "rgba(0, 0, 0, 1)"
  },
  customColors: {},
  font: {
    fontFamily: undefined,
    fontSize: undefined,
    fontStyle: undefined,
    fontWeight: undefined
  },
  border: {
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "green",
    borderRadius: "0px"
  }
};

export const createMockStyle = (
  overrides: {
    colors?: object;
    customColors?: object;
    font?: object;
    border?: object;
    newProps?: object;
  } = {
    colors: {},
    customColors: {},
    font: {},
    border: {},
    newProps: {}
  }
): [UseStyleResult, any] => {
  const style: UseStyleResult = {
    ...defaultStyle,
    ...overrides,
    colors: { ...defaultStyle.colors, ...overrides?.colors },
    font: { ...defaultStyle.font, ...overrides?.font },
    border: { ...defaultStyle.border, ...overrides?.border },
    customColors: { ...defaultStyle.customColors, ...overrides?.customColors },
    other: {}
  };
  return [style, overrides.newProps ?? {}];
};
