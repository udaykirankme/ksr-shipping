"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, RefreshCw, Star, Package, FileText, MessageSquare, AlertCircle, Trash } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notificationService, NotificationItem } from "@/lib/notification-service";
import { formatDate } from "@/lib/format";
import { DateFilter } from "@/components/dashboard/date-filter";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function NotificationListClient() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Needs Attention");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all-time");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications({
        page,
        limit,
        search,
        status: statusFilter,
        type: typeFilter,
        dateFilter
      });
      setNotifications(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, typeFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setPage(1);
    fetchData();
  };



  const handleStar = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    const newStatus = !currentStatus;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_starred: newStatus } : n));
    try {
      await notificationService.toggleStar(id, newStatus);
    } catch (err) {
      console.error(err);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_starred: currentStatus } : n));
    }
  };

  const handleRowClick = async (notif: NotificationItem) => {
    if (!notif.read_at) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
      } catch (err) {
        console.error(err);
      }
    }
    router.push(`/dashboard/notifications/${notif.id}`);
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      await notificationService.markBulkAsRead(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} notifications?`)) return;
    setLoading(true);
    try {
      await notificationService.deleteBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm("Are you sure you want to delete all read notifications?")) return;
    setLoading(true);
    try {
      await notificationService.deleteAllRead();
      await fetchData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications older than 90 days?")) return;
    setLoading(true);
    try {
      await notificationService.cleanupOld();
      await fetchData();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case "SHIPMENT": return <Package className="w-5 h-5 text-orange-600" />;
      case "QUOTE_REQUEST": return <FileText className="w-5 h-5 text-emerald-600" />;
      case "CONTACT_MESSAGE": return <MessageSquare className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all system alerts and activities</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <Button variant="outline" onClick={handleDeleteAllRead} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            Delete All Read
          </Button>
          <Button variant="outline" onClick={handleCleanup} className="text-gray-600">
            Clear Old (&gt;90d)
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search notifications..." 
                className="pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
              />
            </div>
            <DateFilter value={dateFilter} onChange={(v) => { setDateFilter(v); setPage(1); }} />
          </div>

          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
            {["All", "Needs Attention", "Unread", "Read", "Starred"].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                className={statusFilter === status ? "bg-orange-500 hover:bg-orange-600 text-white rounded-xl" : "bg-white rounded-xl"}
                onClick={() => { setStatusFilter(status); setPage(1); }}
              >
                {status === "Starred" ? <Star className="w-4 h-4 mr-1 fill-current" /> : null}
                {status}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {["All", "QUOTE_REQUEST", "CONTACT_MESSAGE", "SHIPMENT"].map(type => (
            <Button
              key={type}
              variant={typeFilter === type ? "outline" : "ghost"}
              className={cn("text-sm rounded-xl", typeFilter === type ? "bg-gray-100 text-gray-900 border-0 shadow-none hover:bg-gray-200" : "")}
              onClick={() => { setTypeFilter(type); setPage(1); }}
            >
              {type === "All" ? "All Types" : type.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm font-medium text-orange-800">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBulkMarkAsRead} className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
              Mark as Read
            </Button>
            <Button size="sm" onClick={handleBulkDelete} className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    checked={notifications.length > 0 && selectedIds.size === notifications.length}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-16">Type</TableHead>
                <TableHead className="font-semibold text-gray-900">Title</TableHead>
                <TableHead className="font-semibold text-gray-900 hidden md:table-cell">Message</TableHead>
                <TableHead className="font-semibold text-gray-900">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    No notifications found.
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((notif) => (
                  <TableRow 
                    key={notif.id} 
                    className={cn(
                      "hover:bg-gray-50/50 transition-colors cursor-pointer",
                      !notif.read_at ? "bg-orange-50/20" : ""
                    )}
                    onClick={() => handleRowClick(notif)}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        checked={selectedIds.has(notif.id)}
                        onChange={(e) => {
                           if (e.target.checked) {
                             setSelectedIds(prev => new Set([...prev, notif.id]));
                           } else {
                             setSelectedIds(prev => {
                               const next = new Set(prev);
                               next.delete(notif.id);
                               return next;
                             });
                           }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <button onClick={(e) => handleStar(e, notif.id, notif.is_starred)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <Star className={cn("w-5 h-5", notif.is_starred ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        {getIcon(notif.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium", !notif.read_at ? "text-gray-900" : "text-gray-700")}>
                          {notif.title}
                        </span>
                        {!notif.read_at && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">New</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-gray-500 line-clamp-1">{notif.message}</span>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                      {formatDate(notif.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">
            Page {page} of {totalPages} <span className="mx-2 text-gray-300">|</span> {totalItems} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="bg-white"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="bg-white"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
