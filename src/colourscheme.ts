import { createTheme } from "@mui/material/styles";

export const defaultColours = createTheme({
  palette: {
    primary: {
      main: "#D2D2D2",
      // light: currently calculated automatically by MUI
      // dark: currently calculated automatically by MUI
      contrastText: "#000000"
    }
  },
  typography: {
    button: {
      textTransform: "none"
    }
  }
});
