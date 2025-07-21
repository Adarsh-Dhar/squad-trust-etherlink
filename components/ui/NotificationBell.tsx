"use client";
import { useEffect, useState } from "react";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchNotifications = () => {
    fetch("/api/notifications/me")
      .then((res) => res.json())
      .then(setNotifications);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAction = async (n: any, action: "accept" | "reject") => {
    const { teamId, joinRequestId } = n.data;
    // Optimistically remove notification
    setNotifications((prev: any) => prev.filter((notif: any) => notif.id !== n.id));
    try {
      const res = await fetch(`/api/teams/${teamId}/join-requests/${joinRequestId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 400 && err.error === "Invalid join request") {
          setToast("This join request has already been handled.");
        } else {
          setToast(err.error || "Failed to process join request.");
        }
        // Re-fetch notifications to stay in sync
        fetchNotifications();
      }
    } catch (e) {
      setToast("Network error. Please try again.");
      fetchNotifications();
    }
  };

  return (
    <div className="relative">
      <button className="relative" onClick={() => setOpen((o) => !o)}>
        <span className="material-icons">notifications</span>
        {notifications.some((n: any) => !n.read) && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-10">
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500">No notifications</div>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className="p-4 border-b last:border-b-0">
                {n.type === "join_request" && (
                  <div>
                    <div>New join request for team {n.data.teamId}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs"
                        onClick={() => handleAction(n, "accept")}
                      >
                        Accept
                      </button>
                      <button
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                        onClick={() => handleAction(n, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in">
          {toast}
          <button className="ml-4 text-xs underline" onClick={() => setToast(null)}>Close</button>
        </div>
      )}
    </div>
  );
} 