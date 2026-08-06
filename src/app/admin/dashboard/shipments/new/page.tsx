"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { shipmentService } from '@/lib/shipment-service';
import { getQuote } from '@/lib/quote-service';
import { ArrowLeft, Save, RefreshCw, Share2 } from 'lucide-react';
import Link from 'next/link';
import { ServicesApi, ServiceThroughApi, ServiceItem } from '@/lib/services-api';
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";
import { PremiumTimePicker } from "@/components/ui/PremiumTimePicker";
import { formatDateToYYYYMMDD } from "@/lib/format";
import { toBusinessTimeInput } from "@/lib/datetime";
import {
  buildShipmentCreatedShareMessage,
  openWhatsAppShare,
} from '@/lib/whatsapp-share';

function getCurrentBookedDateTime() {
  const now = new Date();
  return {
    booked_date: formatDateToYYYYMMDD(now),
    booked_time: toBusinessTimeInput(now),
  };
}

export default function NewShipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');

  const [loading, setLoading] = useState(false);
  const [fetchingQuote, setFetchingQuote] = useState(!!quoteId);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [dbServices, setDbServices] = useState<ServiceItem[]>([]);
  const [dbServiceThrough, setDbServiceThrough] = useState<ServiceItem[]>([]);

  const [formData, setFormData] = useState(() => ({
    official_tracking_id: '',
    shipment_type: 'Domestic',
    ...getCurrentBookedDateTime(),
    estimated_delivery: '',
    service: '',
    service_through: '',
    
    sender_name: '',
    sender_phone: '',
    sender_email: '',
    sender_address: '',
    sender_city: '',
    sender_state: '',
    sender_pincode: '',
    sender_country: '',
    
    receiver_name: '',
    receiver_phone: '',
    receiver_email: '',
    receiver_address: '',
    receiver_city: '',
    receiver_state: '',
    receiver_pincode: '',
    receiver_country: '',
    
    weight: '',
    num_packages: '1',
    description: '',
    
    paid_amount: '',
    received_amount: '',
    
    internal_notes: '',
    source_quote_id: ''
  }));

  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...getCurrentBookedDateTime() }));

    Promise.all([
      ServicesApi.getServices(),
      ServiceThroughApi.getItems()
    ]).then(([s, st]) => {
      setDbServices(s.filter(i => i.is_enabled));
      setDbServiceThrough(st.filter(i => i.is_enabled));
    }).catch(console.error);

    if (quoteId) {
      getQuote(quoteId)
        .then(quote => {
          setFormData(prev => ({
            ...prev,
            sender_name: quote.name || '',
            sender_phone: quote.phone || '',
            sender_email: quote.email || '',
            sender_city: quote.pickup_location || '', // mapping location to city for simplicity
            receiver_city: quote.drop_location || '',
            weight: quote.approx_weight ? quote.approx_weight.replace(/[^0-9.]/g, '') : '',
            description: quote.package_description || '',
            internal_notes: quote.internal_notes || '',
            service_through: quote.preferred_courier || '',
            source_quote_id: quote.id
          }));
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load quote details');
        })
        .finally(() => {
          setFetchingQuote(false);
        });
    }
  }, [quoteId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (e.target.type === 'number') {
      if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
        value = value.replace(/^0+/, '');
        if (value === '') value = '0';
      }
    }
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await shipmentService.createShipment({
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        num_packages: parseInt(formData.num_packages) || 1,
        paid_amount: parseFloat(formData.paid_amount) || 0,
        received_amount: parseFloat(formData.received_amount) || 0,
        source_quote_id: formData.source_quote_id || null
      });
      const resData = res as any;
      setCreatedId(resData.tracking_id);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  if (createdId) {
    return (
      <div className="max-w-3xl mx-auto mt-8 bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Shipment Created Successfully!</h2>
        <p className="text-gray-500 mb-8">The customer tracking number has been generated securely.</p>
        
        <div className="bg-gray-50 rounded-2xl p-8 mb-8 border border-gray-100 inline-block min-w-[300px]">
           <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer Tracking ID</span>
           <span className="block text-4xl font-mono font-bold text-orange-500 tracking-wider cursor-pointer hover:text-orange-600 transition-colors" 
                 onClick={() => {
                   navigator.clipboard.writeText(createdId);
                   alert('Copied to clipboard'); // In reality, use sonner toast
                 }}>
             {createdId}
           </span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => router.push('/admin/dashboard/shipments')}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Back to Shipments
            </button>
            <button 
              onClick={() => {
                setCreatedId(null);
                setFormData((prev) => ({
                  ...prev,
                  official_tracking_id: '',
                  ...getCurrentBookedDateTime(),
                }));
              }}
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
            >
              Create Another
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                openWhatsAppShare(
                  formData.sender_phone,
                  buildShipmentCreatedShareMessage(createdId, formData.sender_name),
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1fb855] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!formData.sender_phone?.trim()}
            >
              <Share2 className="w-4 h-4" />
              Share to Sender
            </button>
            <button
              type="button"
              onClick={() =>
                openWhatsAppShare(
                  formData.receiver_phone,
                  buildShipmentCreatedShareMessage(createdId, formData.receiver_name),
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1fb855] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!formData.receiver_phone?.trim()}
            >
              <Share2 className="w-4 h-4" />
              Share to Receiver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/shipments" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Shipment</h1>
            <p className="text-sm text-gray-500 mt-1">Enter all details to register a new shipment</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Shipment'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}

      {fetchingQuote && (
        <div className="p-4 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-medium flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Fetching quote details...
        </div>
      )}

      {formData.source_quote_id && !fetchingQuote && (
        <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-200 font-medium">
          Creating shipment from Quote #{quoteId}. Upon successful creation, the quote will be automatically Closed.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Official Tracking Number <span className="text-red-500">*</span></label>
              <input required name="official_tracking_id" value={formData.official_tracking_id} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Booked Date <span className="text-red-500">*</span></label>
              <PremiumDatePicker 
                value={formData.booked_date} 
                onChange={(date) => setFormData((prev: any) => ({ ...prev, booked_date: formatDateToYYYYMMDD(date) }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Booked Time <span className="text-red-500">*</span></label>
              <PremiumTimePicker 
                value={formData.booked_time} 
                onChange={(time: string) => setFormData((prev: any) => ({ ...prev, booked_time: time }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipment Type <span className="text-red-500">*</span></label>
              <PremiumSelect
                value={formData.shipment_type}
                onChange={(value) => handleChange({ target: { name: 'shipment_type', value } } as any)}
                options={[
                  { label: "Domestic", value: "Domestic" },
                  { label: "International", value: "International" }
                ]}
                placeholder="Select Shipment Type..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Date</label>
              <PremiumDatePicker 
                value={formData.estimated_delivery} 
                onChange={(date) => setFormData((prev: any) => ({ ...prev, estimated_delivery: formatDateToYYYYMMDD(date) }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service <span className="text-red-500">*</span></label>
              <PremiumSelect
                value={formData.service}
                onChange={(value) => handleChange({ target: { name: 'service', value } } as any)}
                options={dbServices.map(s => ({ label: s.name, value: s.slug }))}
                placeholder="Select Service..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Through <span className="text-red-500">*</span></label>
              <PremiumSelect
                value={formData.service_through}
                onChange={(value) => handleChange({ target: { name: 'service_through', value } } as any)}
                options={dbServiceThrough.map(st => ({ label: st.name, value: st.slug }))}
                placeholder="Select Vendor..."
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sender Info */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Sender Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                <input required name="sender_name" value={formData.sender_name} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                  <input required name="sender_phone" value={formData.sender_phone} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" name="sender_email" value={formData.sender_email} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input name="sender_address" value={formData.sender_address} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                  <input required name="sender_city" value={formData.sender_city} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input name="sender_pincode" value={formData.sender_pincode} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Receiver Info */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Receiver Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                <input required name="receiver_name" value={formData.receiver_name} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                  <input required name="receiver_phone" value={formData.receiver_phone} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" name="receiver_email" value={formData.receiver_email} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input name="receiver_address" value={formData.receiver_address} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                  <input required name="receiver_city" value={formData.receiver_city} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input name="receiver_pincode" value={formData.receiver_pincode} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Package & Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Package Details</h2>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg) <span className="text-red-500">*</span></label>
                <input required type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No. of Packages</label>
                <input required type="number" name="num_packages" value={formData.num_packages} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description / Contents</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Financials</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Received Amount (₹)</label>
                <input required type="number" name="received_amount" value={formData.received_amount} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-emerald-600 font-semibold bg-emerald-50/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount (₹)</label>
                <input required type="number" name="paid_amount" value={formData.paid_amount} onChange={handleChange} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-red-600 font-semibold bg-red-50/50" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
               <span className="font-semibold text-gray-700">Estimated Profit</span>
               <span className="text-2xl font-bold text-gray-900">₹{(Number(formData.received_amount) || 0) - (Number(formData.paid_amount) || 0)}</span>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
