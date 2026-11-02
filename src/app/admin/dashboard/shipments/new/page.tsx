"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { shipmentService } from '@/lib/shipment-service';
import { getQuote } from '@/lib/quote-service';
import { ArrowLeft, Save, RefreshCw, Share2, Plane, Truck, Check, Copy } from 'lucide-react';
import Link from 'next/link';
import { ServicesApi, ServiceThroughApi, ServiceItem } from '@/lib/services-api';
import { PremiumSelect } from "@/components/ui/PremiumSelect";
import { PremiumDatePicker } from "@/components/ui/PremiumDatePicker";
import { PremiumTimePicker } from "@/components/ui/PremiumTimePicker";
import { formatDateToYYYYMMDD, formatIndianNumberString } from "@/lib/format";
import { toBusinessTimeInput } from "@/lib/datetime";
import {
  buildShipmentCreatedShareMessage,
  buildPackingCreatedShareMessage,
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
  const [entryType, setEntryType] = useState<'shipment' | 'packing'>('shipment');
  const [sameAsReceiver, setSameAsReceiver] = useState(false);
  const [sameAsSender, setSameAsSender] = useState(false);

  const [dbServices, setDbServices] = useState<ServiceItem[]>([]);
  const [dbServiceThrough, setDbServiceThrough] = useState<ServiceItem[]>([]);

  const [formData, setFormData] = useState(() => ({
    official_tracking_id: '',
    shipment_type: '',
    medium: '',
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
    num_packages: '',
    description: '',
    
    paid_amount: '',
    received_amount: '',
    miscellaneous_charges: '',
    
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

  const handleSameAsReceiverChange = (checked: boolean) => {
    setSameAsReceiver(checked);
    if (checked) {
      setSameAsSender(false);
      setFormData(prev => ({
        ...prev,
        sender_name: prev.receiver_name,
        sender_phone: prev.receiver_phone,
        sender_email: prev.receiver_email,
        sender_address: prev.receiver_address,
        sender_city: prev.receiver_city,
        sender_state: prev.receiver_state,
        sender_pincode: prev.receiver_pincode,
        sender_country: prev.receiver_country,
      }));
    }
  };

  const handleSameAsSenderChange = (checked: boolean) => {
    setSameAsSender(checked);
    if (checked) {
      setSameAsReceiver(false);
      setFormData(prev => ({
        ...prev,
        receiver_name: prev.sender_name,
        receiver_phone: prev.sender_phone,
        receiver_email: prev.sender_email,
        receiver_address: prev.sender_address,
        receiver_city: prev.sender_city,
        receiver_state: prev.sender_state,
        receiver_pincode: prev.sender_pincode,
        receiver_country: prev.sender_country,
      }));
    }
  };

    const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const raw = value.replace(/,/g, '');
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      let clean = raw;
      if (clean.length > 1 && clean.startsWith('0') && !clean.startsWith('0.')) {
        clean = clean.replace(/^0+/, '');
        if (clean === '') clean = '0';
      }
      setFormData((prev: any) => ({ ...prev, [name]: clean }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    let value = e.target.value;
    if (e.target.type === 'number') {
      if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
        value = value.replace(/^0+/, '');
        if (value === '') value = '0';
      }
    }
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (sameAsSender && name.startsWith('sender_')) {
        const receiverKey = name.replace('sender_', 'receiver_') as keyof typeof prev;
        if (receiverKey in prev) {
          (updated as any)[receiverKey] = value;
        }
      } else if (sameAsReceiver && name.startsWith('receiver_')) {
        const senderKey = name.replace('receiver_', 'sender_') as keyof typeof prev;
        if (senderKey in prev) {
          (updated as any)[senderKey] = value;
        }
      }

      return updated;
    });

    if (sameAsSender && name.startsWith('receiver_')) {
      setSameAsSender(false);
    }
    if (sameAsReceiver && name.startsWith('sender_')) {
      setSameAsReceiver(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (entryType === 'packing') {
      if (!formData.booked_date) {
        setError('Booked Date is mandatory');
        return;
      }
      const received = parseFloat(formData.received_amount);
      if (!formData.received_amount || isNaN(received) || received <= 0) {
        setError('Received Amount is mandatory and must be greater than 0');
        return;
      }

      setLoading(true);

      try {
        const res = await shipmentService.createShipment({
          entry_type: 'packing',
          booked_date: formData.booked_date,
          booked_time: formData.booked_time,
          received_amount: received,
          paid_amount: 0,
          description: formData.description || 'Packing Service',
          sender_name: formData.sender_name?.trim() || null,
          sender_phone: formData.sender_phone?.trim() || null,
        });
        const resData = res as any;
        setCreatedId(resData.data?.tracking_id || resData.tracking_id || 'SUCCESS');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to record packing');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!formData.shipment_type) {
      setError('Shipment Type is required');
      return;
    }

    if (!formData.estimated_delivery) {
      setError('Estimated Delivery Date is required');
      return;
    }

    if (!formData.service) {
      setError('Service is required');
      return;
    }

    if (!formData.service_through) {
      setError('Service Through is required');
      return;
    }

    if (!formData.medium) {
      setError('Medium is required');
      return;
    }

    if (!formData.num_packages || parseInt(formData.num_packages) <= 0 || isNaN(parseInt(formData.num_packages))) {
      setError('Number of Boxes is required and must be at least 1');
      return;
    }
    
    setLoading(true);

    try {
      const res = await shipmentService.createShipment({
        entry_type: 'shipment',
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        num_packages: parseInt(formData.num_packages),
        paid_amount: parseFloat(formData.paid_amount) || 0,
        received_amount: parseFloat(formData.received_amount) || 0,
        miscellaneous_charges: formData.miscellaneous_charges ? (parseFloat(formData.miscellaneous_charges) || 0) : 0,
        source_quote_id: formData.source_quote_id || null
      });
      const resData = res as any;
      setCreatedId(resData.data?.tracking_id || resData.tracking_id);
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
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {entryType === 'packing' ? 'Packing Recorded Successfully!' : 'Shipment Created Successfully!'}
        </h2>
        <p className="text-gray-500 mb-8">
          {entryType === 'packing' 
            ? 'The packing revenue has been added directly to your monthly profits.' 
            : 'The customer tracking number has been generated securely.'}
        </p>
        
        <div className="bg-gray-50 rounded-2xl p-8 mb-8 border border-gray-100 inline-block min-w-[300px]">
           <span className="block text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
             {entryType === 'packing' ? 'Packing Record ID' : 'Customer Tracking ID'}
           </span>
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
                setSameAsReceiver(false);
                setSameAsSender(false);
                setFormData((prev) => ({
                  ...prev,
                  official_tracking_id: '',
                  shipment_type: '',
                  medium: '',
                  received_amount: '',
                  paid_amount: '',
                  miscellaneous_charges: '',
                  sender_name: '',
                  sender_phone: '',
                  num_packages: '',
                  ...getCurrentBookedDateTime(),
                }));
              }}
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
            >
              {entryType === 'packing' ? 'Record Another Packing' : 'Create Another'}
            </button>
          </div>
          {entryType === 'packing' && formData.sender_phone?.trim() && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() =>
                  openWhatsAppShare(
                    formData.sender_phone,
                    buildPackingCreatedShareMessage(createdId, formData.received_amount, formData.sender_name),
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1fb855] transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share Receipt to Customer
              </button>
            </div>
          )}
          {entryType === 'shipment' && (
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
          )}
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
            <h1 className="text-2xl font-bold text-gray-900">
              {entryType === 'packing' ? 'Record Packing' : 'Create Shipment'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {entryType === 'packing'
                ? 'Record packing charges directly to monthly profit'
                : 'Enter all details to register a new shipment'}
            </p>
          </div>
        </div>
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
        
        {/* Type Selection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                entryType === 'shipment'
                  ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-500 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <input
                type="radio"
                name="entry_type"
                value="shipment"
                checked={entryType === 'shipment'}
                onChange={() => setEntryType('shipment')}
                className="w-4 h-4 text-orange-500 accent-orange-500 cursor-pointer"
              />
              <div>
                <span className="block font-bold text-gray-900">1. Shipment</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Standard shipment with tracking, sender, receiver, and parcel details
                </span>
              </div>
            </label>

            <label
              className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                entryType === 'packing'
                  ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-500 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <input
                type="radio"
                name="entry_type"
                value="packing"
                checked={entryType === 'packing'}
                onChange={() => setEntryType('packing')}
                className="w-4 h-4 text-orange-500 accent-orange-500 cursor-pointer"
              />
              <div>
                <span className="block font-bold text-gray-900">2. Packing</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Packing charges only — credited directly into this month&apos;s profits
                </span>
              </div>
            </label>
          </div>
        </div>

        {entryType === 'packing' ? (
          /* Packing Mode: Basic Info (Booked Date, Customer Name, Contact Number) and Financials (Received Amount) */
          <>
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booked Date <span className="text-red-500">*</span>
                  </label>
                  <PremiumDatePicker 
                    value={formData.booked_date} 
                    onChange={(date) => setFormData((prev: any) => ({ ...prev, booked_date: formatDateToYYYYMMDD(date) }))} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="sender_name"
                    placeholder="Enter customer name"
                    value={formData.sender_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="sender_phone"
                    placeholder="Enter contact number"
                    value={formData.sender_phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Financials</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Received Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    inputMode="decimal"
                    name="received_amount" 
                    value={formatIndianNumberString(formData.received_amount)}
                    onChange={handleMoneyChange} 
                    className="w-full rounded-xl border border-emerald-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-emerald-600 text-lg font-bold bg-emerald-50/40" 
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl flex items-center justify-between border border-emerald-100">
                <div>
                  <span className="block font-semibold text-gray-900">Added to Month&apos;s Profit</span>
                  <span className="text-xs text-gray-500">100% of received packing amount counts as profit</span>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  ₹{Number(formData.received_amount) || 0}
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Shipment Mode */
          <>
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
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        shipment_type: value,
                        medium: value === 'International' ? 'Air' : prev.medium
                      }));
                    }}
                    options={[
                      { label: "Domestic", value: "Domestic" },
                      { label: "International", value: "International" }
                    ]}
                    placeholder="Select Shipment Type..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Date <span className="text-red-500">*</span></label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medium <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all select-none ${
                        formData.medium === 'Surface'
                          ? 'border-orange-500 bg-orange-50/70 text-orange-600 ring-1 ring-orange-500 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="medium"
                        value="Surface"
                        checked={formData.medium === 'Surface'}
                        onChange={handleChange}
                        required
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                      />
                      <Truck className={`w-4 h-4 ${formData.medium === 'Surface' ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span>Surface</span>
                    </label>
                    <label
                      className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all select-none ${
                        formData.medium === 'Air'
                          ? 'border-orange-500 bg-orange-50/70 text-orange-600 ring-1 ring-orange-500 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="medium"
                        value="Air"
                        checked={formData.medium === 'Air'}
                        onChange={handleChange}
                        required
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                      />
                      <Plane className={`w-4 h-4 ${formData.medium === 'Air' ? 'text-orange-500' : 'text-gray-400'}`} />
                      <span>Air</span>
                    </label>
                  </div>
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

                  <div className="pt-4 border-t border-gray-100">
                    <label
                      className={`group flex items-center justify-between p-3.5 sm:px-4 sm:py-3 rounded-2xl border cursor-pointer select-none transition-all duration-200 min-h-[48px] ${
                        sameAsReceiver
                          ? 'border-orange-400 bg-orange-50/70 text-orange-950 ring-1 ring-orange-400/30 shadow-xs'
                          : 'border-gray-200/90 bg-gray-50/50 text-gray-700 hover:border-orange-200 hover:bg-orange-50/30 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="same_as_receiver"
                          checked={sameAsReceiver}
                          onChange={(e) => handleSameAsReceiverChange(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500 peer-focus-visible:ring-offset-2 ${
                            sameAsReceiver
                              ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                              : 'bg-white border-gray-300 group-hover:border-orange-300'
                          }`}
                        >
                          <Check
                            className={`w-3.5 h-3.5 stroke-[3] transition-transform duration-200 ${
                              sameAsReceiver ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                            }`}
                          />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">Same as receiver details</span>
                      </div>
                      <Copy className={`w-4 h-4 transition-colors ${sameAsReceiver ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-400'}`} />
                    </label>
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

                  <div className="pt-4 border-t border-gray-100">
                    <label
                      className={`group flex items-center justify-between p-3.5 sm:px-4 sm:py-3 rounded-2xl border cursor-pointer select-none transition-all duration-200 min-h-[48px] ${
                        sameAsSender
                          ? 'border-orange-400 bg-orange-50/70 text-orange-950 ring-1 ring-orange-400/30 shadow-xs'
                          : 'border-gray-200/90 bg-gray-50/50 text-gray-700 hover:border-orange-200 hover:bg-orange-50/30 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="same_as_sender"
                          checked={sameAsSender}
                          onChange={(e) => handleSameAsSenderChange(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500 peer-focus-visible:ring-offset-2 ${
                            sameAsSender
                              ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                              : 'bg-white border-gray-300 group-hover:border-orange-300'
                          }`}
                        >
                          <Check
                            className={`w-3.5 h-3.5 stroke-[3] transition-transform duration-200 ${
                              sameAsSender ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                            }`}
                          />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">Same as sender details</span>
                      </div>
                      <Copy className={`w-4 h-4 transition-colors ${sameAsSender ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-400'}`} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Package & Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Package Details</h2>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4">
                    <div>
                      <label className="h-10 flex items-end text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <span>Weight (kg) <span className="text-red-500">*</span></span>
                      </label>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        name="weight" 
                        value={formData.weight} 
                        onChange={handleChange} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-gray-900" 
                      />
                    </div>
                    <div>
                      <label className="h-10 flex items-end text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        <span>Number of Boxes <span className="text-red-500">*</span></span>
                      </label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        name="num_packages" 
                        value={formData.num_packages} 
                        onChange={handleChange} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-gray-900" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Description / Contents</label>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      rows={3} 
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none text-gray-900" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Financials</h2>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Received (₹) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        inputMode="decimal" 
                        name="received_amount" 
                        value={formatIndianNumberString(formData.received_amount)} 
                        onChange={handleMoneyChange} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-3 sm:px-4 py-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-emerald-600 font-semibold bg-emerald-50/50 text-base sm:text-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Paid (₹) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        inputMode="decimal" 
                        name="paid_amount" 
                        value={formatIndianNumberString(formData.paid_amount)} 
                        onChange={handleMoneyChange} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-3 sm:px-4 py-2.5 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-red-600 font-semibold bg-red-50/50 text-base sm:text-lg" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 sm:items-center mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700">
                        Miscellaneous Charges (₹)
                      </label>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        name="miscellaneous_charges" 
                        value={formatIndianNumberString(formData.miscellaneous_charges)} 
                        onChange={handleMoneyChange} 
                        className="w-full h-11 rounded-xl border border-gray-200 px-3 sm:px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-amber-700 font-semibold bg-amber-50/40 text-base sm:text-lg" 
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100 mt-6">
                   <span className="font-semibold text-gray-700">Estimated Profit</span>
                   <span className="text-2xl font-bold text-gray-900">
                     ₹{((Number(formData.received_amount) || 0) - (Number(formData.paid_amount) || 0) - (Number(formData.miscellaneous_charges) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                   </span>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.6)] transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : entryType === 'packing' ? 'Save Packing' : 'Save Shipment'}
          </button>
        </div>

      </form>
    </div>
  );
}
