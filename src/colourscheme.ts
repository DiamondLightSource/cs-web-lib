import { createTheme } from "@mui/material/styles";

export const defaultColours = createTheme({
  palette: {
    primary: {
      main: "#000080",
      // light: currently calculated automatically by MUI
      // dark: currently calculated automatically by MUI
      contrastText: "#FFFFFF"
    },
  },
  typography: {
    button: {
      textTransform: "none",
    },
  },
});
