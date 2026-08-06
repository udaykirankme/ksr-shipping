"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, CheckCircle, Star, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactService, ContactMessage } from "@/lib/contact-service";
import { formatDate } from "@/lib/format";
import { DateFilter } from "@/components/dashboard/date-filter";

export function MessageListClient() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all-time");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (statusFilter !== "All") params.status = statusFilter;
      if (dateFilter !== "all-time") params.dateFilter = dateFilter;
      
      const data = await contactService.getMessages(params);
      setMessages(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    contactService.markAllContactsAsRead().catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMessages();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search, statusFilter, dateFilter, page]);

  const handleStar = async (e: React.MouseEvent, msgId: string, currentStatus: boolean) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_starred: newStatus } : m));
    try {
      await contactService.toggleStar(msgId, newStatus);
    } catch (err) {
      console.error(err);
      // revert on failure
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_starred: currentStatus } : m));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this message?")) return;
    try {
      await contactService.deleteMessage(id);
      await fetchMessages();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete');
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(messages.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} messages permanently?\n\nThis action cannot be undone.`)) return;
    setLoading(true);
    try {
      await contactService.deleteBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchMessages();
    } catch (err) {
      console.error(err);
      alert("Failed to delete selected records.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contact Messages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and respond to customer inquiries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white" onClick={() => fetchMessages()}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 mb-4">
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

      <div className="bg-white rounded-2xl border border-gray-100/50 shadow-sm overflow-hidden flex flex-col relative">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="flex gap-2 items-center w-full lg:w-auto">
            <div className="relative w-full sm:w-64 group">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              <Input 
                placeholder="Search..." 
                className="premium-input pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
          <div className="flex gap-2 w-full lg:flex-1 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
            {["All", "To Be Responded", "Responded", "Starred"].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                className={statusFilter === status ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl whitespace-nowrap" : "flex-1 bg-white rounded-xl border-gray-200 whitespace-nowrap"}
                onClick={() => setStatusFilter(status)}
              >
                {status === "Starred" ? <Star className="w-4 h-4 mr-1 fill-current" /> : null}
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    checked={messages.length > 0 && selectedIds.size === messages.length}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold text-gray-900">Contact ID</TableHead>
                <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                <TableHead className="font-semibold text-gray-900">Subject</TableHead>
                <TableHead className="font-semibold text-gray-900">Date</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p>Loading messages...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    No messages found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((msg) => (
                  <TableRow key={msg.id} className="group hover:bg-gray-50/50 cursor-pointer" onClick={() => window.location.href = `/admin/dashboard/messages/${msg.id}`}>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        checked={selectedIds.has(msg.id)}
                        onChange={(e) => {
                           if (e.target.checked) {
                             setSelectedIds(prev => new Set([...prev, msg.id]));
                           } else {
                             setSelectedIds(prev => {
                               const next = new Set(prev);
                               next.delete(msg.id);
                               return next;
                             });
                           }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <button onClick={(e) => handleStar(e, msg.id, msg.is_starred)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <Star className={`w-5 h-5 ${msg.is_starred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{msg.contact_id || 'N/A'}</span>
                        {!msg.opened_at && (
                          <Badge variant="destructive" className="bg-red-500 text-[10px] px-1.5 py-0">New</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`font-medium ${!msg.opened_at ? 'text-gray-900 font-bold' : 'text-gray-900'}`}>{msg.name}</span>
                        <span className="text-xs text-gray-500">{msg.email || msg.phone || 'No contact info'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm line-clamp-1 max-w-[200px] ${!msg.opened_at ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{msg.subject || msg.message}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(msg.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      {msg.responded ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" /> Responded
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(msg.id, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-white"
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
