/**
 * A widget that shows files stored in the file context under
 * a specific 'location'. Unlike the dynamic tabs widget, only
 * one file is shown.
 *
 * See also the dynamic tabs widget.
 */
import React, { useContext } from "react";

import { Widget, commonCss } from "../widget";
import { WidgetPropType } from "../widgetProps";
import { ActionButton } from "../ActionButton/actionButton";
import { CLOSE_PAGE } from "../widgetActions";
import { registerWidget } from "../register";
import {
  StringProp,
  InferWidgetProps,
  BorderPropOpt,
  BoolPropOpt
} from "../propTypes";
import {
  EmbeddedDisplay,
  EmbeddedDisplayPropsExtra
} from "../EmbeddedDisplay/embeddedDisplay";
import { Color } from "../../../types/color";
import { newRelativePosition } from "../../../types/position";
import { ExitFileContext, FileContext } from "../../../misc/fileContext";
import { phoebusTheme } from "../../../phoebusTheme";

const DynamicPageProps = {
  location: StringProp,
  border: BorderPropOpt,
  showCloseButton: BoolPropOpt,
  scroll: BoolPropOpt
};

// Generic display widget to put other things inside
export const DynamicPageComponent = (
  props: InferWidgetProps<typeof DynamicPageProps> & EmbeddedDisplayPropsExtra
): JSX.Element => {
  const theme = props.theme || phoebusTheme;
  const style = commonCss(props);
  const fileContext = useContext(FileContext);

  const file = fileContext.pageState[props.location];

  // Default behaviour is to show close button
  const showCloseButton =
    props.showCloseButton === undefined ? true : props.showCloseButton;

  if (file === undefined) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          border: "1px solid black",
          minHeight: "100px",
          fontSize: "0.625rem",
          ...style
        }}
      >
        <h3>Dynamic page &quot;{props.location}&quot;: no file loaded.</h3>
      </div>
    );
  } else if (showCloseButton) {
    return (
      <ExitFileContext.Provider
        value={() => fileContext.removePage(props.location)}
      >
        <div style={style}>
          <EmbeddedDisplay
            file={file}
            position={newRelativePosition()}
            scalingOrigin={"0 0"}
            scroll={props.scroll ?? false}
            theme={theme}
          />
          <div
            style={{
              position: "absolute",
              right: "5px",
              top: "5px",
              width: "25px",
              height: "25px",
              backgroundColor: "green"
            }}
          >
            <ActionButton
              position={newRelativePosition("25px", "25px")}
              backgroundColor={new Color("var(--light-background)")}
              foregroundColor={new Color("#000000")}
              text={"\u2715"}
              actions={{
                executeAsOne: false,
                actions: [
                  {
                    type: CLOSE_PAGE,
                    dynamicInfo: {
                      name: props.location,
                      location: props.location,
                      file: file,
                      description: "Close"
                    }
                  }
                ]
              }}
            />
          </div>
        </div>
      </ExitFileContext.Provider>
    );
  } else {
    return (
      <ExitFileContext.Provider
        value={() => fileContext.removePage(props.location)}
      >
        <div style={style}>
          <EmbeddedDisplay
            file={file}
            position={newRelativePosition()}
            scalingOrigin={"0 0"}
            scroll={props.scroll ?? false}
            theme={theme}
          />
        </div>
      </ExitFileContext.Provider>
    );
  }
};

const DynamicPageWidgetProps = {
  ...DynamicPageProps,
  ...WidgetPropType
};

export const DynamicPageWidget = (
  props: InferWidgetProps<typeof DynamicPageWidgetProps>
): JSX.Element => <Widget baseWidget={DynamicPageComponent} {...props} />;

registerWidget(DynamicPageWidget, DynamicPageWidgetProps, "dynamicpage");
