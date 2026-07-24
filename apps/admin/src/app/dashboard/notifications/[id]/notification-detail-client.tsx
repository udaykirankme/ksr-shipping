"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, ExternalLink, RefreshCw, Package, FileText, MessageSquare, AlertCircle, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notificationService, NotificationItem } from "@/lib/notification-service";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const data = await notificationService.getNotification(id);
        
        // Auto mark as read on open
        if (!data.read_at) {
          await notificationService.markAsRead(id);
          data.read_at = new Date().toISOString();
        }
        
        if (mounted) setNotification(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [id]);

  const handleStar = async () => {
    if (!notification) return;
    const newStatus = !notification.is_starred;
    setNotification(prev => prev ? { ...prev, is_starred: newStatus } : null);
    try {
      await notificationService.toggleStar(notification.id, newStatus);
    } catch (err) {
      console.error(err);
      setNotification(prev => prev ? { ...prev, is_starred: !newStatus } : null);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case "SHIPMENT": return <Package className="w-8 h-8 text-orange-600" />;
      case "QUOTE_REQUEST": return <FileText className="w-8 h-8 text-emerald-600" />;
      case "CONTACT_MESSAGE": return <MessageSquare className="w-8 h-8 text-blue-600" />;
      default: return <AlertCircle className="w-8 h-8 text-gray-600" />;
    }
  };

  const getBg = (type: string) => {
    switch(type) {
      case "SHIPMENT": return "bg-orange-50 border-orange-100";
      case "QUOTE_REQUEST": return "bg-emerald-50 border-emerald-100";
      case "CONTACT_MESSAGE": return "bg-blue-50 border-blue-100";
      default: return "bg-gray-50 border-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Notification not found</h2>
        <p className="text-gray-500 mt-2">The notification you're looking for doesn't exist.</p>
        <Link href="/dashboard/notifications">
          <Button className="mt-6">Back to Notifications</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/notifications">
          <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              if (!window.confirm("Are you sure you want to delete this notification?")) return;
              try {
                await notificationService.deleteNotification(notification.id);
                router.push("/dashboard/notifications");
              } catch (err) {
                console.error(err);
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <Button 
            variant="outline" 
            onClick={handleStar}
            className={cn("gap-2", notification.is_starred ? "text-yellow-600 bg-yellow-50 border-yellow-200" : "")}
          >
            <Star className={cn("w-4 h-4", notification.is_starred ? "fill-yellow-500 text-yellow-500" : "")} />
            {notification.is_starred ? "Starred" : "Star"}
          </Button>
          
          {notification.target_url && (
            <Button onClick={() => router.push(notification.target_url!)} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
              <ExternalLink className="w-4 h-4" />
              Respond / Open
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={cn("p-6 sm:p-8 flex items-start gap-6 border-b", getBg(notification.type))}>
          <div className="bg-white rounded-full p-4 shadow-sm shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-white/60 font-medium">
                {notification.type.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-gray-500 font-medium">
                {formatDate(notification.created_at)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {notification.title}
            </h1>
          </div>
        </div>
        
        <div className="p-6 sm:p-8">
          <div className="prose max-w-none text-gray-700">
            <p className="whitespace-pre-wrap text-lg leading-relaxed">{notification.message}</p>
          </div>
        </div>
        
        <div className="bg-gray-50/50 p-6 sm:p-8 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-gray-900">Read</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Notification ID</p>
            <p className="font-medium text-gray-900 font-mono mt-1">{notification.id}</p>
          </div>
          {notification.related_entity_id && (
            <div>
              <p className="text-sm text-gray-500">Related ID</p>
              <p className="font-medium text-gray-900 font-mono mt-1">{notification.related_entity_id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
