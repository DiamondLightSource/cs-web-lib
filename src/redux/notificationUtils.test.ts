import { describe, it, expect, vi } from "vitest";
import { notificationDispatcher } from "./notificationUtils";
import { addNotification } from "./notificationsSlice";

vi.mock("./notificationsSlice", () => ({
  addNotification: vi.fn(notification => ({
    type: "notifications/addNotification",
    payload: notification
  }))
}));

describe("notificationDispatcher", () => {
  const mockDispatch = vi.fn();
  const dispatcher = notificationDispatcher(mockDispatch);

  beforeEach(() => {
    mockDispatch.mockClear();
    vi.mocked(addNotification).mockClear();
  });

  it("should create a dispatcher object with the correct methods", () => {
    expect(dispatcher).toHaveProperty("showSuccess");
    expect(dispatcher).toHaveProperty("showError");
    expect(dispatcher).toHaveProperty("showWarning");
    expect(dispatcher).toHaveProperty("showInfo");

    expect(typeof dispatcher.showSuccess).toBe("function");
    expect(typeof dispatcher.showError).toBe("function");
    expect(typeof dispatcher.showWarning).toBe("function");
    expect(typeof dispatcher.showInfo).toBe("function");
  });

  it("should dispatch success notification with correct parameters", () => {
    const message = "Operation successful";
    dispatcher.showSuccess(message);

    expect(addNotification).toHaveBeenCalledWith({
      message,
      severity: "success"
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "notifications/addNotification",
      payload: { message, severity: "success" }
    });
  });

  it("should dispatch error notification with correct parameters", () => {
    const message = "An error occurred";
    dispatcher.showError(message);

    expect(addNotification).toHaveBeenCalledWith({
      message,
      severity: "error"
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "notifications/addNotification",
      payload: { message, severity: "error" }
    });
  });

  it("should dispatch warning notification with correct parameters", () => {
    const message = "This is a warning";
    dispatcher.showWarning(message);

    expect(addNotification).toHaveBeenCalledWith({
      message,
      severity: "warning"
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "notifications/addNotification",
      payload: { message, severity: "warning" }
    });
  });

  it("should dispatch info notification with correct parameters", () => {
    const message = "For your information";
    dispatcher.showInfo(message);

    expect(addNotification).toHaveBeenCalledWith({
      message,
      severity: "info"
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "notifications/addNotification",
      payload: { message, severity: "info" }
    });
  });
});
