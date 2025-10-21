import React, { useEffect, useState } from "react";
import log from "loglevel";
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
import { convertStringTimePeriod, trimArchiveData } from "../utils";

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
  const [data, setData] = useState<{
    x: Date[];
    y: any[];
  }>();
  const [archiveDataLoaded, setArchiveDataLoaded] = useState(false);

  useEffect(() => {
    // Runs whenever pvlist updated and fetches archiver data
    const fetchArchivedPVData = async () => {
      // TO DO - use when multiple PVs enabled
      // plt.pvlist.forEach((trace) => {
      //     //Make call to getPvsData for multiple pvs
      // })
      try {
        // Fetch archiver data for period
        const startTime = convertStringTimePeriod(plt.start);
        const endTime = convertStringTimePeriod(plt.end);
        const min = new Date(new Date().getTime() - startTime);
        const max = new Date(new Date().getTime() - endTime);
        // TO DO - optimise request based on plt.request. Currently we optimise all requests
        const archiverCall = `${plt.pvlist[0].archive?.url}/data/getData.json?pv=mean_${plt.updatePeriod}(${plt.pvlist[0].yPv})&from=${min.toISOString()}&to=${max.toISOString()}`;
        const resp = await fetch(archiverCall);
        const json = await resp.json();

        // Filter data down by update period and buffer size
        const trimmedData = trimArchiveData(
          plt.updatePeriod,
          plt.bufferSize,
          json[0].data
        );
        setData({
          x: trimmedData.map((item: any) => {
            return new Date(item.secs * 1000);
          }),
          y: trimmedData.map((item: any) => {
            return item.val;
          })
        });
        setArchiveDataLoaded(true);
      } catch (e) {
        log.error(
          `Failed to fetch archiver data for PV ${plt.pvlist[0].yPv} from ${plt.pvlist[0].archive?.url}.`
        );
      }
    };
    // Only fetch onces
    if (!archiveDataLoaded) fetchArchivedPVData();
  }, [archiveDataLoaded, plt]);

  return (
    <StripChartComponent
      {...plt}
      traces={plt.pvlist}
      value={props.value}
      readonly={props.readonly}
      connected={props.connected}
      archivedData={data}
      archivedDataLoaded={archiveDataLoaded}
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
