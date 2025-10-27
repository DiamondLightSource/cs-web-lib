import React from "react";
import { Widget } from "../widget";
import { PVComponent, PVWidgetPropType } from "../widgetProps";
import {
  BoolPropOpt,
  InferWidgetProps,
  PltProp,
  PvPropOpt
} from "../propTypes";
import { registerWidget } from "../register";
import { StripChartComponent } from "../StripChart/stripChart";
import { useArchivedData } from "../../hooks/useArchivedData";

const DataBrowserProps = {
  plt: PltProp,
  selectionValuePv: PvPropOpt,
  showToolbar: BoolPropOpt,
  visible: BoolPropOpt
};

// Needs to be exported for testing
export type DataBrowserComponentProps = InferWidgetProps<
  typeof DataBrowserProps
> &
  PVComponent;

export const DataBrowserComponent = (
  props: DataBrowserComponentProps
): JSX.Element => {
  const { plt } = props;
  const [data, dataLoaded] = useArchivedData(plt);

  return (
    <StripChartComponent
      {...plt}
      traces={plt.pvlist}
      pvData={props.pvData}
      archivedData={data}
      archivedDataLoaded={dataLoaded}
      updatePeriod={plt.updatePeriod}
      bufferSize={plt.bufferSize}
    />
  );
};

const DataBrowserWidgetProps = {
  ...DataBrowserProps,
  ...PVWidgetPropType
};

export const DataBrowser = (
  props: InferWidgetProps<typeof DataBrowserWidgetProps>
): JSX.Element => <Widget baseWidget={DataBrowserComponent} {...props} />;

registerWidget(DataBrowser, DataBrowserWidgetProps, "databrowser");
