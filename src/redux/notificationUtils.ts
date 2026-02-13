import { Dispatch } from "react";
import { addNotification, Notification } from "./notificationsSlice";

export const notificationDispatcher = (dispatch: Dispatch<any>) => {
  const showNotification = (notification: Notification) => {
    dispatch(addNotification(notification));
  };

  const showSuccess = (message: string) => {
    showNotification({ message, severity: "success" });
  };

  const showError = (message: string) => {
    showNotification({ message, severity: "error" });
  };

  const showWarning = (message: string) => {
    showNotification({ message, severity: "warning" });
  };

  const showInfo = (message: string) => {
    showNotification({ message, severity: "info" });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
