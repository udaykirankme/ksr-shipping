"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { shipmentService } from '@/lib/shipment-service';
import { formatDateTime, formatCurrency, formatDateToYYYYMMDD } from '@/lib/format';
import {
  getCurrentBusinessDateTimeInput,
  toBusinessDateTimeFields,
  toBusinessTimeInput,
  toBusinessDateInput,
} from '@/lib/datetime';
import { ArrowLeft, Save, MapPin, Clock, Copy, ArchiveRestore, Trash2, Truck, CheckCircle2, RefreshCw, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";
import { PremiumTimePicker } from "@/components/ui/PremiumTimePicker";
import { ServicesApi, ServiceThroughApi, ServiceItem } from '@/lib/services-api';
import {
  buildStatusUpdateShareMessage,
  openWhatsAppShare,
} from '@/lib/whatsapp-share';

const STATUS_WORKFLOW = [
  'Shipment Created',
  'Picked Up',
  'Dispatched',
  'In Transit',
  'Out For Delivery',
  'Delivered'
];

function getCurrentOccurredAt(): string {
  return getCurrentBusinessDateTimeInput();
}

function getNextStatusUpdate(currentStatus: string) {
  const currentIndex = STATUS_WORKFLOW.indexOf(currentStatus);
  if (currentIndex > -1 && currentIndex < STATUS_WORKFLOW.length - 1) {
    return {
      status: STATUS_WORKFLOW[currentIndex + 1],
      occurred_at: getCurrentOccurredAt(),
    };
  }
  return { status: '', occurred_at: getCurrentOccurredAt() };
}

type SavedStatusShare = {
  status: string;
  location: string;
  occurredAt: string;
  note?: string;
};

function isStatusFormComplete(update: {
  status: string;
  location: string;
  occurred_at: string;
}): boolean {
  if (!update.status?.trim() || !update.location?.trim()) return false;
  if (!update.occurred_at?.includes('T')) return false;
  const [datePart, timePart] = update.occurred_at.split('T');
  return Boolean(datePart && timePart?.substring(0, 5));
}

function getShareableStatus(shipment: {
  history?: any[];
  current_location?: string | null;
}): SavedStatusShare | null {
  const latest = shipment.history?.[0];
  if (!latest?.status || !latest?.occurred_at) return null;

  const location =
    latest.location?.trim() ||
    shipment.current_location?.trim() ||
    '';

  if (!location) return null;

  const occurredAt =
    typeof latest.occurred_at === 'string'
      ? latest.occurred_at
      : latest.occurred_at.toISOString();

  const { date, time } = toBusinessDateTimeFields(occurredAt);

  return {
    status: latest.status,
    location,
    occurredAt: `${date}T${time}:00`,
    note: latest.note || undefined,
  };
}

export function ShipmentDetailClient({ shipmentId, initialData }: { shipmentId: string, initialData: any }) {
  const router = useRouter();
  const [shipment, setShipment] = useState(initialData);
  const [formData, setFormData] = useState({ 
    ...initialData,
    estimated_delivery: initialData.estimated_delivery ? toBusinessDateInput(initialData.estimated_delivery) : '',
    booked_time: initialData.booked_date ? toBusinessTimeInput(initialData.booked_date) : ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Status Update state
  const [statusUpdate, setStatusUpdate] = useState(() => ({
    status: getNextStatusUpdate(initialData.current_status).status,
    location: '',
    note: '',
    occurred_at: getCurrentOccurredAt(),
  }));
  const [dbServices, setDbServices] = useState<ServiceItem[]>([]);
  const [dbServiceThrough, setDbServiceThrough] = useState<ServiceItem[]>([]);

  const isDelivered = shipment.current_status === 'Delivered';
  const shareableStatus = getShareableStatus(shipment);
  
  useEffect(() => {
    const nextUpdate = getNextStatusUpdate(shipment.current_status);
    setStatusUpdate((prev) => ({
      ...prev,
      status: nextUpdate.status,
      occurred_at: nextUpdate.occurred_at,
    }));
  }, [shipment.current_status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (e.target.type === 'number') {
      if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
        value = value.replace(/^0+/, '');
        if (value === '') value = '0';
      }
    }
    setFormData((prev: any) => ({ ...prev, [e.target.name]: value }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setStatusUpdate((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getSavedStatusShareMessage = (recipientName?: string) => {
    if (!shareableStatus) return '';
    return buildStatusUpdateShareMessage({
      trackingId: shipment.tracking_id,
      status: shareableStatus.status,
      location: shareableStatus.location,
      occurredAt: shareableStatus.occurredAt,
      note: shareableStatus.note,
      recipientName,
    });
  };

  const handleShareStatusToSender = () => {
    if (!shareableStatus) return;
    openWhatsAppShare(formData.sender_phone, getSavedStatusShareMessage(formData.sender_name));
  };

  const handleShareStatusToReceiver = () => {
    if (!shareableStatus) return;
    openWhatsAppShare(formData.receiver_phone, getSavedStatusShareMessage(formData.receiver_name));
  };

  const canSubmitStatusUpdate = isStatusFormComplete(statusUpdate);
  const canShareStatusUpdate = shareableStatus !== null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { booked_date, booked_time, ...submitData } = formData as any;
      const updated = await shipmentService.updateShipment(shipmentId, {
        ...submitData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        num_packages: parseInt(formData.num_packages) || 1,
        paid_amount: parseFloat(formData.paid_amount) || 0,
        received_amount: parseFloat(formData.received_amount) || 0,
        version: shipment.version // OCC
      }) as any;
      
      setShipment(updated);
      setFormData({
        ...updated,
        booked_time: updated.booked_date ? toBusinessTimeInput(updated.booked_date) : ''
      });
      setSuccess('Shipment details updated successfully');
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update shipment');
      if ((err as Error).message?.includes('refresh')) {
        // Automatically fetch latest if OCC conflict? We can just ask them to refresh manually or we can trigger it.
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitStatusUpdate) {
      setError('Please fill in status, location, update date, and update time.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const submittedUpdate = { ...statusUpdate };

    try {
      const res = await shipmentService.updateStatus(shipmentId, {
        ...submittedUpdate,
        version: shipment.version // OCC
      });
      
      const resData = res as any;
      setShipment({ ...resData.shipment, history: [resData.history, ...(shipment.history || [])] });
      setSuccess('Status updated successfully. You can now share this update with the sender or receiver.');
      
      // Reset status input with next status and current date/time
      const nextUpdate = getNextStatusUpdate(resData.shipment.current_status);
      setStatusUpdate({
        status: nextUpdate.status,
        location: '',
        note: '',
        occurred_at: nextUpdate.occurred_at,
      });
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!confirm(`Are you sure you want to ${shipment.is_active ? 'archive' : 'unarchive'} this shipment?`)) return;
    
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const updated = await shipmentService.archiveShipment(shipmentId, !shipment.is_active);
      const updatedData = updated as any;
      setShipment((prev: any) => ({ ...prev, is_active: updatedData.is_active }));
      setSuccess(`Shipment ${updatedData.is_active ? 'unarchived' : 'archived'} successfully`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to archive shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this shipment? This action cannot be undone.")) return;
    try {
      setLoading(true);
      await shipmentService.deleteShipment(shipmentId);
      router.push('/admin/dashboard/shipments');
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to delete shipment');
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await shipmentService.getShipment(shipmentId);
      setShipment(data);
      const dataToSpread = data as any;
      setFormData({
        ...dataToSpread,
        booked_time: dataToSpread.booked_date ? toBusinessTimeInput(dataToSpread.booked_date) : '',
      });
      
      const [s, st] = await Promise.all([
        ServicesApi.getServices(),
        ServiceThroughApi.getItems()
      ]);
      setDbServices(s.filter(i => i.is_enabled));
      setDbServiceThrough(st.filter(i => i.is_enabled));
      
      setSuccess('Data refreshed');
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (textToCopy: string, label: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setSuccess(`${label} copied to clipboard!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/shipments" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Shipment</h1>
              <span className="text-2xl font-mono text-orange-500 font-bold tracking-wider cursor-pointer hover:text-orange-600 transition-colors flex items-center gap-2" onClick={() => handleCopy(shipment.tracking_id, 'KSR Tracking Number')} title="Click to copy KSR Tracking Number">
                {shipment.tracking_id}
                <Copy className="w-4 h-4 text-gray-400 hover:text-orange-500" />
              </span>
              {!shipment.is_active && (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">Archived</Badge>
              )}
            </div>
            {shipment.official_tracking_id && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 cursor-pointer hover:text-gray-700 transition-colors" onClick={() => handleCopy(shipment.official_tracking_id, 'Official Tracking Number')} title="Click to copy Official Tracking Number">
                Official Tracking: {shipment.official_tracking_id}
                <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refreshData} className="p-2 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200" title="Refresh">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          {isDelivered && (
             <button onClick={handleArchiveToggle} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
               <ArchiveRestore className="w-4 h-4" />
               {shipment.is_active ? 'Archive' : 'Unarchive'}
             </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-2 rounded-xl bg-red-50 text-red-600 px-4 py-2.5 text-sm font-semibold shadow-sm border border-red-100 hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <Badge variant="outline" className={`px-3 py-1 text-sm font-semibold
            ${isDelivered ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isDelivered ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></span>
            {shipment.current_status}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 font-medium flex justify-between items-center">
          {error}
          {error.includes('refresh') && (
            <button onClick={refreshData} className="text-sm bg-white px-3 py-1 rounded-lg border border-red-200 shadow-sm text-gray-800 hover:bg-gray-50">Refresh Now</button>
          )}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-100 font-medium">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="xl:col-span-2 space-y-6">
          
          <form onSubmit={handleUpdate} className="space-y-6 opacity-100 transition-opacity">
            {/* Basic Info */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-semibold text-gray-900">Shipment Details</h2>
                 {!isDelivered && (
                   <button 
                     type="submit"
                     disabled={loading}
                     className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
                   >
                     <Save className="w-4 h-4" /> Save
                   </button>
                 )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booked Date</label>
                  <PremiumDatePicker value={formData.booked_date} onChange={() => {}} disabled={true} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Booked Time</label>
                  <PremiumTimePicker value={formData.booked_time} onChange={() => {}} disabled={true} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipment Type <span className="text-red-500">*</span></label>
                  <PremiumSelect
                    value={formData.shipment_type || 'Domestic'}
                    onChange={(value) => handleChange({ target: { name: 'shipment_type', value } } as any)}
                    options={[
                      { label: "Domestic", value: "Domestic" },
                      { label: "International", value: "International" }
                    ]}
                    disabled={isDelivered}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Date</label>
                  <PremiumDatePicker 
                    value={formData.estimated_delivery} 
                    onChange={(date) => setFormData((prev: any) => ({ ...prev, estimated_delivery: formatDateToYYYYMMDD(date) }))} 
                    disabled={isDelivered} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service <span className="text-red-500">*</span></label>
                  <PremiumSelect
                    value={formData.service || ''}
                    onChange={(value) => handleChange({ target: { name: 'service', value } } as any)}
                    options={[
                      ...dbServices.map(s => ({ label: s.name, value: s.slug })),
                      ...(formData.service && !dbServices.find(s => s.slug === formData.service) ? [{ label: formData.service, value: formData.service }] : [])
                    ]}
                    placeholder="Select Service..."
                    disabled={isDelivered}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Through <span className="text-red-500">*</span></label>
                  <PremiumSelect
                    value={formData.service_through || ''}
                    onChange={(value) => handleChange({ target: { name: 'service_through', value } } as any)}
                    options={[
                      ...dbServiceThrough.map(st => ({ label: st.name, value: st.slug })),
                      ...(formData.service_through && !dbServiceThrough.find(st => st.slug === formData.service_through) ? [{ label: formData.service_through, value: formData.service_through }] : [])
                    ]}
                    placeholder="Select Vendor..."
                    disabled={isDelivered}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipment Update (Visible to Customer - to be added for Delays or Emergencies)</label>
                  <textarea name="customer_update" value={formData.customer_update || ''} onChange={handleChange} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" placeholder="E.g. Customs clearance is taking longer than expected."></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
                  <textarea name="internal_notes" value={formData.internal_notes || ''} onChange={handleChange} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"></textarea>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sender Info */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Sender</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                    <input required name="sender_name" value={formData.sender_name || ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                    <input required name="sender_phone" value={formData.sender_phone || ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                    <input required name="sender_city" value={formData.sender_city || ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Receiver Info */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Receiver</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                    <input required name="receiver_name" value={formData.receiver_name || ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                    <input required name="receiver_phone" value={formData.receiver_phone || ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                    <input required name="receiver_city" value={formData.receiver_city || ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Financials & Package */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Financials</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Received (₹)</label>
                    <input required type="number" name="received_amount" value={formData.received_amount ?? ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 outline-none transition-all text-emerald-600 font-semibold bg-emerald-50/50 disabled:text-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paid (₹)</label>
                    <input required type="number" name="paid_amount" value={formData.paid_amount ?? ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 outline-none transition-all text-red-600 font-semibold bg-red-50/50 disabled:text-red-500" />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100 mt-6">
                   <span className="font-semibold text-gray-700">Profit</span>
                   <span className="text-2xl font-bold text-gray-900">{formatCurrency(shipment.profit || 0)}</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Package Details</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg) <span className="text-red-500">*</span></label>
                    <input required type="number" step="0.01" name="weight" value={formData.weight || ''} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Packages</label>
                    <input required type="number" name="num_packages" value={formData.num_packages || 1} onChange={handleChange} disabled={isDelivered} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} disabled={isDelivered} rows={2} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
              </div>
            </div>
            
          </form>
        </div>

        {/* Right Column: Timeline & Status Update */}
        <div className="space-y-6">
          {(shareableStatus || !isDelivered) && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 opacity-50"></div>
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                {isDelivered ? 'Share Status Update' : 'Update Status'}
              </h2>
              {!isDelivered ? (
                <form onSubmit={handleStatusUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Status <span className="text-red-500">*</span></label>
                    <PremiumSelect
                      value={statusUpdate.status}
                      onChange={(value) =>
                        setStatusUpdate((prev) => ({
                          ...prev,
                          status: value,
                          occurred_at: getCurrentOccurredAt(),
                        }))
                      }
                      options={STATUS_WORKFLOW.map(s => ({ label: s, value: s }))}
                      placeholder="Select status..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
                    <input required name="location" value={statusUpdate.location} onChange={handleStatusChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" placeholder="e.g. Mumbai Hub" />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Update Date <span className="text-red-500">*</span></label>
                      <PremiumDatePicker 
                        value={statusUpdate.occurred_at ? statusUpdate.occurred_at.split('T')[0] : ''} 
                        onChange={(date) => {
                          const dateStr = formatDateToYYYYMMDD(date);
                          const timeStr = statusUpdate.occurred_at ? statusUpdate.occurred_at.split('T')[1].substring(0, 5) : '12:00';
                          setStatusUpdate(prev => ({ ...prev, occurred_at: `${dateStr}T${timeStr}:00` }));
                        }} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Update Time <span className="text-red-500">*</span></label>
                      <PremiumTimePicker 
                        value={statusUpdate.occurred_at ? statusUpdate.occurred_at.split('T')[1].substring(0, 5) : ''} 
                        onChange={(timeStr) => {
                          const dateStr = statusUpdate.occurred_at ? statusUpdate.occurred_at.split('T')[0] : formatDateToYYYYMMDD(new Date());
                          setStatusUpdate(prev => ({ ...prev, occurred_at: `${dateStr}T${timeStr}:00` }));
                        }} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                    <textarea name="note" value={statusUpdate.note} onChange={handleStatusChange} rows={2} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" placeholder="Add any operational notes..." />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !canSubmitStatusUpdate}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Update Status
                  </button>
                  {!canShareStatusUpdate && (
                    <p className="text-xs text-center text-gray-500">
                      WhatsApp sharing becomes available once the shipment has a saved status with location.
                    </p>
                  )}
                </form>
              ) : (
                shareableStatus && (
                  <p className="text-sm text-gray-600 mb-4">
                    Share the <span className="font-semibold text-gray-900">{shareableStatus.status}</span> update
                    {shareableStatus.location ? ` from ${shareableStatus.location}` : ''} with the sender or receiver.
                  </p>
                )
              )}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${!isDelivered ? 'pt-1' : ''}`}>
                <button
                  type="button"
                  onClick={handleShareStatusToSender}
                  disabled={!canShareStatusUpdate || !formData.sender_phone?.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1fb855] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  Share to Sender
                </button>
                <button
                  type="button"
                  onClick={handleShareStatusToReceiver}
                  disabled={!canShareStatusUpdate || !formData.receiver_phone?.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1fb855] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  Share to Receiver
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-8">Timeline</h2>
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {shipment.history?.map((event: any, eventIdx: number) => {
                  const isLast = eventIdx === shipment.history.length - 1;
                  return (
                    <li key={event.id || eventIdx} className="relative transition-all duration-300 ease-in-out">
                      <div className="relative pb-8">
                        {!isLast ? (
                          <span className="absolute left-5 top-5 -ml-[0.5px] h-full w-[1px] bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex items-start space-x-4">
                          <div>
                            <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm
                              ${event.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                              {event.status === 'Delivered' ? <CheckCircle2 className="w-5 h-5" /> : 
                               event.status === 'In Transit' ? <Truck className="w-5 h-5" /> : 
                               <Clock className="w-5 h-5" />}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col pt-1.5">
                            <div className="flex justify-between items-start mb-1">
                               <p className="text-sm font-bold text-gray-900">{event.status}</p>
                               <time className="whitespace-nowrap text-xs text-gray-500" dateTime={event.occurred_at}>
                                 {formatDateTime(event.occurred_at)}
                               </time>
                            </div>
                            {event.location && (
                               <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                 <MapPin className="w-3.5 h-3.5" /> {event.location}
                               </p>
                            )}
                            {event.note && (
                               <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                 "{event.note}"
                               </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
