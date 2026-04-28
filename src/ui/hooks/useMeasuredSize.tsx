import { useEffect, useRef, useState } from "react";

/**
 * This hook is used to return the size of the component attached to the returned ref,
 * which is useful if you need to compute the dimensions of a resizable element.
 * @param initialWidth The initial width in pixels.
 * @param initialHeight The initial height in pixels
 * @returns A reference to be attached to a component and a size object { width, height }
 */
export const useMeasuredSize = <T extends Element>(
  initialWidth = 0,
  initialHeight = 0
): [React.MutableRefObject<T | null>, { width: number; height: number }] => {
  const ref = useRef<T | null>(null);

  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight
  });

  useEffect(() => {
    if (!ref.current) return;

    let lastWidth = initialWidth;
    let lastHeight = initialHeight;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;

      if (width <= 0 || height <= 0) return;

      if (
        Math.abs(width - lastWidth) < 1 &&
        Math.abs(height - lastHeight) < 1
      ) {
        return;
      }

      lastWidth = width;
      lastHeight = height;

      setSize({ width, height });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [initialWidth, initialHeight]);

  return [ref, size];
};
