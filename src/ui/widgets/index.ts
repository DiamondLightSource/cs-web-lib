import log from "loglevel";

export { EmbeddedDisplay } from "./EmbeddedDisplay/embeddedDisplay";
export { Label } from "./Label/label";
export { Display } from "./Display/display";
export { Shape } from "./Shape/shape";
export { FlexContainer } from "./FlexContainer/flexContainer";
export { DynamicPageWidget } from "./DynamicPage/dynamicPage";
export { Image } from "./Image/image";
export { Readback } from "./Readback/readback";
export { Arc } from "./Arc/arc";
export { ActionButton } from "./ActionButton/actionButton";
export { BoolButton } from "./BoolButton/boolButton";
export { ByteMonitor } from "./ByteMonitor/byteMonitor";
export { Checkbox } from "./Checkbox/checkbox";
export { ChoiceButton } from "./ChoiceButton/choiceButton";
export { Device } from "./Device/device";
export { DrawerWidget } from "./Drawer/drawer";
export { DropDown } from "./DropDown/dropDown";
export { Ellipse } from "./Ellipse/ellipse";
export { GroupBox } from "./GroupBox/groupBox";
export { GroupingContainer } from "./GroupingContainer/groupingContainer";
export { Input } from "./Input/input";
export { LED } from "./LED/led";
export { Line } from "./Line/line";
export { MenuButton } from "./MenuButton/menuButton";
export { MenuMux } from "./MenuMux/menuMux";
export { Polygon } from "./Polygon/polygon";
export { ProgressBar } from "./ProgressBar/progressBar";
export { SimpleSymbol } from "./SimpleSymbol/simpleSymbol";
export { SlideControl } from "./SlideControl/slideControl";
export { Slideshow } from "./Slideshow/slideshow";
export { Symbol } from "./Symbol/symbol";
export { TabBar } from "./Tabs/tabs";
export { TabContainer } from "./Tabs/tabContainer";
export { DynamicTabs } from "./Tabs/dynamicTabs";
export { XYPlot } from "./XYPlot/xyPlot";
export { Webcam } from "./Webcam/webcam";
export { executeAction } from "./widgetActions";
export { Tank } from "./Tank/tank";

// By importing and calling this function you ensure all the
// above widgets are imported and thus registered.
export function ensureWidgetsRegistered(): void {
  log.debug("Triggering widget import.");
}
