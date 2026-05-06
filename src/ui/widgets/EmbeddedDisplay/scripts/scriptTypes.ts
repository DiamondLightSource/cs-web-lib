export interface ScriptResponse {
  functionReturnValue: any;
  widgetProps: {
    [key: string]: any;
  };
}

export type QueuedExecution = {
  dynamicScriptCode: string;
  pvs: { number: number | undefined; string: string | undefined }[];
  resolve: (value: ScriptResponse) => void;
  reject: (reason: any) => void;
};
