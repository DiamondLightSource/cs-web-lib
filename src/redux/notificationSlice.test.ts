import { describe, it, expect, vi, beforeEach } from "vitest";
import notificationsReducer, {
  addNotification,
  removeNotificationById,
  selectNotifications,
  selectNotification,
  initialNotificationsState,
  NotificationWithId,
  NotificationStack
} from "./notificationsSlice";
import { TypeOptions } from "react-toastify";

const mockUUID = "123e4567-e89b-12d3-a456-426614174000";
vi.stubGlobal("crypto", {
  randomUUID: () => mockUUID
});

describe("notifications slice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reducers", () => {
    it("should return the initial state", () => {
      // @ts-expect-error - Testing reducer initialisation with undefined action type
      expect(notificationsReducer(undefined, { type: undefined })).toEqual(
        initialNotificationsState
      );
    });

    describe("addNotification", () => {
      it("should add a notification with id and timestamp", () => {
        const notification = {
          message: "Test notification",
          severity: "success" as TypeOptions
        };

        const nextState = notificationsReducer(
          initialNotificationsState,
          addNotification(notification)
        );

        expect(nextState.notifications).toHaveLength(1);
        expect({ ...nextState.notifications[0], timestamp: "" }).toEqual({
          ...notification,
          id: mockUUID,
          timestamp: ""
        });
      });

      it("should add multiple notifications", () => {
        let state = notificationsReducer(
          initialNotificationsState,
          addNotification({
            message: "First notification",
            severity: "info" as TypeOptions
          })
        );

        state = notificationsReducer(
          state,
          addNotification({
            message: "Second notification",
            severity: "error" as TypeOptions
          })
        );

        expect(state.notifications).toHaveLength(2);
        expect(state.notifications[0].message).toBe("First notification");
        expect(state.notifications[1].message).toBe("Second notification");
      });
    });

    describe("removeNotificationById", () => {
      it("should remove a notification by id", () => {
        let state = notificationsReducer(
          initialNotificationsState,
          addNotification({
            message: "Test notification",
            severity: "success" as TypeOptions
          })
        );

        state = notificationsReducer(state, removeNotificationById(mockUUID));

        expect(state.notifications).toHaveLength(0);
      });

      it("should not remove notifications with non-matching ids", () => {
        const state = notificationsReducer(
          initialNotificationsState,
          addNotification({
            message: "Test notification",
            severity: "success" as TypeOptions
          })
        );

        const nextState = notificationsReducer(
          state,
          removeNotificationById("wrong-id")
        );

        expect(nextState.notifications).toHaveLength(1);
      });

      it("should remove only the specified notification when multiple exist", () => {
        const initialState = {
          notifications: [
            {
              id: "1",
              message: "First",
              severity: "info" as TypeOptions,
              timestamp: "2023-01-01T00:00:00Z"
            },
            {
              id: "2",
              message: "Second",
              severity: "error" as TypeOptions,
              timestamp: "2023-01-01T00:00:00Z"
            }
          ]
        };

        const nextState = notificationsReducer(
          initialState,
          removeNotificationById("1")
        );

        expect(nextState.notifications).toHaveLength(1);
        expect(nextState.notifications[0].id).toBe("2");
      });
    });
  });

  describe("selectors", () => {
    describe("selectNotifications", () => {
      it("should select all notifications from state", () => {
        const mockState = {
          notifications: {
            notifications: [
              {
                id: "1",
                message: "Test",
                severity: "info" as TypeOptions,
                timestamp: "2023-01-01T00:00:00Z"
              } as NotificationWithId
            ]
          } as NotificationStack
        };

        const result = selectNotifications(mockState);
        expect(result).toEqual(mockState.notifications.notifications);
      });
    });

    describe("selectNotification", () => {
      it("should select a specific notification by id", () => {
        const notification1: NotificationWithId = {
          id: "1",
          message: "First",
          severity: "info" as TypeOptions,
          timestamp: "2023-01-01T00:00:00Z"
        };
        const notification2: NotificationWithId = {
          id: "2",
          message: "Second",
          severity: "error" as TypeOptions,
          timestamp: "2023-01-01T00:00:00Z"
        };

        const mockState = {
          notifications: {
            notifications: [notification1, notification2]
          }
        };

        const result = selectNotification(mockState, "2");
        expect(result).toEqual(notification2);
      });

      it("should return undefined when notification id does not exist", () => {
        const mockState = {
          notifications: [
            {
              id: "1",
              message: "Test",
              severity: "info" as TypeOptions,
              timestamp: "2023-01-01T00:00:00Z"
            }
          ]
        };

        const result = selectNotification(mockState, "non-existent");
        expect(result).toBeUndefined();
      });
    });
  });
});
