import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    customName?: string;
  }
  interface ThemeOptions {
    customName?: string;
  }

  interface Palette {
    display: Palette['primary'];
    image: Palette['primary'];
    input: Palette['primary'];
    meter: Palette['primary'];
    polygon: Palette['primary'];
    progressbar: Palette['primary'];
    shape: Palette['primary'];
    stripchart: Palette['primary'];
    tabcontainer: Palette['primary'];
    tank: Palette['primary'];
    thermometer: Palette['primary'];
    webcam: Palette['primary'];
    xyplot: Palette['primary'];
  }
  
  interface PaletteOptions {
    display?: PaletteOptions['primary'];
    image?: PaletteOptions['primary'];
    input?: PaletteOptions['primary'];
    meter?: PaletteOptions['primary'];
    polygon?: PaletteOptions['primary'];
    progressbar?: PaletteOptions['primary'];
    shape?: PaletteOptions['primary'];
    stripchart?: PaletteOptions['primary'];
    tabcontainer?: PaletteOptions['primary'];
    tank?: PaletteOptions['primary'];
    thermometer?: PaletteOptions['primary'];
    webcam?: PaletteOptions['primary'];
    xyplot?: PaletteOptions['primary'];
  }

  interface BorderDef {
    borderStyle: string;
    borderWidth: number | string;
    borderColor: string;
    borderRadius: number | string;
  }

  interface Theme {
    borders: {
      default: BorderDef;
      dynamictabs: BorderDef;
      shape: BorderDef;
      slidecontrol: BorderDef;
      tank: BorderDef;
      thermometer: BorderDef;
    };
  }

  interface ThemeOptions {
    borders?: {
      default?: Partial<BorderDef>;
      dynamictabs?: Partial<BorderDef>;
      shape?: Partial<BorderDef>;
      slidecontrol?: Partial<BorderDef>;
      tank?: Partial<BorderDef>;
      thermometer?: Partial<BorderDef>;
    };
  }
}
