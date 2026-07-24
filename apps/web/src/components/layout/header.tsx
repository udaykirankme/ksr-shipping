"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Search, Menu, Package, FileText, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notificationService, NotificationItem } from "@/lib/notification-service";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Star } from "lucide-react";

export function Header() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      if (isMounted.current && data) {
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 60 seconds polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read_at) {
      try {
        await notificationService.markAsRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsDropdownOpen(false);
    if (notif.target_url) {
      router.push(notif.target_url);
    }
  };

  const handleStarToggle = async (e: React.MouseEvent, notif: NotificationItem) => {
    e.stopPropagation();
    e.preventDefault();
    const newStatus = !notif.is_starred;
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_starred: newStatus } : n));
    try {
      await notificationService.toggleStar(notif.id, newStatus);
    } catch (err) {
      console.error(err);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_starred: !newStatus } : n));
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case "SHIPMENT": return <Package className="w-4 h-4 text-orange-600" />;
      case "QUOTE_REQUEST": return <FileText className="w-4 h-4 text-emerald-600" />;
      case "CONTACT_MESSAGE": return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBg = (type: string) => {
    switch(type) {
      case "SHIPMENT": return "bg-orange-50";
      case "QUOTE_REQUEST": return "bg-emerald-50";
      case "CONTACT_MESSAGE": return "bg-blue-50";
      default: return "bg-gray-50";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-x-4 glass-panel border-b-0 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <button type="button" className="-m-2.5 p-2.5 text-gray-700 md:hidden">
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="h-6 w-px bg-gray-200 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center gap-x-4">
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium">{currentDate}</p>
          </div>
          
          <div className="relative w-full max-w-md ml-auto group">
            <label htmlFor="search-field" className="sr-only">Search</label>
            <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" aria-hidden="true" />
            <input
              id="search-field"
              className="premium-input block h-10 w-full py-0 pl-10 pr-4 sm:text-sm sm:leading-6"
              placeholder="Search tracking number, customer..."
              type="search"
              name="search"
            />
          </div>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          
          {/* Notification Bell Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              type="button" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative transition-colors"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card z-50 overflow-hidden flex flex-col max-h-[80vh] animate-slide-in">
                <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/50">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto overflow-x-hidden flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No notifications yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={cn(
                            "p-4 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3 relative group",
                            !notif.read_at ? "bg-orange-50/30" : ""
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", getBg(notif.type))}>
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0 pr-8">
                            <div className="flex items-center gap-2">
                              <p className={cn("text-sm break-words", !notif.read_at ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
                                {notif.title}
                              </p>
                              {!notif.read_at && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">New</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(notif.created_at)}
                            </p>
                          </div>
                          <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
                            <button 
                              onClick={(e) => handleStarToggle(e, notif)} 
                              className={cn("p-1 rounded-full transition-colors", notif.is_starred ? "text-yellow-400" : "text-gray-300 hover:bg-gray-200")}
                            >
                              <Star className={cn("w-4 h-4", notif.is_starred ? "fill-yellow-400" : "")} />
                            </button>
                            {!notif.read_at && (
                              <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                  <Link 
                    href="/admin/dashboard/notifications" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-x-4">
            <button type="button" className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200 shrink-0 shadow-sm">
                <span className="text-sm font-bold text-orange-600">AD</span>
              </div>
              <span className="hidden lg:flex lg:flex-col lg:items-start lg:ml-3">
                <span className="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  Admin User
                </span>
                <span className="text-xs font-medium text-gray-500 leading-4">Manager</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
