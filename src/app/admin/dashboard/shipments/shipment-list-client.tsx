"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, RefreshCw, ArchiveRestore, Trash2, Download, History, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { shipmentService } from "@/lib/shipment-service";
import { formatCurrency, formatDate } from "@/lib/format";
import { useConfirm } from "@/components/ui/confirm-modal";

interface ShipmentData {
  id: string;
  tracking_id: string;
  official_tracking_id?: string;
  sender_name: string;
  sender_city?: string;
  recipient_name: string;
  recipient_city?: string;
  origin: string;
  destination: string;
  current_status: string;
  created_at: string;
  total_cost: number;
  is_active: boolean;
  receiver_name?: string;
  receiver_city?: string;
  service?: string;
  courier?: string;
  medium?: string;
  booked_date: string;
  profit?: number;
  [key: string]: unknown;
}

export function ShipmentListClient({
  initialShipments = [],
  initialTotal = 0,
}: {
  initialShipments?: ShipmentData[];
  initialTotal?: number;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const hasInitialData = initialShipments.length > 0 || initialTotal > 0;
  const [shipments, setShipments] = useState<ShipmentData[]>(initialShipments);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(!hasInitialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState(true);
  const [olderThan31Days, setOlderThan31Days] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  
  const limit = 50;
  const [page, setPage] = useState(1);
  const hasMore = shipments.length < total;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const skipInitialFetch = useRef(hasInitialData);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    if (exportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [exportOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let mounted = true;

    if (
      skipInitialFetch.current &&
      !debouncedSearch &&
      !statusFilter &&
      isActiveFilter &&
      !olderThan31Days
    ) {
      skipInitialFetch.current = false;
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await shipmentService.getShipments({
          page: 1,
          limit,
          search: debouncedSearch,
          status: statusFilter,
          isActive: isActiveFilter,
          olderThan31Days
        });
        if (mounted) {
          const resData = data as any;
          setShipments(resData.shipments || []);
          setTotal(resData.total || 0);
          setPage(1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { mounted = false; };
  }, [statusFilter, isActiveFilter, olderThan31Days, debouncedSearch]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await shipmentService.getShipments({
        page: nextPage,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        isActive: isActiveFilter,
        olderThan31Days
      });
      const resData = data as any;
      const newItems: ShipmentData[] = resData.shipments || [];
      if (newItems.length > 0) {
        setShipments(prev => {
          const existing = new Set(prev.map(s => s.id));
          const unique = newItems.filter(s => !existing.has(s.id));
          return [...prev, ...unique];
        });
        setPage(nextPage);
      }
      setTotal(resData.total ?? total);
    } catch (err) {
      console.error("Failed to load more shipments:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, limit, debouncedSearch, statusFilter, isActiveFilter, olderThan31Days, total]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { 
        root: scrollContainerRef.current,
        rootMargin: "300px" 
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading, loadingMore]);

  // Provide manual refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await shipmentService.getShipments({
        page: 1,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        isActive: isActiveFilter,
        olderThan31Days
      });
      const resData = data as any;
      setShipments(resData.shipments || []);
      setTotal(resData.total || 0);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirm("Are you sure you want to permanently delete this shipment? This action cannot be undone."))) return;
    try {
      await shipmentService.deleteShipment(id);
      await handleRefresh();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete');
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(shipments.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!(await confirm(`Delete ${selectedIds.size} shipments permanently?\n\nThis action cannot be undone.`))) return;
    setLoading(true);
    try {
      await shipmentService.deleteBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
      await handleRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete selected records.");
      setLoading(false);
    }
  };


  const handleExport = async (type: 'current_month' | 'last_month') => {
    try {
      const now = new Date();
      let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      if (type === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      await shipmentService.exportShipments({
        search: debouncedSearch,
        status: statusFilter,
        isActive: isActiveFilter,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }, type);
    } catch (err) {
      console.error(err);
      alert('Failed to export shipments');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4 sm:space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Shipments</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage and track all logistics operations</p>
        </div>

        <div className="flex items-center justify-start sm:justify-end gap-2 sm:gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsActiveFilter(!isActiveFilter)} 
            className="gap-1.5 shrink-0 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
            title={isActiveFilter ? "Viewing Active shipments. Click to view inactive." : "Viewing Inactive shipments. Click to view active."}
          >
            {isActiveFilter ? <ArchiveRestore className="w-4 h-4 shrink-0" /> : <Filter className="w-4 h-4 shrink-0" />}
            <span className="hidden xl:inline">{isActiveFilter ? 'View Inactive' : 'View Active'}</span>
            <span className="hidden sm:inline xl:hidden">{isActiveFilter ? 'Inactive' : 'Active'}</span>
            <span className="sm:hidden">{isActiveFilter ? 'Inactive' : 'Active'}</span>
          </Button>

          <Button 
            variant={olderThan31Days ? "default" : "outline"}
            size="sm"
            onClick={() => { setOlderThan31Days(!olderThan31Days); setPage(1); }} 
            className={`gap-1.5 shrink-0 h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm ${olderThan31Days ? 'bg-orange-500 hover:bg-orange-600 text-white border-transparent' : ''}`}
            title="Toggle shipments older than 31 days"
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="hidden xl:inline">Older than 31 days</span>
            <span className="hidden sm:inline xl:hidden">&gt; 31d</span>
            <span className="sm:hidden">&gt; 31d</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh} 
            className="shrink-0 h-9 sm:h-10 px-2.5 sm:px-3"
            title="Refresh shipments"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <div ref={exportRef} className="relative shrink-0">
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => setExportOpen((prev) => !prev)}
              className="gap-1 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 border-orange-200 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm select-none"
              aria-expanded={exportOpen}
              aria-haspopup="true"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export</span>
              <span className={`text-[10px] sm:text-xs transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`}>▼</span>
            </Button>
            {exportOpen && (
              <>
                {/* Desktop dropdown */}
                <div className="hidden sm:block absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg transition-all z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <button 
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      handleExport('current_month');
                    }} 
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 text-gray-700 transition-colors flex items-center justify-between"
                  >
                    <span>Current Month</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      handleExport('last_month');
                    }} 
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 text-gray-700 transition-colors flex items-center justify-between border-t border-gray-50"
                  >
                    <span>Last Month</span>
                  </button>
                </div>

                {/* Mobile Bottom Sheet Modal */}
                <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
                  <div 
                    className="fixed inset-0 -z-10" 
                    onClick={() => setExportOpen(false)}
                  />
                  <div className="bg-white rounded-t-3xl p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200 border-t border-gray-100">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-orange-500" />
                        <h3 className="font-bold text-gray-900 text-base">Export Shipments</h3>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setExportOpen(false)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 pt-1">
                      <button 
                        type="button"
                        onClick={() => {
                          setExportOpen(false);
                          handleExport('current_month');
                        }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/50 hover:bg-orange-100/60 active:bg-orange-100 text-orange-950 font-semibold text-sm transition-colors border border-orange-100"
                      >
                        <span className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span>Current Month</span>
                        </span>
                        <span className="text-xs text-orange-600 font-medium">Excel (.xlsx)</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                          setExportOpen(false);
                          handleExport('last_month');
                        }}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-100 text-gray-800 font-semibold text-sm transition-colors border border-gray-100"
                      >
                        <span className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span>Last Month</span>
                        </span>
                        <span className="text-xs text-gray-500 font-medium">Excel (.xlsx)</span>
                      </button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setExportOpen(false)}
                      className="w-full h-11 rounded-2xl text-gray-600 font-medium mt-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Link href="/admin/dashboard/shipments/new" className="inline-block shrink-0">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 sm:gap-2 px-3 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-semibold sm:font-medium">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">Create Shipment</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
          <Input 
            placeholder="Search tracking, names, phones, service..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
          />
        </div>
        <div className="min-w-[200px]">
          <PremiumSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Non-delivered', value: 'Non-delivered' },
              { label: 'Shipment Created', value: 'Shipment Created' },
              { label: 'Picked Up', value: 'Picked Up' },
              { label: 'Dispatched', value: 'Dispatched' },
              { label: 'In Transit', value: 'In Transit' },
              { label: 'Out For Delivery', value: 'Out For Delivery' },
              { label: 'Delivered', value: 'Delivered' }
            ]}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 shrink-0">
          <span className="text-sm font-medium text-orange-800">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setSelectedIds(new Set())} className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
              Cancel Selection
            </Button>
            <Button size="sm" onClick={handleBulkDelete} className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table Box */}
      <div className="bg-white border border-gray-100/80 rounded-2xl shadow-sm relative flex flex-col flex-1 min-h-0 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-30 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
        
        {/* Scrollable container for the table rows inside the box */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-auto max-h-[calc(100vh-275px)]"
        >
          <table className="w-full caption-bottom text-sm border-collapse">
            <thead className="sticky top-0 z-20 shadow-xs border-b border-gray-200">
              <tr className="bg-gray-50/95 backdrop-blur-xs">
                <th className="w-9 px-2.5 py-3.5 text-center sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    checked={shipments.length > 0 && selectedIds.size === shipments.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="font-semibold text-gray-900 whitespace-nowrap px-3 py-3.5 text-left text-xs uppercase tracking-wider sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">Tracking Info</th>
                <th className="font-semibold text-gray-900 whitespace-nowrap px-3 py-3.5 text-left text-xs uppercase tracking-wider sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">Sender</th>
                <th className="font-semibold text-gray-900 whitespace-nowrap px-3 py-3.5 text-left text-xs uppercase tracking-wider sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">Receiver</th>
                <th className="font-semibold text-gray-900 whitespace-nowrap px-2.5 py-3.5 text-left text-xs uppercase tracking-wider sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">Service</th>
                <th className="font-semibold text-gray-900 whitespace-nowrap px-2.5 py-3.5 text-left text-xs uppercase tracking-wider sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">Status</th>
                <th className="font-semibold text-gray-900 whitespace-nowrap px-2.5 py-3.5 text-left text-xs uppercase tracking-wider sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">Booked Date</th>
                <th className="font-semibold text-gray-900 text-right whitespace-nowrap px-2.5 py-3.5 text-xs uppercase tracking-wider sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">Profit</th>
                <th className="w-12 font-semibold text-gray-900 text-center whitespace-nowrap px-2 py-3.5 text-xs uppercase tracking-wider sticky top-0 bg-gray-50/95 z-20 border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {shipments.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p>No shipments found</p>
                    </div>
                  </td>
                </tr>
              )}
              {shipments.map((shipment) => (
                <tr 
                  key={shipment.id} 
                  className="group hover:bg-orange-50/30 transition-colors cursor-pointer border-b border-gray-100/80" 
                  onClick={() => router.push(`/admin/dashboard/shipments/${shipment.id}`)}
                  onMouseEnter={() => router.prefetch(`/admin/dashboard/shipments/${shipment.id}`)}
                >
                  <td className="w-9 text-center px-2.5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                      checked={selectedIds.has(shipment.id)}
                      onChange={(e) => {
                         if (e.target.checked) {
                           setSelectedIds(prev => new Set([...prev, shipment.id]));
                         } else {
                           setSelectedIds(prev => {
                             const next = new Set(prev);
                             next.delete(shipment.id);
                             return next;
                           });
                         }
                      }}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-gray-900 hover:text-orange-600 transition-colors text-xs sm:text-sm">{shipment.tracking_id}</span>
                      {shipment.official_tracking_id && (
                        <span className="text-[11px] text-gray-400 font-normal">{shipment.official_tracking_id}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 max-w-[140px] md:max-w-[160px] lg:max-w-[190px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate block" title={shipment.sender_name}>{shipment.sender_name || 'N/A'}</span>
                      <span className="text-[11px] text-gray-500 truncate block" title={shipment.sender_city}>{shipment.sender_city || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 max-w-[150px] md:max-w-[170px] lg:max-w-[200px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate block" title={shipment.receiver_name}>{shipment.receiver_name || 'N/A'}</span>
                      <span className="text-[11px] text-gray-500 truncate block" title={shipment.receiver_city}>{shipment.receiver_city || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-3.5">
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm uppercase font-semibold text-gray-800">{shipment.service || shipment.courier || 'N/A'}</span>
                      {Boolean(shipment.medium) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wider">
                          {String(shipment.medium)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-3.5">
                    <Badge variant={shipment.current_status === 'Delivered' ? 'success' : shipment.current_status === 'Shipment Created' ? 'default' : 'warning'} className="text-[11px] px-2 py-0.5 font-medium">
                      {shipment.current_status}
                    </Badge>
                  </td>
                  <td className="text-xs sm:text-sm text-gray-600 whitespace-nowrap px-2.5 py-3.5">
                    {formatDate(shipment.booked_date)}
                  </td>
                  <td className="text-right font-bold text-gray-900 whitespace-nowrap px-2.5 py-3.5 text-xs sm:text-sm">
                    {formatCurrency(shipment.profit || 0)}
                  </td>
                  <td className="w-12 whitespace-nowrap px-2 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer" onClick={(e) => handleDelete(shipment.id, e)} title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Continuous Scroll Sentinel & Status inside scroll container */}
          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="py-4 flex items-center justify-center gap-2 text-sm text-gray-500 border-t border-gray-100/70 bg-gray-50/40">
              <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
              <span>Loading more shipments...</span>
            </div>
          )}

          {!hasMore && shipments.length > 0 && !loading && (
            <div className="py-3.5 px-4 text-center text-xs text-gray-400 border-t border-gray-100/70 bg-gray-50/20">
              Showing all {shipments.length} shipments
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
