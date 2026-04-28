import React from "react";

export const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const id = setTimeout(() => {
      return setDebounced(value);
    }, delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};
