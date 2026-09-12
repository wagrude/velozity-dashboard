import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { getSocket } from "../api/socket";

interface Activity {
  id: number;
  message: string;
  type: string;
  createdAt: string;
}

function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  const loadActivities = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: Activity[] }>("/activities");
      setActivities(response.data.data);
    } catch {
      setActivities([]);
    }
  }, []);

  useEffect(() => {
    loadActivities();

    const socket = getSocket();

    if (!socket) {
      return;
    }

    function handleActivity(
      payload: { success: boolean; data: Activity },
    ) {
      const activity = payload.data;

      setActivities((current) => {
        const exists = current.some(
          (item) => item.id === activity.id,
        );

        if (exists) {
          return current;
        }

        return [activity, ...current].slice(0, 20);
      });
    }

    socket.on("activity:new", handleActivity);

    return () => {
      socket.off("activity:new", handleActivity);
    };
  }, [loadActivities]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Recent Activity</h2>
      </div>

      {activities.length === 0 ? (
        <p className="empty-state">No recent activity.</p>
      ) : (
        activities.map((activity) => (
          <div className="activity-row" key={activity.id}>
            <div>
              <strong>
                {activity.type.replaceAll("_", " ")}
              </strong>
              <p>{activity.message}</p>
            </div>

            <span>
              {new Date(activity.createdAt).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </section>
  );
}

export default ActivityFeed;
