import {
  Action,
  ValueChanged,
  valueChangedAction,
  VALUES_CHANGED
} from "./actions";
import { MiddlewareAPI, Middleware } from "@reduxjs/toolkit";

export class UpdateThrottle {
  private queue: Action[];
  private started: boolean;
  private updateMillis: number;

  constructor(updateMillis: number) {
    this.queue = [];
    this.started = false;
    this.updateMillis = updateMillis;
  }

  public queueUpdate(action: Action, store: MiddlewareAPI): void {
    if (!this.started) {
      setInterval(() => this.sendQueue(store), this.updateMillis);
      this.started = true;
    }
    this.queue.push(action);
  }

  public sendQueue(store: MiddlewareAPI): void {
    if (this.queue.length > 0) {
      store.dispatch({ type: VALUES_CHANGED, payload: [...this.queue] });
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
    if (valueChangedAction.match(action)) {
      updater.queueUpdate(action as ValueChanged, store);
    } else {
      return next(action);
    }
  };
