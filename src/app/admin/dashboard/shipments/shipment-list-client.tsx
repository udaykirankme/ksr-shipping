"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, ArrowRight, RefreshCw, ArchiveRestore, Trash2, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { shipmentService } from "@/lib/shipment-service";
import { formatCurrency, formatDate } from "@/lib/format";

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
  const hasInitialData = initialShipments.length > 0 || initialTotal > 0;
  const [shipments, setShipments] = useState<ShipmentData[]>(initialShipments);
  const [loading, setLoading] = useState(!hasInitialData);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState(true);
  const [olderThan31Days, setOlderThan31Days] = useState(false);
  
  const limit = 10;
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(initialTotal / limit)));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const skipInitialFetch = useRef(hasInitialData);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let mounted = true;

    if (
      skipInitialFetch.current &&
      page === 1 &&
      !debouncedSearch &&
      !statusFilter &&
      isActiveFilter
    ) {
      skipInitialFetch.current = false;
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await shipmentService.getShipments({
          page,
          limit,
          search: debouncedSearch,
          status: statusFilter,
          isActive: isActiveFilter,
          olderThan31Days
        });
        if (mounted) {
          const resData = data as any;
          setShipments(resData.shipments);
          setTotalPages(Math.max(1, Math.ceil(resData.total / limit)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { mounted = false; };
  }, [page, statusFilter, isActiveFilter, olderThan31Days, debouncedSearch]);

  // Provide manual refresh
  const handleRefresh = async () => {
    setPage(1);
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
      setShipments(resData.shipments);
      setTotalPages(Math.ceil(resData.total / limit));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this shipment? This action cannot be undone.")) return;
    try {
      await shipmentService.deleteShipment(id);
      await handleRefresh();
      router.refresh();
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
    if (!window.confirm(`Delete ${selectedIds.size} shipments permanently?\n\nThis action cannot be undone.`)) return;
    setLoading(true);
    try {
      await shipmentService.deleteBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
      await handleRefresh();
      router.refresh();
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
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all logistics operations</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setIsActiveFilter(!isActiveFilter)} className="gap-2">
            {isActiveFilter ? <ArchiveRestore className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            {isActiveFilter ? 'View Inactive' : 'View Active'}
          </Button>
          <Button 
            variant={olderThan31Days ? "default" : "outline"}
            onClick={() => { setOlderThan31Days(!olderThan31Days); setPage(1); }} 
            className={`gap-2 ${olderThan31Days ? 'bg-orange-500 hover:bg-orange-600 text-white border-transparent' : ''}`}
          >
            Older than 31 days
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>

          <div className="relative group">
            <Button variant="outline" className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50">
              <Download className="w-4 h-4" />
              Export ▼
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <button onClick={() => handleExport('current_month')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 text-gray-700 transition-colors">
                Current Month
              </button>
              <button onClick={() => handleExport('last_month')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 text-gray-700 transition-colors">
                Last Month
              </button>
            </div>
          </div>

          <Link href="/admin/dashboard/shipments/new">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus className="w-4 h-4" />
              Create Shipment
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
          <Input 
            placeholder="Search tracking, names, phones..." 
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
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
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

      {/* Table */}
      <div className="bg-white border border-gray-100/50 rounded-2xl shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex items-center justify-center">
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
                    checked={shipments.length > 0 && selectedIds.size === shipments.length}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Tracking Info</TableHead>
                <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Sender</TableHead>
                <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Receiver</TableHead>
                <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Service</TableHead>
                <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Status</TableHead>
                <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Booked Date</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Profit</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p>No shipments found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {shipments.map((shipment) => (
                <TableRow key={shipment.id} className="group hover:bg-gray-50/50 cursor-pointer" onClick={() => window.location.href = `/admin/dashboard/shipments/${shipment.id}`}>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
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
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{shipment.tracking_id}</span>
                      <span className="text-xs text-gray-500">{shipment.official_tracking_id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{shipment.sender_name || 'N/A'}</span>
                      <span className="text-xs text-gray-500">{shipment.sender_city || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{shipment.receiver_name || 'N/A'}</span>
                      <span className="text-xs text-gray-500">{shipment.receiver_city || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-sm">{shipment.service || shipment.courier || 'N/A'}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={shipment.current_status === 'Delivered' ? 'success' : shipment.current_status === 'Shipment Created' ? 'default' : 'warning'}>
                      {shipment.current_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(shipment.booked_date)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-900">
                    {formatCurrency(shipment.profit || 0)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(shipment.id, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <Link href={`/admin/dashboard/shipments/${shipment.id}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit text-gray-500"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <Link href={`/admin/dashboard/shipments/${shipment.id}`}>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
