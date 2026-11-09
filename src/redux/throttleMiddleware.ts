import { MiddlewareAPI, Middleware } from "@reduxjs/toolkit";
import {
  connectionChanged,
  connectionsChanged,
  valueChanged,
  valuesChanged
} from "./csState";
import { mergeDType } from "../types/dtypes";

export class UpdateThrottle {
  private queue: Map<string, ReturnType<typeof valueChanged>>;
  private connQueue: Map<string, ReturnType<typeof connectionChanged>> =
    new Map();
  private started: boolean;
  private updateMillis: number;

  constructor(updateMillis: number) {
    this.queue = new Map();
    this.started = false;
    this.updateMillis = updateMillis;
  }

  public queueUpdate(
    action: ReturnType<typeof valueChanged>,
    store: MiddlewareAPI
  ): void {
    if (!this.started) {
      setInterval(() => this.sendQueue(store), this.updateMillis);
      this.started = true;
    }
    const { pvName, value } = action.payload;
    const queued = this.queue.get(pvName);
    if (queued) {
      // Merge so that metadata from an earlier update in the same batch is kept.
      const prev = queued.payload.value;
      const merged = {
        ...mergeDType(prev, value),
        partial: prev.partial && value.partial
      };
      this.queue.set(pvName, valueChanged({ pvName, value: merged }));
    } else {
      this.queue.set(pvName, action);
    }
  }

  public queueConnection(
    action: ReturnType<typeof connectionChanged>,
    store: MiddlewareAPI
  ): void {
    if (!this.started) {
      setInterval(() => this.sendQueue(store), this.updateMillis);
      this.started = true;
    }
    const prev = this.connQueue.get(action.payload.pvName);
    const readonly =
      action.payload.value.isReadonly ?? prev?.payload.value.isReadonly;
    this.connQueue.set(
      action.payload.pvName,
      connectionChanged({
        pvName: action.payload.pvName,
        value: {
          isConnected: action.payload.value.isConnected,
          isReadonly: readonly
        }
      })
    );
  }

  public sendQueue(store: MiddlewareAPI): void {
    if (this.connQueue.size > 0) {
      store.dispatch(connectionsChanged([...this.connQueue.values()]));
      this.connQueue = new Map();
    }
    if (this.queue.size > 0) {
      store.dispatch(valuesChanged([...this.queue.values()]));
      this.queue = new Map();
    }
  }
}

export const throttleMiddleware =
  (updater: UpdateThrottle): Middleware =>
  (
    store
    // next(action) returns the action, but in the case of a value being cached,
    // we don't call next(action) so return undefined.
  ) =>
  next =>
  action => {
    if (valueChanged.match(action)) {
      updater.queueUpdate(action, store);
    } else if (connectionChanged.match(action)) {
      updater.queueConnection(action, store);
    } else {
      return next(action);
    }
  };
