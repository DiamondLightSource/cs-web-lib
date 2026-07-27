import {
  positionToCss,
  newRelativePosition,
  newAbsolutePosition
} from "./position";

test("relative: converts numeric values to px", () => {
  const css = positionToCss(newRelativePosition("", "", 100, 200));
  expect(css.width).toBe("100px");
  expect(css.height).toBe("200px");
});

test("relative: converts string values to css", () => {
  const css = positionToCss(newRelativePosition("", "", "100%", "200%"));
  expect(css.width).toBe("100%");
  expect(css.height).toBe("200%");
});

test("relative: converts mixed values to css", () => {
  const css = positionToCss(newRelativePosition("", "", "100px", "200%"));
  expect(css.width).toBe("100px");
  expect(css.height).toBe("200%");
});

test("absolute: converts numeric values to px", () => {
  const css = positionToCss(newAbsolutePosition(10, 20, 100, 200));
  expect(css.left).toBe("10px");
  expect(css.top).toBe("20px");
  expect(css.width).toBe("100px");
  expect(css.height).toBe("200px");
});

test("absolute: converts string values to css", () => {
  const css = positionToCss(newAbsolutePosition("10%", "20%", "100%", "200%"));
  expect(css.left).toBe("10%");
  expect(css.top).toBe("20%");
  expect(css.width).toBe("100%");
  expect(css.height).toBe("200%");
});

test("absolute: converts mixed values to css", () => {
  const css = positionToCss(newAbsolutePosition(10, "20%", "100px", "200%"));
  expect(css.left).toBe("10px");
  expect(css.top).toBe("20%");
  expect(css.width).toBe("100px");
  expect(css.height).toBe("200%");
});
