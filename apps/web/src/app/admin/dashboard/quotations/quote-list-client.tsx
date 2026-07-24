"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, RefreshCw, Star, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getQuotes, QuotationRequest, toggleStar, deleteBulk, deleteQuote } from "@/lib/quote-service";
import { formatDate } from "@/lib/format";
import { DateFilter } from "@/components/dashboard/date-filter";

export function QuoteListClient() {
  const [quotes, setQuotes] = useState<QuotationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all-time");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getQuotes({
          page,
          limit,
          search,
          status: statusFilter,
          dateFilter
        });
        if (mounted) {
          setQuotes(data.quotations);
          setTotalPages(Math.ceil(data.total / limit) || 1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [page, statusFilter, dateFilter, search]);

  const handleStar = async (e: React.MouseEvent, quoteId: string, currentStatus: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    const newStatus = !currentStatus;
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, is_starred: newStatus } : q));
    try {
      await toggleStar(quoteId, newStatus);
    } catch (err) {
      console.error(err);
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, is_starred: currentStatus } : q));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this quote request?")) return;
    try {
      await deleteQuote(id);
      await handleRefresh();
    } catch(err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(quotes.map(q => q.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} quote requests permanently?\n\nThis action cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
      await handleRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete selected records.");
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    setLoading(true);
    try {
      const data = await getQuotes({
        page: 1,
        limit,
        search,
        status: statusFilter,
        dateFilter
      });
      setQuotes(data.quotations);
      setTotalPages(Math.ceil(data.total / limit) || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Contacted': return 'bg-yellow-100 text-yellow-700';
      case 'Quoted': return 'bg-purple-100 text-purple-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer inquiries</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>

        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 items-center w-full lg:w-auto">
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
            <Input 
              placeholder="Search Quote ID, name, phone, location..." 
              className="premium-input pl-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
            />
          </div>
          <DateFilter value={dateFilter} onChange={setDateFilter} />
        </div>
        
        <div className="flex gap-2 w-full lg:flex-1 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
          {["", "Needs Attention", "New", "Contacted", "Quoted", "Rejected", "Closed", "Starred"].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              className={statusFilter === status ? "flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl whitespace-nowrap" : "flex-1 bg-white rounded-xl whitespace-nowrap"}
              onClick={() => { setStatusFilter(status); setPage(1); }}
            >
              {status === "Starred" ? <Star className="w-4 h-4 mr-1 fill-current" /> : null}
              {status === "" ? "All Quotes" : status}
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
                    checked={quotes.length > 0 && selectedIds.size === quotes.length}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold text-gray-900">Quote ID</TableHead>
                <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                <TableHead className="font-semibold text-gray-900">Route</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Created Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    No quotes found.
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow 
                    key={quote.id} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/admin/dashboard/quotations/${quote.id}`}
                  >
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        checked={selectedIds.has(quote.id)}
                        onChange={(e) => {
                           if (e.target.checked) {
                             setSelectedIds(prev => new Set([...prev, quote.id]));
                           } else {
                             setSelectedIds(prev => {
                               const next = new Set(prev);
                               next.delete(quote.id);
                               return next;
                             });
                           }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <button onClick={(e) => handleStar(e, quote.id, quote.is_starred)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <Star className={`w-5 h-5 ${quote.is_starred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{quote.quote_id}</span>
                        {!quote.opened_at && (
                          <Badge variant="destructive" className="bg-red-500 text-[10px] px-1.5 py-0">New</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${!quote.opened_at ? 'text-gray-900 font-bold' : 'text-gray-900'}`}>{quote.name}</div>
                      <div className="text-xs text-gray-500">{quote.phone}</div>
                    </TableCell>
                    <TableCell>
                      {quote.pickup_location || quote.drop_location ? (
                        <div className={`text-sm ${!quote.opened_at ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          <span className="text-gray-900">{quote.pickup_location || '-'}</span>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="text-gray-900">{quote.drop_location || '-'}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(quote.status)} border-0 font-semibold px-3 py-1 rounded-full`}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(quote.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(quote.id, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            Page {page} of {totalPages}
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
