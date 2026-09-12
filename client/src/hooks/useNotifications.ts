import { useEffect, useState } from "react";
import { api } from "../api/client";
import { getSocket } from "../api/socket";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface UnreadCount {
  unreadCount: number;
}

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadUnreadCount() {
      try {
        const response = await api.get<
          ApiResponse<UnreadCount>
        >("/notifications/unread-count");

        if (mounted) {
          setUnreadCount(response.data.data.unreadCount);
        }
      } catch {
        if (mounted) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    const socket = getSocket();

    if (!socket) {
      return () => {
        mounted = false;
      };
    }

    function handleUnreadCount(
      payload: ApiResponse<UnreadCount>,
    ) {
      if (mounted) {
        setUnreadCount(payload.data.unreadCount);
      }
    }

    socket.on(
      "notifications:unread-count",
      handleUnreadCount,
    );

    return () => {
      mounted = false;
      socket.off(
        "notifications:unread-count",
        handleUnreadCount,
      );
    };
  }, []);

  return {
    unreadCount,
  };
}
