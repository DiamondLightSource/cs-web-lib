import { createTheme } from "@mui/material/styles";

export const phoebusTheme = createTheme({
  customName: "phoebusTheme",
  palette: {
    primary: {
      main: "#D2D2D2",
      // light: currently calculated automatically by MUI
      // dark: currently calculated automatically by MUI
      contrastText: "#000000"
    },
    display: {
      main: "#ffffffff", // ensures a white background for the display
      contrastText: "#000000"
    },
    image: {
      main: "rgba(255,255,255,0)",
      contrastText: "#000000"
    },
    input: {
      main: "#80FFFF",
      contrastText: "#000000"
    },
    meter: {
      main: "#ffffffff",
      contrastText: "#000000"
    },
    polygon: {
      main: "rgba(50,50,255,1)",
      contrastText: "#000000"
    },
    progressbar: {
      main: "#ffffffff",
      contrastText: "#000000"
    },
    shape: {
      main: "rgba(30,144,255,1)",
      contrastText: "rgba(0,0,25,1)"
    },
    stripchart: {
      main: "rgba(255,255,255,1)",
      contrastText: "rgba(0,0,0,1)"
    },
    tabcontainer: {
      main: "rgba(255,255,255,1)",
      contrastText: "rgba(0,0,0,1)"
    },
    tank: {
      main: "rgba(255,255,255,1)",
      contrastText: "rgba(0,0,0,1)"
    },
    thermometer: {
      main: "rgba(230,230,230,1)",
      contrastText: "rgba(60,255,60,1)"
    },
    webcam: {
      main: "#D2D2D2",
      contrastText: "#a6190f"
    },
    xyplot: {
      main: "rgba(255,255,255,1)",
      contrastText: "rgba(0,0,0,1)"
    }
  },
  typography: {
    fontFamily: "Liberation Sans",
    fontSize: 14,
    button: {
      textTransform: "none"
    }
  },
  borders: {
    default: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "#000000",
      borderRadius: 0
    },
    dynamictabs: {
      borderStyle: "solid",
      borderWidth: "3px",
      borderColor: "lightgrey",
      borderRadius: "0"
    },
    shape: {
      borderStyle: "solid",
      borderWidth: "3px",
      borderColor: "rgba(0,0,255,1)",
      borderRadius: "1px"
    },
    slidecontrol: {
      borderStyle: "solid",
      borderWidth: "2px",
      borderColor: "currentColor",
      borderRadius: "0"
    },
    tank: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "#D2D2D2",
      borderRadius: "4px"
    },
    thermometer: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "rgba(75,75,75,1)",
      borderRadius: "4px"
    }
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          padding: "0"
        }
      }
    }
  }
});
