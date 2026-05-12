export type FeatureFlags = {
  enableDynamicScripts: boolean;
};

export type CsWebLibConfig = {
  storeMode: "DEV" | "PROD" | undefined;
  PVWS_SOCKET: string | undefined;
  PVWS_SSL: boolean | undefined;
  THROTTLE_PERIOD: number | undefined;
  defaultMjpgEndpoint: string | undefined;
  csWebLibFeatureFlags: FeatureFlags;
};
