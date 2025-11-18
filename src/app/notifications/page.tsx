"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Filter } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  data: any;
  readAt: Date | null;
  createdAt: Date;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        filter,
        unreadOnly: unreadOnly.toString(),
        page: page.toString(),
        limit: "20",
      });

      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, unreadOnly, page]);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    fetchNotifications();
  }, [session, router, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes("VISA")) return "🛂";
    if (type.includes("TOUR")) return "✈️";
    if (type.includes("PAYMENT")) return "💳";
    if (type.includes("ADMIN")) return "⚙️";
    return "🔔";
  };

  const getFilterLabel = (filter: string) => {
    const labels: Record<string, string> = {
      all: "All",
      visa: "Visas",
      tour: "Tours",
      payment: "Payments",
      system: "System",
    };
    return labels[filter] || filter;
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-soft border border-neutral-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-neutral-600 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <CheckCheck size={16} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center space-x-4 overflow-x-auto">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Filter size={16} className="text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Filter:</span>
            </div>
            {["all", "visa", "tour", "payment", "system"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filter === f
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {getFilterLabel(f)}
              </button>
            ))}
            <button
              onClick={() => {
                setUnreadOnly(!unreadOnly);
                setPage(1);
              }}
              className={`ml-auto px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                unreadOnly
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              Unread only
            </button>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-neutral-100">
            {isLoading ? (
              <div className="p-12 text-center text-neutral-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell size={48} className="mx-auto mb-4 text-neutral-300" />
                <p className="text-neutral-600">
                  {unreadOnly
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-neutral-50 transition-colors cursor-pointer ${
                    !notification.readAt ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className={`text-base font-semibold ${
                              !notification.readAt
                                ? "text-neutral-900"
                                : "text-neutral-700"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-sm text-neutral-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.data && (
                            <div className="mt-2 text-xs text-neutral-500">
                              {notification.data.applicationId && (
                                <span>App ID: {notification.data.applicationId}</span>
                              )}
                              {notification.data.bookingId && (
                                <span>Booking ID: {notification.data.bookingId}</span>
                              )}
                              {notification.data.amount && (
                                <span>Amount: ₹{Number(notification.data.amount).toLocaleString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {!notification.readAt && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="ml-4 p-2 hover:bg-neutral-200 rounded-lg transition-colors"
                            aria-label="Mark as read"
                          >
                            <Check size={18} className="text-neutral-600" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-3">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

