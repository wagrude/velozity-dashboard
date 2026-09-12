import { useEffect, useState } from "react";
import { api } from "../api/client";

interface NotificationItem {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    api
      .get<NotificationItem[]>("/notifications")
      .then((response) => setNotifications(response.data))
      .catch(() => setNotifications([]));
  }, []);

  const unread = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <section className="panel notification-panel">
      <div className="panel-header">
        <h2>
          Notifications
          {unread > 0 && <span className="notification-badge">{unread}</span>}
        </h2>
      </div>

      {notifications.length === 0 ? (
        <p className="empty-state">No notifications.</p>
      ) : (
        notifications.slice(0, 8).map((notification) => (
          <div
            className={`notification-row ${
              notification.isRead ? "" : "unread"
            }`}
            key={notification.id}
          >
            <p>{notification.message}</p>
            <span>
              {new Date(notification.createdAt).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </section>
  );
}

export default Notifications;

