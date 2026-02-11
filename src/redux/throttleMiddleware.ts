import { MiddlewareAPI, Middleware } from "@reduxjs/toolkit";
import { valueChanged, valuesChanged } from "./csState";

export class UpdateThrottle {
  private queue: ReturnType<typeof valueChanged>[];
  private started: boolean;
  private updateMillis: number;

  constructor(updateMillis: number) {
    this.queue = [];
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
    this.queue.push(action);
  }

  public sendQueue(store: MiddlewareAPI): void {
    if (this.queue.length > 0) {
      store.dispatch(valuesChanged([...this.queue]));
      this.queue = [];
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
    } else {
      return next(action);
    }
  };
