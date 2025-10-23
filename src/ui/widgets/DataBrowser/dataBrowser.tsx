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
import { StripChartComponent, TimeSeriesPoint } from "../StripChart/stripChart";
import { convertStringTimePeriod, trimArchiveData } from "../utils";
import { PV } from "../../../types";

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
  const [data, setData] = useState<TimeSeriesPoint[]>([]);
  const [archiveDataLoaded, setArchiveDataLoaded] = useState(false);

  useEffect(() => {
    // Runs whenever pvlist updated and fetches archiver data
    const fetchArchivedPVData = async () => {
      // Fetch archiver data for period
      const startTime = convertStringTimePeriod(plt.start);
      const endTime = convertStringTimePeriod(plt.end);
      const min = new Date(new Date().getTime() - startTime);
      const max = new Date(new Date().getTime() - endTime);
      const archivers: { [key: string]: string } = {};
      plt.pvlist.forEach(trace => {
        //compile all pvs at same archiver
        if (trace.archive?.url) {
          if (!Object.keys(archivers).includes(trace.archive.url)) {
            archivers[trace.archive.url] =
              `${trace.archive.url}/data/getDataForPVs.json?pv=mean_${plt.updatePeriod}(${trace.yPv})`;
          } else {
            archivers[trace.archive.url] +=
              `&pv=mean_${plt.updatePeriod}(${trace.yPv})`;
          }
        }
      });
      let fetchedData: TimeSeriesPoint[] = [];
      for (const url of Object.values(archivers)) {
        try {
          const resp = await fetch(
            `${url}&from=${min.toISOString()}&to=${max.toISOString()}`
          );
          const json = await resp.json();
          json.forEach((data: any) => {
            // Trim each dataset down and push into fetchedData
            const pvName = new PV(data.meta.name).qualifiedName();
            const trimmedData = trimArchiveData(
              plt.updatePeriod,
              plt.bufferSize,
              data.data
            );
            fetchedData = trimmedData.map((item: any, idx: number) => {
              return {
                ...fetchedData[idx],
                dateTime: new Date(item.secs * 1000),
                [pvName]: item.val
              };
            });
          });
        } catch (e: any) {
          log.error(
            `Failed to fetch archiver data for PVs from address ${url}: ${e.error}.`
          );
        }
      }
      setArchiveDataLoaded(true);
      setData(fetchedData);
    };
    // Only fetch once
    if (!archiveDataLoaded) fetchArchivedPVData();
  }, [archiveDataLoaded, plt]);

  return (
    <StripChartComponent
      {...plt}
      traces={plt.pvlist}
      pvData={props.pvData}
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
