import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import NotificationContainer from "./notificationContainer";
import * as notificationsSlice from "../../../redux/notificationsSlice";
import { NotificationWithId } from "../../../redux/notificationsSlice";

import { toast, ToastContainer } from "react-toastify";

vi.mock("react-toastify", () => ({
  toast: vi.fn(),
  ToastContainer: vi.fn(() => <div data-testid="toast-container" />),
  TypeOptions: {
    DEFAULT: "default",
    INFO: "info",
    SUCCESS: "success",
    WARNING: "warning",
    ERROR: "error"
  }
}));

describe("NotificationContainer", () => {
  let store: any;
  let mockState: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockState = {
      notifications: [
        { id: "1", message: "Test notification 1", severity: "success" },
        { id: "2", message: "Test notification 2", severity: "error" }
      ]
    };

    vi.spyOn(notificationsSlice, "selectNotifications").mockImplementation(
      () => mockState.notifications
    );

    vi.spyOn(notificationsSlice, "removeNotificationById").mockImplementation(
      id => ({
        type: "notifications/removeNotificationById",
        payload: id
      })
    );

    store = configureStore({
      reducer: {
        notifications: (state = mockState) => state
      }
    });

    store.dispatch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders ToastContainer with default props", () => {
    render(
      <Provider store={store}>
        <NotificationContainer />
      </Provider>
    );

    expect(screen.getByTestId("toast-container")).toBeInTheDocument();

    expect(ToastContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        newestOnTop: true,
        closeOnClick: true,
        rtl: false,
        pauseOnFocusLoss: true,
        draggable: true,
        pauseOnHover: true
      }),
      expect.anything()
    );
  });

  it("renders ToastContainer with custom props", () => {
    render(
      <Provider store={store}>
        <NotificationContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={false}
          rtl={true}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover={false}
        />
      </Provider>
    );

    expect(screen.getByTestId("toast-container")).toBeInTheDocument();

    expect(ToastContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        newestOnTop: false,
        closeOnClick: false,
        rtl: true,
        pauseOnFocusLoss: false,
        draggable: false,
        pauseOnHover: false
      }),
      expect.anything()
    );
  });

  it("displays notifications from redux store", () => {
    render(
      <Provider store={store}>
        <NotificationContainer />
      </Provider>
    );

    expect(toast).toHaveBeenCalledTimes(2);
    expect(toast).toHaveBeenCalledWith("Test notification 1", {
      toastId: "1",
      type: "success",
      onClose: expect.any(Function)
    });
    expect(toast).toHaveBeenCalledWith("Test notification 2", {
      toastId: "2",
      type: "error",
      onClose: expect.any(Function)
    });
  });

  it("removes notification when toast is closed", () => {
    render(
      <Provider store={store}>
        <NotificationContainer />
      </Provider>
    );

    const onCloseCallback = (toast as any).mock.calls[0][1].onClose;
    onCloseCallback();

    expect(store.dispatch).toHaveBeenCalledWith(
      notificationsSlice.removeNotificationById("1")
    );
  });

  it("does not display duplicate notifications within the same render cycle", () => {
    const duplicateNotifications = [
      { id: "1", message: "Test notification 1", severity: "success" },
      { id: "1", message: "Test notification 1", severity: "success" } // Same ID
    ] as NotificationWithId[];

    vi.spyOn(notificationsSlice, "selectNotifications").mockReturnValue(
      duplicateNotifications
    );

    render(
      <Provider store={store}>
        <NotificationContainer />
      </Provider>
    );

    expect(toast).toHaveBeenCalledTimes(1);
  });

  it("handles notifications with default severity", () => {
    vi.spyOn(notificationsSlice, "selectNotifications").mockReturnValue([
      { id: "3", message: "No severity notification" }
    ] as NotificationWithId[]);

    render(
      <Provider store={store}>
        <NotificationContainer />
      </Provider>
    );

    expect(toast).toHaveBeenCalledWith("No severity notification", {
      toastId: "3",
      type: "default",
      onClose: expect.any(Function)
    });
  });
});
