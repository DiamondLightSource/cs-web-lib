import React, { CSSProperties, useCallback, useContext, useState } from "react";
import log from "loglevel";
import copyToClipboard from "clipboard-copy";

import { ContextMenu } from "../components/ContextMenu/contextMenu";
import ctxtClasses from "../components/ContextMenu/contextMenu.module.css";
import tooltipClasses from "./tooltip.module.css";
import { useMacros } from "../hooks/useMacros";
import { useConnectionMultiplePv } from "../hooks/useConnection";
import { useId } from "react-id-generator";
import { useRules } from "../hooks/useRules";
import {
  ConnectingComponentWidgetProps,
  PVWidgetComponent
} from "./widgetProps";
import { Border, BorderStyle } from "../../types/border";
import { Color } from "../../types/color";
import { AlarmQuality } from "../../types/dtypes";
import { Font } from "../../types/font";
import { OutlineContext } from "../../misc/outlineContext";
import { ExitFileContext, FileContext } from "../../misc/fileContext";
import { executeAction, WidgetAction, WidgetActions } from "./widgetActions";
import { Popover } from "react-tiny-popover";
import { resolveTooltip } from "./tooltip";

const ALARM_SEVERITY_MAP = {
  [AlarmQuality.ALARM]: 1,
  [AlarmQuality.WARNING]: 2,
  [AlarmQuality.INVALID]: 3,
  [AlarmQuality.UNDEFINED]: 4,
  [AlarmQuality.CHANGING]: 5,
  [AlarmQuality.VALID]: 6
};

const AlarmColorsMap = {
  [AlarmQuality.VALID]: Color.BLACK,
  [AlarmQuality.WARNING]: Color.WARNING,
  [AlarmQuality.ALARM]: Color.ALARM,
  [AlarmQuality.INVALID]: Color.INVALID,
  [AlarmQuality.UNDEFINED]: Color.UNDEFINED,
  [AlarmQuality.CHANGING]: Color.CHANGING
};

/**
 * Return a CSSProperties object for props that multiple widgets may have.
 * @param props properties of the widget to be formatted
 * @returns a CSSProperties object to pass into another element under the style key
 */
export function commonCss(props: {
  border?: Border;
  font?: Font;
  visible?: boolean;
  foregroundColor?: Color;
  backgroundColor?: Color;
  transparent?: boolean;
  actions?: WidgetActions;
}): CSSProperties {
  const visible = props.visible === undefined || props.visible;
  const backgroundColor = props.transparent
    ? "transparent"
    : props.backgroundColor?.toString();
  const cursor =
    props.actions && props.actions.actions.length > 0 ? "pointer" : undefined;
  return {
    ...props.border?.css(),
    ...props.font?.css(),
    color: props.foregroundColor?.toString(),
    backgroundColor,
    cursor,
    visibility: visible ? undefined : "hidden"
  };
}

/**
 * This component creates the connection aspect of a widget.
 * This is separate because the PV value changes more often than
 * most props, so we allow this component to re-render without
 * the other calculations in Widget being repeated.
 * @param props
 * @returns JSX Element to render
 */
