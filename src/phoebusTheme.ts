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
    arc: {
      main: "rgba(30,144,255,1)",
      contrastText: "rgba(0,0,255,1)"
    },
    boolbutton: {
      main: "#D2D2D2",
      contrastText: "#000000",
      onColor: "rgba(0,255,0,1)",
      offColor: "rgba(0,100,0,1)"
    },
    bytemonitor: {
      main: "#ffffffff",
      contrastText: "#000000",
      onColor: "rgba(0,255,0,1)",
      offColor: "rgba(0,100,0,1)",
      borderColor: "rgba(50,50,50,0.7)"
    },
    choiceButton: {
      main: "#D2D2D2",
      contrastText: "#000000",
      selectedColor: "rgba(200,200,200,1)"
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
    led: {
      main: "#ffffffff",
      contrastText: "#000000",
      onColor: "rgba(0,255,0,1)",
      offColor: "rgba(60,100,60,1)",
      lineColor: "rgba(50,50,50,0.7)"
    },
    line: {
      main: "rgb(0,0,255)",
      contrastText: "#000000"
    },
    linearmeter: {
      main: "#D2D2D2",
      contrastText: "#000000",
      normalStatusColor: "rgba(194, 198, 195, 1)",
      minorWarningColor: "rgba(242, 148, 141, 1)",
      majorWarningColor: "rgba(240, 60, 46, 1)",
      knobColor: "#000000",
      needleColor: "#0c0505ff"
    },
    meter: {
      main: "#ffffffff",
      contrastText: "#000000",
      needleColor: "rgba(255, 5, 7, 1)"
    },
    polygon: {
      main: "rgba(50,50,255,1)",
      contrastText: "#000000",
      lineColor: "rgba(0,0,255,1)"
    },
    progressbar: {
      main: "#ffffffff",
      contrastText: "#000000",
      fillColor: "rgba(60, 255, 60, 1)"
    },
    shape: {
      main: "rgba(30,144,255,1)",
      contrastText: "rgba(0,0,25,1)"
    },
    stripchart: {
      main: "rgba(255,255,255,1)",
      contrastText: "rgba(0,0,0,1)"
    },
    tabbar: {
      main: "rgba(255,255,255,1)",
      contrastText: "rgba(0,0,0,1)",
      selectedColor: "rgb(236, 236, 236)",
      deselectedColor: "rgb(200, 200, 200)"
    },
    tabcontainer: {
      main: "rgba(255,255,255,1)",
      contrastText: "rgba(0,0,0,1)"
    },
    tank: {
      main: "rgba(255,255,255,1)",
      contrastText: "rgba(0,0,0,1)",
      fillColor: "rgba(0, 0, 255, 1)",
      emptyColor: "rgba(192, 192, 192, 1)"
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
    linearmeter: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "#D2D2D2",
      borderRadius: "4px"
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
