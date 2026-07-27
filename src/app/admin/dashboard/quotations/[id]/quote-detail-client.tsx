"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Box, MapPin, Phone, Clock, RefreshCw, AlertTriangle, Trash2, CheckCircle, Share2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQuote, updateQuote, updateQuoteStatus, QuotationRequest, deleteQuote } from "@/lib/quote-service";
import { formatDateTime } from "@/lib/format";
import { openWhatsAppShare, buildQuoteReplyMessage } from "@/lib/whatsapp-share";



export function QuoteDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<QuotationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  


  useEffect(() => {
    let mounted = true;
    const loadQuote = async () => {
      try {
        const data = await getQuote(id);
        if (mounted) setQuote(data);
      } catch {
        if (mounted) setError("Failed to load quote details");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadQuote();
    return () => { mounted = false; };
  }, [id]);

  const loadData = async () => {
    try {
      const data = await getQuote(id);
      setQuote(data);
    } catch {
      setError("Failed to load quote details");
    } finally {
      setLoading(false);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!quote) return;
    setQuote({ ...quote, internal_notes: e.target.value });
  };

  const handleSave = async () => {
    if (!quote) return;
    setSaving(true);
    setError("");
    try {
      await updateQuote(id, {
        internal_notes: quote.internal_notes,
        version: quote.version
      } as any);
      await loadData();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(errorMsg || (err instanceof Error ? err.message : "Failed to save changes"));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkResponded = async () => {
    if (!quote || quote.status !== 'New') return;
    setSaving(true);
    setError("");
    try {
      await updateQuoteStatus(id, {
        status: 'Contacted',
        version: quote.version
      });
      await loadData();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(errorMsg || (err instanceof Error ? err.message : "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this quote request?")) return;
    setSaving(true);
    try {
      await deleteQuote(id);
      router.push('/admin/dashboard/quotations');
    } catch (err: any) {
      alert(err.message || 'Failed to delete quote');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 text-center text-gray-500">
        Quote not found
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/quotations" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{quote.quote_id}</h1>
              {quote.status !== 'New' ? (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" /> Responded
                </Badge>
              ) : (
                <Badge variant="warning">
                  Pending
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Created on {formatDateTime(quote.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <Button
            type="button"
            onClick={() => openWhatsAppShare(quote.phone, buildQuoteReplyMessage(quote.name))}
            disabled={!quote.phone?.trim()}
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            Reply on WhatsApp
          </Button>
          {quote.status === 'New' && (
            <Button 
              onClick={handleMarkResponded}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark as Responded
            </Button>
          )}
          {quote.status !== 'New' && (
            <Button disabled variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-2">
              <CheckCircle className="w-4 h-4" /> Responded
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            variant="outline"
            className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
          >
            <Save className="w-4 h-4" />
            Save Notes
          </Button>
          <Button 
            onClick={handleDelete}
            disabled={saving}
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-orange-500" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-gray-900 font-medium">{quote.name || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-gray-900 font-medium">{quote.phone || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900 font-medium">{quote.email || "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Route Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Pickup Location (Origin)</label>
                <p className="text-gray-900 font-medium">{quote.pickup_location || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Drop Location (Destination)</label>
                <p className="text-gray-900 font-medium">{quote.drop_location || "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Box className="w-5 h-5 text-orange-500" />
              Shipment Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Package Type</label>
                <p className="text-gray-900 font-medium">{quote.package_type || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Approximate Weight</label>
                <p className="text-gray-900 font-medium">{quote.approx_weight || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Package Description / Contents</label>
                <p className="text-gray-900 font-medium whitespace-pre-wrap">{quote.package_description || "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferences & Notes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Urgency</label>
                <p className="text-gray-900 font-medium">{quote.urgency || "—"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Preferred Courier</label>
                <p className="text-gray-900 font-medium">{quote.preferred_courier || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer Notes</label>
                <p className="text-gray-900 font-medium whitespace-pre-wrap">{quote.notes || "—"}</p>
              </div>
              <div className="sm:col-span-2 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> 
                  Internal Notes (Admin Only)
                </label>
                <textarea 
                  name="internal_notes" 
                  value={quote.internal_notes || ''} 
                  onChange={handleNotesChange} 
                  rows={3} 
                  className="w-full rounded-xl border border-orange-200 bg-orange-50/30 px-4 py-2.5 outline-none transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                  placeholder="Add internal notes for staff here..."
                />
              </div>
            </div>
          </div>

        </div>

        {/* Timeline (Col 3) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Activity Timeline
            </h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {quote.history?.map((event, _idx) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200 z-10 shrink-0">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status).split(' ')[0]}`} />
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold text-gray-900 text-sm">{event.status}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(event.occurred_at)}</p>
                    {event.note && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