export const ConnectingComponent = (props: {
  component: React.FC<any>;
  widgetProps: ConnectingComponentWidgetProps;
  containerStyle: CSSProperties;
  onContextMenu?: (e: React.MouseEvent) => void;
}): JSX.Element => {
  const Component = props.component;
  const { id, alarmBorder = false, pvMetadataList } = props.widgetProps;

  const pvName =
    pvMetadataList && pvMetadataList?.length > 0
      ? pvMetadataList[0]?.pvName
      : undefined;

  const pvNames = pvMetadataList
    ? pvMetadataList.map(metadata => metadata?.pvName).filter(pv => !!pv)
    : [];

  // Popover logic, used for middle-click tooltip.
  const [popoverOpen, setPopoverOpen] = useState(false);
  const mouseDown = (e: React.MouseEvent): void => {
    if (e.button === 1) {
      console.log("Firing button click");
      console.log(pvName);
      console.log(pvMetadataList);
      setPopoverOpen(true);
      if (pvName && e.currentTarget) {
        (e.currentTarget as HTMLDivElement).classList.add(
          tooltipClasses.Copying
        );
        copyToClipboard(pvName.toString());
      }
      // Stop regular middle-click behaviour if showing tooltip.
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const mouseUp = (e: React.MouseEvent): void => {
    if (e.button === 1 && e.currentTarget) {
      setPopoverOpen(false);
      (e.currentTarget as HTMLDivElement)?.classList.remove(
        tooltipClasses.Copying
      );
      e.stopPropagation();
    }
  };

  const { pvData } = useConnectionMultiplePv(
    id,
    pvNames.map(x => x.qualifiedName())
  );

  let border = props.widgetProps.border;
  if (pvNames) {
    let alarmSeverity = AlarmQuality.VALID;

    if (alarmBorder && pvData) {
      alarmSeverity = pvData
        .map(x => x.value?.getAlarm()?.quality ?? AlarmQuality.VALID)
        .reduce(
          (mostSevereSoFar, currentItem) =>
            ALARM_SEVERITY_MAP[mostSevereSoFar] <
            ALARM_SEVERITY_MAP[currentItem]
              ? mostSevereSoFar
              : currentItem,
          alarmSeverity
        );
    }

    if (alarmSeverity !== AlarmQuality.VALID) {
      border = new Border(BorderStyle.Line, AlarmColorsMap[alarmSeverity], 2);
    } else if (pvData && !pvData.every(x => x.connected)) {
      border = new Border(BorderStyle.Dotted, Color.DISCONNECTED, 3);
    }
  }

  const widgetTooltipProps = {
    ...props.widgetProps,
    tooltip: props.widgetProps.tooltip ?? "",
    pvData,
    border
  };

  // The div rendered here is the container into which the widget
  // will render itself.
  const widgetDiv = (
    <div
      onContextMenu={props.onContextMenu}
      onMouseDown={mouseDown}
      onMouseUp={mouseUp}
      style={props.containerStyle}
    >
      <Component {...widgetTooltipProps} />
    </div>
  );

  if (widgetTooltipProps.tooltip) {
    const resolvedTooltip = resolveTooltip(widgetTooltipProps);
    const popoverContent = (): JSX.Element => {
      return <div className={tooltipClasses.Tooltip}>{resolvedTooltip}</div>;
    };
    // Note that using ["top"] rather than "top" for the popover
    // position caused us significant performance problems in an older
    // version. This is now the only API, so beware of performance problems
    // here.
    return (
      <Popover
        isOpen={popoverOpen}
        positions={["top"]}
        onClickOutside={(): void => {
          setPopoverOpen(false);
        }}
        content={popoverContent}
      >
        {widgetDiv}
      </Popover>
    );
  } else {
    return widgetDiv;
  }
};

// eslint-disable-next-line no-template-curly-in-string
const DEFAULT_TOOLTIP = "${pvName}\n${pvValue}";

/**
 * This component handles the widget props that do not change
 * frequently.
 * The ConnectingComponent widget handles any props that need
 * to change on a PV update.
 *
 * Using ideas from
 * https://www.pluralsight.com/guides/how-to-create-a-right-click-menu-using-react
 * @param props
 * @returns JSX Element to render
 */
export const Widget = (props: PVWidgetComponent): JSX.Element => {
  const [id] = useId();

  const files = useContext(FileContext);
  const exitContext = useContext(ExitFileContext);
  const [contextOpen, setContextOpen] = useState(false);

  const contextMenuTriggerCallback = useCallback(
    (action: WidgetAction): void => {
      executeAction(action, files, exitContext);
      setContextOpen(false);
    },
    [files, exitContext, setContextOpen]
  );

  const [coords, setCoords] = useState<[number, number]>([0, 0]);
  let onContextMenu: ((e: React.MouseEvent) => void) | undefined = undefined;
  const actionsPresent = props.actions && props.actions.actions.length > 0;
  if (actionsPresent) {
    onContextMenu = (e: React.MouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      setContextOpen(contextOpen ? false : true);
      setCoords([e.clientX, e.clientY]);
    };
  }
  if (contextOpen) {
    // Cancel menu with a click anywhere other than on a context menu
    // item. If it is a context menu item then the menu will be
    // cancelled after executing.
    document.addEventListener(
      "mousedown",
      (event: MouseEvent) => {
        if (event.target instanceof HTMLDivElement) {
          if (event.target.classList.contains(ctxtClasses.customContextItem)) {
            return;
          }
        }
        setContextOpen(false);
      },
      { once: true }
    );
  }

  let tooltip = props.tooltip;
  // Set default tooltip only for PV-enabled widgets.
  if (
    props?.pvMetadataList &&
    props.pvMetadataList.length > 0 &&
    !props.tooltip
  ) {
    tooltip = DEFAULT_TOOLTIP;
  }
  const idProps = { ...props, id: id, tooltip: tooltip };

  // Apply macros.
  log.debug(`Widget id ${id}`);
  const macroProps = useMacros(idProps);
  // Then rules
  const ruleProps = useRules(macroProps);
  log.debug(`ruleProps ${ruleProps}`);
  log.debug(ruleProps);

  // Extract remaining parameters
  const { baseWidget, position, ...baseWidgetProps } = ruleProps;

  // Calculate the inner div style here as it doesn't update frequently.
  const { showOutlines } = useContext(OutlineContext);
  const containerStyle = {
    ...position.css(),
    outline: showOutlines ? "1px dashed grey" : undefined,
    outlineOffset: showOutlines ? "-2px" : undefined
  };

  return (
    <>
      {actionsPresent && contextOpen && (
        <ContextMenu
          actions={ruleProps.actions as WidgetActions}
          coordinates={coords}
          triggerCallback={contextMenuTriggerCallback}
        />
      )}
      <ConnectingComponent
        component={baseWidget}
        widgetProps={baseWidgetProps}
        containerStyle={containerStyle}
        onContextMenu={onContextMenu}
      />
    </>
  );
};
