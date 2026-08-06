"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Package, FileText, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { notificationService, NotificationItem } from "@/lib/notification-service";
import { formatDate } from "@/lib/format";

export function RecentNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications({ limit: 5 });
      if (isMounted.current && data) {
        setNotifications(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case "shipment": return <Package className="w-4 h-4 text-orange-600" />;
      case "quote": return <FileText className="w-4 h-4 text-emerald-600" />;
      case "message": return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBg = (type: string) => {
    switch(type) {
      case "shipment": return "bg-orange-50";
      case "quote": return "bg-emerald-50";
      case "message": return "bg-blue-50";
      default: return "bg-gray-50";
    }
  };

  return (
    <Card className="h-full rounded-2xl border border-orange-100/50 shadow-[0_4px_20px_rgba(255,106,0,0.05)] hover:shadow-[0_4px_25px_rgba(255,106,0,0.15)] transition-all duration-300 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex justify-between items-center">
          Recent Notifications
          <button onClick={handleMarkAllAsRead} className="text-xs text-orange-600 font-medium hover:text-orange-700 transition-colors">
            Mark all as read
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={cn(
                  "flex gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer",
                  !notification.read_at ? "bg-orange-50/30" : ""
                )}
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", getBg(notification.type))}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className={cn("text-sm", !notification.read_at ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatDate(notification.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900">All caught up!</h3>
            <p className="text-sm text-gray-500 mt-1">You have no new notifications.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
