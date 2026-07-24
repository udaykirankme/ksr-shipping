"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, RefreshCw, Mail, Phone, Clock, User, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { contactService, ContactMessage } from "@/lib/contact-service";
import { formatDate } from "@/lib/format";

export function MessageDetailClient({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchMessage = async () => {
      try {
        const data = await contactService.getMessage(messageId);
        if (mounted) setMessage(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMessage();
    return () => { mounted = false; };
  }, [messageId]);

  const handleMarkResponded = async () => {
    if (!message || message.responded) return;
    setActionLoading(true);
    try {
      const updated = await contactService.markResponded(messageId, true);
      setMessage(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this message?")) return;
    setActionLoading(true);
    try {
      await contactService.deleteMessage(messageId);
      router.push('/admin/dashboard/messages');
    } catch(err: any) {
      alert(err.message || 'Failed to delete message');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/dashboard/messages')} className="p-2 h-auto text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              Message {message.contact_id || 'Details'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Submitted on {formatDate(message.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!message.responded && (
            <Button 
              onClick={handleMarkResponded}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Mark as Responded
            </Button>
          )}
          {message.responded && (
            <Button disabled variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle className="w-4 h-4 mr-2" /> Responded on {formatDate(message.responded_at || message.updated_at)}
            </Button>
          )}
          <Button 
            onClick={handleDelete}
            disabled={actionLoading}
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ml-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                {message.subject || 'No Subject Provided'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {message.message}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{message.name}</p>
                  <p className="text-xs text-gray-500">Name</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 break-all">{message.email || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Email Address</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{message.phone || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Phone Number</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(message.created_at)}</p>
                  <p className="text-xs text-gray-500">Submission Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
