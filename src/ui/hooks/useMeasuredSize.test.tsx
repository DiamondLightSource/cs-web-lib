import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { useMeasuredSize } from "./useMeasuredSize";

type ResizeCallback = (entries: ResizeObserverEntry[]) => void;

class MockResizeObserver {
  static callback: ResizeCallback | null = null;
  static instance: MockResizeObserver;

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(cb: ResizeCallback) {
    MockResizeObserver.callback = cb;
    MockResizeObserver.instance = this;
  }
}

(global as any).ResizeObserver = MockResizeObserver;

const TestComponent = ({
  initialWidth = 0,
  initialHeight = 0
}: {
  initialWidth?: number;
  initialHeight?: number;
}) => {
  const [ref, size] = useMeasuredSize<HTMLDivElement>(
    initialWidth,
    initialHeight
  );

  return (
    <div ref={ref} data-testid="container">
      <span data-testid="width">{size.width}</span>
      <span data-testid="height">{size.height}</span>
    </div>
  );
};

describe("useMeasuredSize", () => {
  beforeEach(() => {
    MockResizeObserver.callback = null;
  });

  afterEach(() => {
    cleanup();
  });

  it("returns the initial width and height", () => {
    render(<TestComponent initialWidth={100} initialHeight={50} />);

    expect(screen.getByTestId("width").textContent).toBe("100");
    expect(screen.getByTestId("height").textContent).toBe("50");
  });

  it("updates size when ResizeObserver reports valid dimensions", () => {
    render(<TestComponent />);

    act(() => {
      MockResizeObserver.callback?.([
        {
          contentRect: { width: 200, height: 120 }
        } as ResizeObserverEntry
      ]);
    });

    expect(screen.getByTestId("width").textContent).toBe("200");
    expect(screen.getByTestId("height").textContent).toBe("120");
  });

  it("ignores zero or negative sizes", () => {
    render(<TestComponent initialWidth={100} initialHeight={50} />);

    act(() => {
      MockResizeObserver.callback?.([
        {
          contentRect: { width: 0, height: 0 }
        } as ResizeObserverEntry
      ]);
    });

    expect(screen.getByTestId("width").textContent).toBe("100");
    expect(screen.getByTestId("height").textContent).toBe("50");
  });

  it("ignores changes smaller than 1px", () => {
    render(<TestComponent initialWidth={100} initialHeight={50} />);

    act(() => {
      MockResizeObserver.callback?.([
        {
          contentRect: { width: 100.4, height: 50.6 }
        } as ResizeObserverEntry
      ]);
    });

    expect(screen.getByTestId("width").textContent).toBe("100");
    expect(screen.getByTestId("height").textContent).toBe("50");
  });

  it("updates when width or height changes by 1px or more", () => {
    render(<TestComponent initialWidth={100} initialHeight={50} />);

    act(() => {
      MockResizeObserver.callback?.([
        {
          contentRect: { width: 101, height: 52 }
        } as ResizeObserverEntry
      ]);
    });

    expect(screen.getByTestId("width").textContent).toBe("101");
    expect(screen.getByTestId("height").textContent).toBe("52");
  });

  it("disconnects the ResizeObserver on unmount", () => {
    const { unmount } = render(<TestComponent />);
    unmount();
    expect(MockResizeObserver.instance?.disconnect).toHaveBeenCalled();
  });
});
