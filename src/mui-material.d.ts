import "@mui/material/styles";

type ExtendPalette<T> = PaletteColor & T;
type ExtendPaletteOptions<T> = PaletteColorOptions & T;

interface MeterPalette
  extends ExtendPalette<{
    needleColor: string;
    normalStatusColor: string;
    minorWarningColor: string;
    majorWarningColor: string;
    knobColor: string;
  }> {}

interface MeterPaletteOptions
  extends ExtendPaletteOptions<{
    needleColor?: string;
    normalStatusColor?: string;
    minorWarningColor?: string;
    majorWarningColor?: string;
    knobColor?: string;
  }> {}

declare module "@mui/material/styles" {
  interface Palette {
    arc: Palette["primary"];
    boolbutton: Palette["primary"] & {
      onColor: string;
      offColor: string;
    };
    bytemonitor: Palette["primary"] & {
      onColor: string;
      offColor: string;
      borderColor: string;
    };
    choicebutton: Palette["primary"] & {
      selectedColor: string;
    };
    display: Palette["primary"];
    image: Palette["primary"];
    input: Palette["primary"];
    led: Palette["primary"] & {
      onColor: string;
      offColor: string;
      lineColor: string;
    };
    line: Palette["primary"];
    linearmeter: MeterPalette;
    meter: ExtendPalette<{ needleColor: string }>;
    polygon: ExtendPalette<{ lineColor: string }>;
    progressbar: ExtendPalette<{ fillColor: string }>;
    shape: Palette["primary"];
    stripchart: Palette["primary"];
    tabbar: ExtendPalette<{ selectedColor: string; deselectedColor: string }>;
    tabcontainer: Palette["primary"];
    tank: ExtendPalette<{ fillColor: string; emptyColor: string }>;
    thermometer: Palette["primary"];
    webcam: Palette["primary"];
    xyplot: Palette["primary"];
  }

  interface PaletteOptions {
    arc?: PaletteOptions["primary"];
    boolbutton?: Partial<PaletteOptions["primary"]> & {
      onColor: string;
      offColor: string;
    };
    bytemonitor?: Partial<PaletteOptions["primary"]> & {
      onColor: string;
      offColor: string;
      borderColor: string;
    };
    choicebutton?: Partial<PaletteOptions["primary"]> & {
      selectedColor: string;
    };
    display?: PaletteOptions["primary"];
    image?: PaletteOptions["primary"];
    input?: PaletteOptions["primary"];
    led?: Partial<PaletteOptions["primary"]> & {
      onColor: string;
      offColor: string;
      lineColor: string;
    };
    line?: PaletteOptions["primary"];
    linearmeter?: MeterPaletteOptions;
    meter?: ExtendPaletteOptions<{ needleColor: string }>;
    polygon?: ExtendPaletteOptions<{ lineColor: string }>;
    progressbar?: ExtendPaletteOptions<{ fillColor: string }>;
    shape?: PaletteOptions["primary"];
    stripchart?: PaletteOptions["primary"];
    tabbar?: ExtendPaletteOptions<{
      selectedColor: string;
      deselectedColor: string;
    }>;
    tabcontainer?: PaletteOptions["primary"];
    tank?: ExtendPaletteOptions<{ fillColor: string; emptyColor: string }>;
    thermometer?: PaletteOptions["primary"];
    webcam?: PaletteOptions["primary"];
    xyplot?: PaletteOptions["primary"];
  }

  interface BorderDef {
    borderStyle: string;
    borderWidth: number | string;
    borderColor: string;
    borderRadius: number | string;
  }

  interface Theme {
    customName?: string;
    borders: {
      default: BorderDef;
      dynamictabs: BorderDef;
      linearmeter: BorderDef;
      shape: BorderDef;
      slidecontrol: BorderDef;
      tank: BorderDef;
      thermometer: BorderDef;
    };
  }

  interface ThemeOptions {
    customName?: string;
    borders?: {
      default?: Partial<BorderDef>;
      dynamictabs?: Partial<BorderDef>;
      linearmeter?: Partial<BorderDef>;
      shape?: Partial<BorderDef>;
      slidecontrol?: Partial<BorderDef>;
      tank?: Partial<BorderDef>;
      thermometer?: Partial<BorderDef>;
    };
  }
}
