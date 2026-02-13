import React, { useEffect, useRef } from "react";
import {
  toast,
  ToastContainer,
  ToastPosition,
  TypeOptions
} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch, useSelector } from "react-redux";
import {
  selectNotifications,
  removeNotificationById,
  NotificationWithId
} from "../../../redux/notificationsSlice";

interface Props {
  position?: ToastPosition;
  autoClose?: number;
  hideProgressBar?: boolean;
  newestOnTop?: boolean;
  closeOnClick?: boolean;
  rtl?: boolean;
  pauseOnFocusLoss?: boolean;
  draggable?: boolean;
  pauseOnHover?: boolean;
}

export const NotificationContainer = (props: Props) => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);

  const displayedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    notifications.forEach((notification: NotificationWithId) => {
      if (!displayedRef.current.has(notification.id)) {
        displayedRef.current.add(notification.id);

        const toastType = (notification.severity || "default") as TypeOptions;

        toast(notification.message, {
          toastId: notification.id,
          type: toastType,
          onClose: () => {
            dispatch(removeNotificationById(notification.id));
          }
        });
      }
    });
  }, [notifications, dispatch]);

  return (
    <ToastContainer
      position={props.position ?? "bottom-right"}
      autoClose={props.autoClose ?? 5000}
      hideProgressBar={props.hideProgressBar ?? false}
      newestOnTop={props.newestOnTop ?? true}
      closeOnClick={props.closeOnClick ?? true}
      rtl={props.rtl ?? false}
      pauseOnFocusLoss={props.pauseOnFocusLoss ?? true}
      draggable={props.draggable ?? true}
      pauseOnHover={props.pauseOnHover ?? true}
    />
  );
};

export default NotificationContainer;
