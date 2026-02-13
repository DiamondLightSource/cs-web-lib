import log from "loglevel";
import { TimeSeriesPoint } from "../widgets/StripChart/stripChart";
import { convertStringTimePeriod, trimArchiveData } from "../widgets/utils";
import { useState, useEffect } from "react";
import { Plt } from "../../types/plt";
import { httpRequest } from "../../misc/httpClient";
import { newPV, pvQualifiedName } from "../../types/pv";
import { useNotification } from "./useNotification";

/**
 * Fetch archived data for each PV from archivers available
 */
export function useArchivedData(plt: Plt): [TimeSeriesPoint[], boolean] {
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
      const timeString = `&from=${min.toISOString()}&to=${max.toISOString()}`;
      // Combine requests to same archver together to make single, multiple-PV request
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
      // Request data for each archiver and translate into correct data format
      for (const url of Object.values(archivers)) {
        let tmpData: any[] = fetchedData;
        try {
          const resp = await httpRequest(`${url}${timeString}`);
          const json = await resp.json();
          json.forEach((data: any) => {
            // Trim each dataset down and push into fetchedData
            const pvName = pvQualifiedName(newPV(data.meta.name));
            const trimmedData = trimArchiveData(
              plt.updatePeriod,
              plt.bufferSize,
              data.data
            );
            tmpData = trimmedData.map((item: any, idx: number) => {
              return {
                ...tmpData[idx],
                dateTime: new Date(item.secs * 1000),
                [pvName]: item.val
              };
            });
          });
          fetchedData = tmpData;
        } catch (e: any) {
          const { showError } = useNotification();
          showError(
            `Failed to fetch archiver data for PVs from address ${url}: ${e.error}.`
          );
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

  return [data, archiveDataLoaded];
}
