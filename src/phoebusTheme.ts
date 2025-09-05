import { createTheme } from "@mui/material/styles";

export const phoebusTheme = createTheme({
  palette: {
    primary: {
      main: "#D2D2D2",
      // light: currently calculated automatically by MUI
      // dark: currently calculated automatically by MUI
      contrastText: "#000000"
    }
  },
  typography: {
    fontFamily: "Liberation Sans",
    fontSize: 14,
    button: {
      textTransform: "none"
    }
  }
});
