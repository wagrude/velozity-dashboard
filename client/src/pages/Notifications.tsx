import { useEffect, useState } from "react";
import { api } from "../api/client";
import { getSocket } from "../api/socket";

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface UnreadCount {
  unreadCount: number;
}

function Notifications() {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const [listResponse, countResponse] = await Promise.all([
        api.get<ApiResponse<NotificationItem[]>>(
          "/notifications",
        ),
        api.get<ApiResponse<UnreadCount>>(
          "/notifications/unread-count",
        ),
      ]);

      setNotifications(listResponse.data.data);
      setUnreadCount(countResponse.data.data.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    const socket = getSocket();

    if (!socket) {
      return;
    }

    function handleNewNotification(
      payload: ApiResponse<NotificationItem>,
    ) {
      const notification = payload.data;

      setNotifications((current) => {
        if (
          current.some(
            (item) => item.id === notification.id,
          )
        ) {
          return current;
        }

        return [notification, ...current];
      });
    }

    function handleUnreadCount(
      payload: ApiResponse<UnreadCount>,
    ) {
      setUnreadCount(payload.data.unreadCount);
    }

    socket.on("notification:new", handleNewNotification);
    socket.on(
      "notifications:unread-count",
      handleUnreadCount,
    );

    return () => {
      socket.off(
        "notification:new",
        handleNewNotification,
      );
      socket.off(
        "notifications:unread-count",
        handleUnreadCount,
      );
    };
  }, []);

  async function markRead(id: number) {
    try {
      const response = await api.patch<
        ApiResponse<NotificationItem>
      >(`/notifications/${id}/read`);

      const updated = response.data.data;

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? updated
            : notification,
        ),
      );

      setUnreadCount((current) =>
        updated.isRead && current > 0
          ? current - 1
          : current,
      );
    } catch {
      return;
    }
  }

  async function markAllRead() {
    try {
      await api.patch<
        ApiResponse<{ markedAllRead: boolean }>
      >("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch {
      return;
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>
            {unreadCount} unread notification
            {unreadCount === 1 ? "" : "s"}.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="secondary-button"
            onClick={markAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <section className="panel">
        {loading && (
          <p className="empty-state">
            Loading notifications...
          </p>
        )}

        {!loading && notifications.length === 0 && (
          <p className="empty-state">
            No notifications yet.
          </p>
        )}

        {!loading &&
          notifications.map((notification) => (
            <div
              className={`notification-row ${
                notification.isRead ? "read" : "unread"
              }`}
              key={notification.id}
            >
              <div>
                <strong>{notification.type}</strong>
                <p>{notification.message}</p>
                <span>
                  {new Date(
                    notification.createdAt,
                  ).toLocaleString()}
                </span>
              </div>

              {!notification.isRead && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    markRead(notification.id)
                  }
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
      </section>
    </div>
  );
}

export default Notifications;
