import { TextField, ThemeProvider } from "@mui/material";
import React, { CSSProperties, useState } from "react";
import { diamondTheme } from "../../../diamondTheme";

export const InputComponent = (props: {
  value: string;
  onEnter: (value: string) => void;
  readonly?: boolean;
  style?: CSSProperties;
  className?: string;
}): JSX.Element => {
  const [inputValue, setInputValue] = useState("");
  const [editing, setEditing] = useState(false);
  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      props.onEnter(event.currentTarget.value);
      setInputValue("");
      setEditing(false);
      event.currentTarget.blur();
    }
  }

  function onClick(event: React.MouseEvent<HTMLInputElement>): void {
    /* When focus gained allow editing. */
    if (!props.readonly && !editing) {
      setInputValue("");
      setEditing(true);
    }
  }

  if (!editing && inputValue !== props.value) {
    setInputValue(props.value);
  }

  return (
    <ThemeProvider theme={diamondTheme}>
      <TextField
        variant="outlined"
        type="text"
        value={inputValue}
        slotProps={{ input: { readOnly: props.readonly } }}
        onKeyDown={onKeyDown}
        onChange={event => setInputValue(event.target.value)}
        onBlur={() => setEditing(false)}
        onClick={onClick}
        className={props.className}
        sx={{
          input: { color: props.style?.color ?? null }
        }}
      />
    </ThemeProvider>
  );
};
