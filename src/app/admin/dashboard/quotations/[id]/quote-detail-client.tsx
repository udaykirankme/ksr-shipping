"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Box, MapPin, Phone, Clock, RefreshCw, AlertTriangle, Trash2, CheckCircle, Share2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQuote, updateQuote, updateQuoteStatus, addQuoteActivity, QuotationRequest, deleteQuote } from "@/lib/quote-service";
import { formatDateTime } from "@/lib/format";
import { openWhatsAppShare, buildQuoteReplyMessage, getDialerHref } from "@/lib/whatsapp-share";
import { useConfirm } from "@/components/ui/confirm-modal";
import { toast } from "sonner";



export function QuoteDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [quote, setQuote] = useState<QuotationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialerHref = quote ? getDialerHref(quote.phone) : null;


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
      toast.success("Notes saved successfully");
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
        version: quote.version,
        note: 'Marked as responded'
      });
      await loadData();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(errorMsg || (err instanceof Error ? err.message : "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  const handleReplyWhatsApp = async () => {
    if (!quote?.phone?.trim()) return;
    openWhatsAppShare(quote.phone, buildQuoteReplyMessage(quote.name));
    try {
      await addQuoteActivity(id, {
        action: 'Replied on WhatsApp',
        note: 'Sent quotation reply via WhatsApp'
      });
      await loadData();
    } catch (err) {
      console.error('Failed to log WhatsApp activity:', err);
    }
  };

  const handleCallCustomer = async () => {
    if (!dialerHref || !quote?.phone?.trim()) return;
    try {
      await addQuoteActivity(id, {
        action: 'Called on Mobile',
        note: `Initiated phone call to ${quote.phone}`
      });
      await loadData();
    } catch (err) {
      console.error('Failed to log call activity:', err);
    }
  };

  const handleDelete = async () => {
    if (!(await confirm("Are you sure you want to permanently delete this quote request?"))) return;
    setSaving(true);
    try {
      await deleteQuote(id);
      router.push('/admin/dashboard/quotations');
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete quote');
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

  const getTimelineStatusLabel = (status: string) => {
    if (status === 'Contacted') return 'Marked as Responded';
    return status;
  };

  const getTimelineBadge = (status: string) => {
    switch (status) {
      case 'Replied on WhatsApp':
        return {
          icon: <Share2 className="w-4 h-4 text-[#25D366]" />,
          border: 'border-[#25D366]/40',
          bg: 'bg-emerald-50'
        };
      case 'Called on Mobile':
      case 'Called Customer':
        return {
          icon: <Phone className="w-4 h-4 text-blue-600" />,
          border: 'border-blue-200',
          bg: 'bg-blue-50'
        };
      case 'Contacted':
      case 'Marked as Responded':
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
          border: 'border-emerald-200',
          bg: 'bg-emerald-50'
        };
      case 'New':
        return {
          icon: <Clock className="w-4 h-4 text-amber-500" />,
          border: 'border-amber-200',
          bg: 'bg-amber-50'
        };
      case 'Quoted':
        return {
          icon: <Box className="w-4 h-4 text-purple-600" />,
          border: 'border-purple-200',
          bg: 'bg-purple-50'
        };
      case 'Rejected':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
          border: 'border-red-200',
          bg: 'bg-red-50'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-500" />,
          border: 'border-gray-200',
          bg: 'bg-gray-50'
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full xl:w-auto">
          <Link href="/admin/dashboard/quotations" className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{quote.quote_id}</h1>
              {quote.status !== 'New' ? (
                <Badge variant="success" className="shrink-0">
                  <CheckCircle className="w-3 h-3 mr-1" /> Responded
                </Badge>
              ) : (
                <Badge variant="warning" className="shrink-0">
                  Pending
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Created on {formatDateTime(quote.created_at)}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
          {/* Customer Communication (Row 1 on mobile, inline on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              type="button"
              onClick={handleReplyWhatsApp}
              disabled={!quote.phone?.trim()}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-xl shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>Reply on WhatsApp</span>
            </Button>

            {dialerHref ? (
              <Button
                asChild
                variant="outline"
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 !text-emerald-600 hover:!text-emerald-700 hover:!bg-emerald-50 !border-emerald-300 rounded-xl shadow-sm transition-colors h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto"
              >
                <a href={dialerHref} onClick={handleCallCustomer} title={`Call ${quote.phone}`}>
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Call</span>
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                disabled
                variant="outline"
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 !text-gray-400 !border-gray-200 rounded-xl shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto"
                title="No phone number available"
              >
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Call</span>
              </Button>
            )}
          </div>

          {/* Admin Management (Row 2 on mobile, inline on desktop) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {quote.status === 'New' && (
              <Button 
                onClick={handleMarkResponded}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all gap-1.5 sm:gap-2 h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                <span className="hidden sm:inline">Mark as Responded</span>
                <span className="sm:hidden">Respond</span>
              </Button>
            )}
            {quote.status !== 'New' && (
              <Button 
                disabled 
                variant="outline" 
                className="bg-emerald-50 !text-emerald-700 !border-emerald-200 gap-1.5 sm:gap-2 h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Responded</span>
              </Button>
            )}

            <Button 
              onClick={handleDelete}
              disabled={saving}
              variant="outline"
              className="gap-1.5 sm:gap-2 !text-red-600 hover:!text-red-700 hover:!bg-red-50 !border-red-200 h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center"
            >
              <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Main Details (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-orange-500" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.name || "—"}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Phone</label>
                {dialerHref ? (
                  <a
                    href={dialerHref}
                    onClick={handleCallCustomer}
                    className="text-gray-900 hover:text-emerald-600 font-medium inline-flex items-center gap-1.5 transition-colors group text-sm sm:text-base"
                    title={`Click to call ${quote.phone}`}
                  >
                    <span>{quote.phone}</span>
                    <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </a>
                ) : (
                  <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.phone || "—"}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.email || "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Route Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Pickup Location (Origin)</label>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.pickup_location || "—"}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Drop Location (Destination)</label>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.drop_location || "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Box className="w-5 h-5 text-orange-500" />
              Shipment Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Package Type</label>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.package_type || "—"}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Approximate Weight</label>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.approx_weight || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Package Description / Contents</label>
                <p className="text-gray-900 font-medium whitespace-pre-wrap text-sm sm:text-base">{quote.package_description || "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Preferences & Notes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Urgency</label>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.urgency || "—"}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Preferred Courier</label>
                <p className="text-gray-900 font-medium text-sm sm:text-base">{quote.preferred_courier || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-500 mb-1">Customer Notes</label>
                <p className="text-gray-900 font-medium whitespace-pre-wrap text-sm sm:text-base">{quote.notes || "—"}</p>
              </div>
              <div className="sm:col-span-2 mt-2 sm:mt-4 space-y-2.5">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> 
                  Internal Notes (Admin Only)
                </label>
                <textarea 
                  name="internal_notes" 
                  value={quote.internal_notes || ''} 
                  onChange={handleNotesChange} 
                  rows={3} 
                  className="w-full rounded-xl border border-orange-200 bg-orange-50/30 px-3 sm:px-4 py-2.5 outline-none transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm" 
                  placeholder="Add internal notes for staff here..."
                />
                <div className="flex justify-end pt-1">
                  <Button 
                    type="button"
                    onClick={handleSave} 
                    disabled={saving}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all h-9 px-4 text-xs sm:text-sm font-semibold inline-flex items-center"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
                    <span>Save Notes</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Timeline (Col 3) */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Activity Timeline
            </h2>
            
            <div className="space-y-4 sm:space-y-6 relative before:absolute before:inset-0 before:left-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {quote.history?.map((event) => {
                const badge = getTimelineBadge(event.status);
                const displayLabel = getTimelineStatusLabel(event.status);
                return (
                  <div key={event.id} className="relative flex items-start gap-3 sm:gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${badge.bg} border-2 ${badge.border} z-10 shrink-0 shadow-xs`}>
                      {badge.icon}
                    </div>
                    <div className="pt-0.5 sm:pt-1 flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{displayLabel}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.occurred_at)}</p>
                      {event.note && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
