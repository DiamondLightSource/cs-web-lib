import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface NotificationStack {
  notifications: NotificationWithId[];
}

export interface Notification {
  message: string;
  severity: "success" | "warning" | "error" | "info";
}

export interface NotificationWithId extends Notification {
  id: string;
  timestamp: string;
}

export const initialNotificationsState: NotificationStack = {
  notifications: []
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: initialNotificationsState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.push({
        ...action.payload,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      });
    },
    removeNotificationById(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      );
    }
  },
  selectors: {
    selectNotifications: (
      notifications: NotificationStack
    ): NotificationWithId[] => notifications.notifications
  }
});

export const { addNotification, removeNotificationById } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
export const { selectNotifications } = notificationsSlice.selectors;

export const selectNotification = createSelector(
  [selectNotifications, (_state, id: string) => id],
  (notifications, id) => notifications.find(x => x.id === id)
);
