import { QueuedExecution, ScriptResponse } from "./scriptTypes";

const executionQueue: QueuedExecution[] = [];

export const enqueueScript = (
  dynamicScriptCode: string,
  pvs: { number: number | undefined; string: string | undefined }[],
  resolve: (value: ScriptResponse | PromiseLike<ScriptResponse>) => void,
  reject: (reason?: any) => void
) => {
  if (typeof dynamicScriptCode !== "string") {
    reject(new Error("Invalid script"));
  }

  if (executionQueue.length < 200) {
    executionQueue.push({
      dynamicScriptCode,
      pvs,
      resolve,
      reject
    });
  } else {
    reject(new Error("Iframe script execution queue is full"));
  }
};

export const executeAllScriptsInQueue = (
  executeScriptAsync: (
    dynamicScriptCode: string,
    pvs: { number: number | undefined; string: string | undefined }[]
  ) => Promise<ScriptResponse>
) => {
  for (const item of executionQueue.splice(0)) {
    executeScriptAsync(item.dynamicScriptCode, item.pvs)
      .then(res => {
        try {
          item.resolve(res);
        } catch {}
      })
      .catch(err => {
        try {
          item.reject(err);
        } catch {}
      });
  }
};
