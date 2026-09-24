"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle, 
  RefreshCw, 
  Mail, 
  Phone, 
  Clock, 
  User, 
  MessageSquare, 
  Trash2, 
  Share2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contactService, ContactMessage } from "@/lib/contact-service";
import { formatDate, formatDateTime } from "@/lib/format";
import { openWhatsAppShare, buildContactReplyMessage, getDialerHref } from "@/lib/whatsapp-share";
import { useConfirm } from "@/components/ui/confirm-modal";
import { toast } from "sonner";

export function MessageDetailClient({ messageId }: { messageId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const dialerHref = message ? getDialerHref(message.phone) : null;

  useEffect(() => {
    let mounted = true;
    const fetchMessage = async () => {
      try {
        const data = await contactService.getMessage(messageId);
        if (mounted) setMessage(data as ContactMessage);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMessage();
    return () => { mounted = false; };
  }, [messageId]);

  const loadData = async () => {
    try {
      const data = await contactService.getMessage(messageId);
      setMessage(data as ContactMessage);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkResponded = async () => {
    if (!message || message.responded) return;
    setActionLoading(true);
    try {
      const updated = await contactService.markResponded(messageId, true);
      setMessage(updated as ContactMessage);
      toast.success("Marked as responded");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplyWhatsApp = async () => {
    if (!message?.phone?.trim()) return;
    openWhatsAppShare(message.phone, buildContactReplyMessage(message.name));
    try {
      const updated = await contactService.addActivity(messageId, {
        action: 'Replied on WhatsApp',
        note: 'Sent reply via WhatsApp'
      });
      setMessage(updated);
    } catch (err) {
      console.error('Failed to log WhatsApp activity:', err);
    }
  };

  const handleCallCustomer = async () => {
    if (!dialerHref || !message?.phone?.trim()) return;
    try {
      const updated = await contactService.addActivity(messageId, {
        action: 'Called on Mobile',
        note: `Initiated phone call to ${message.phone}`
      });
      setMessage(updated);
    } catch (err) {
      console.error('Failed to log call activity:', err);
    }
  };

  const handleDelete = async () => {
    if (!(await confirm("Are you sure you want to permanently delete this message?"))) return;
    setActionLoading(true);
    try {
      await contactService.deleteMessage(messageId);
      router.push('/admin/dashboard/messages');
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete message');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        <p className="text-gray-500">Loading message details...</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 text-lg">Message not found</p>
        <Button variant="outline" className="mt-4 bg-white" onClick={() => router.push('/admin/dashboard/messages')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Messages
        </Button>
      </div>
    );
  }

  const getTimelineStatusLabel = (status: string) => {
    if (status === 'Contacted' || status === 'Marked as Responded') return 'Marked as Responded';
    if (status === 'New') return 'Message Submitted';
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
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-500" />,
          border: 'border-gray-200',
          bg: 'bg-gray-50'
        };
    }
  };

  const timelineEvents = (message.history && message.history.length > 0)
    ? message.history
    : [
        ...(message.responded && message.responded_at ? [{
          id: `resp-${message.id}`,
          status: 'Marked as Responded',
          occurred_at: message.responded_at,
          note: 'Marked as responded'
        }] : []),
        {
          id: `init-${message.id}`,
          status: 'New',
          occurred_at: message.created_at,
          note: 'Contact Message Received'
        }
      ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 w-full xl:w-auto">
          <Link 
            href="/admin/dashboard/messages" 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Message {message.contact_id || 'Details'}
              </h1>
              {message.responded ? (
                <Badge variant="success" className="shrink-0">
                  <CheckCircle className="w-3 h-3 mr-1" /> Responded
                </Badge>
              ) : (
                <Badge variant="warning" className="shrink-0">
                  Pending
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Submitted on {formatDate(message.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
          {/* Contact Actions (Row 1 on mobile) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              type="button"
              onClick={handleReplyWhatsApp}
              disabled={!message.phone?.trim()}
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
                <a href={dialerHref} onClick={handleCallCustomer} title={`Call ${message.phone}`}>
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

          {/* Status & Delete Actions (Row 2 on mobile) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {!message.responded ? (
              <Button 
                onClick={handleMarkResponded}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin shrink-0" /> : <CheckCircle className="w-4 h-4 mr-1.5 shrink-0" />}
                <span className="hidden sm:inline">Mark as Responded</span>
                <span className="sm:hidden">Respond</span>
              </Button>
            ) : (
              <Button disabled variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center">
                <CheckCircle className="w-4 h-4 mr-1.5 shrink-0" /> Responded
              </Button>
            )}
            <Button 
              onClick={handleDelete}
              disabled={actionLoading}
              variant="outline"
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold w-full sm:w-auto justify-center"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Message */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2.5 text-gray-800 font-semibold">
                <MessageSquare className="w-5 h-5 text-orange-500 shrink-0" />
                <span>{message.name || "Customer Message"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8 space-y-5">
              {message.subject && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {message.subject}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Message Content
                </label>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base bg-gray-50/40 p-4 sm:p-5 rounded-2xl border border-gray-100/80">
                  {message.message}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer Info & Activity Timeline */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm bg-white">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{message.name}</p>
                  <p className="text-xs text-gray-500">Name</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-all">{message.email || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Email Address</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  {dialerHref ? (
                    <a
                      href={dialerHref}
                      onClick={handleCallCustomer}
                      className="text-sm font-medium text-gray-900 hover:text-emerald-600 inline-flex items-center gap-1.5 transition-colors group"
                      title={`Click to call ${message.phone}`}
                    >
                      <span>{message.phone}</span>
                      <Phone className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{message.phone || 'N/A'}</p>
                  )}
                  <p className="text-xs text-gray-500">Phone Number</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(message.created_at)}</p>
                  <p className="text-xs text-gray-500">Submission Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Activity Timeline
            </h2>
            
            <div className="space-y-4 sm:space-y-6 relative before:absolute before:inset-0 before:left-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {timelineEvents.map((event) => {
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
