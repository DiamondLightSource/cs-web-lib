import React from "react";
import { useArchivedData } from "./useArchivedData";
import { Plt } from "../../types/plt";
import { vi } from "vitest";
import { Axis } from "../../types/axis";
import { Trace } from "../../types/trace";
import { act, screen } from "@testing-library/react";
import { contextRender } from "../../testResources";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Global {}
  }
}

interface GlobalFetch extends NodeJS.Global {
  fetch: any;
}
const globalWithFetch = global as GlobalFetch;

const mockSuccessResponse: any = JSON.stringify([
  {
    secs: (new Date().getTime() - 250000) / 1000,
    val: 52
  },
  {
    secs: (new Date().getTime() - 200000) / 1000,
    val: 45
  },
  {
    secs: (new Date().getTime() - 70000) / 1000,
    val: 60
  }
]);
const mockJsonPromise = Promise.resolve(
  JSON.parse(
    `[{"data": ${mockSuccessResponse}, "meta": { "name": "TEST:PV" }}]`
  )
);
const mockFetchPromise = Promise.resolve({
  json: (): Promise<unknown> => mockJsonPromise
});
const mockFetch = (): Promise<unknown> => mockFetchPromise;
vi.spyOn(globalWithFetch, "fetch").mockImplementation(mockFetch);

// Helper component to allow calling the useConnection hook.
const ArchivedDataTester = (props: { plt: Plt }): JSX.Element => {
  const [data, dataLoaded] = useArchivedData(props.plt);
  return (
    <div>
      <div>loaded: {dataLoaded ? "true" : "false"}</div>
      <div>data: {data.toString()}</div>
    </div>
  );
};

describe("useArchivedData", (): void => {
  it("returns values if successful archiver call", async () => {
    const plt = new Plt({
      pvlist: [
        new Trace({
          archive: {
            name: "Primary",
            url: "http://archiver.diamond.ac.uk/retrieval"
          },
          yPv: "TEST:PV"
        })
      ],
      axes: [new Axis()]
    });
    await act(async () => {
      return contextRender(<ArchivedDataTester plt={plt} />);
    });
    const returnData = [
      { dateTime: "2025-10-27T09:14:27.828Z", "ca://TEST:PV": 52 },
      { dateTime: "2025-10-27T09:15:17.828Z", "ca://TEST:PV": 45 },
      { dateTime: "2025-10-27T09:17:27.828Z", "ca://TEST:PV": 60 }
    ];
    expect(screen.getByText("loaded: true")).toBeInTheDocument();
    expect(
      screen.getByText(`data: ${returnData.toString()}`)
    ).toBeInTheDocument();
  });
});
