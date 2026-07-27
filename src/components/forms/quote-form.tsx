"use client";

import { useState } from "react";
import { quoteRequestSchema, QuoteRequestFormValues } from "@/lib/validations/quote";
import { createQuote } from "@/lib/quote-service";
import { PremiumSelect } from "@/components/ui/PremiumSelect";

interface QuoteFormProps {
  source?: "ADMIN" | "PUBLIC";
  onSuccess?: (quoteId: string) => void;
  onCancel?: () => void;
}

export function QuoteForm({ source = "ADMIN", onSuccess, onCancel }: QuoteFormProps) {
  const [formData, setFormData] = useState<QuoteRequestFormValues>({
    name: "",
    phone: "",
    email: "",
    pickup_location: "",
    drop_location: "",
    package_type: "",
    approx_weight: "",
    urgency: "",
    notes: "",
    preferred_courier: "",
    preferred_service: "",
    package_description: "",
    additional_requirements: "",
    internal_notes: "",
    source,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear field-level error
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setWarnings([]);
    setSubmitError("");
    setLoading(true);

    const validation = quoteRequestSchema.safeParse(formData);
    if (!validation.success) {
      const formatted = validation.error.format();
      const newErrors: Record<string, string> = {};
      Object.keys(formatted).forEach((key) => {
        const field = (formatted as Record<string, { _errors?: string[] }>)[key];
        if (key !== "_errors" && field?._errors?.[0]) {
          newErrors[key] = field._errors[0];
        }
      });
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await createQuote(validation.data);
      if (res.warnings && res.warnings.length > 0) {
        setWarnings(res.warnings);
      }
      if (onSuccess && res.quote?.id) {
        onSuccess(res.quote.id);
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setSubmitError(errorMsg || (err instanceof Error ? err.message : "Failed to submit quote"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 font-medium text-sm">
          {submitError}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm">
          <ul className="list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Customer Information */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all ${
                errors.name ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all ${
                errors.phone ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              }`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all ${
                errors.email ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Shipment Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipment Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location (Origin)</label>
            <input
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Drop Location (Destination)</label>
            <input
              name="drop_location"
              value={formData.drop_location}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Package Type</label>
            <PremiumSelect
              value={formData.package_type || ''}
              onChange={(value) => handleChange({ target: { name: 'package_type', value } } as any)}
              options={[
                { label: "Document", value: "Document" },
                { label: "Parcel", value: "Parcel" },
                { label: "Heavy Cargo", value: "Heavy Cargo" },
                { label: "Fragile", value: "Fragile" }
              ]}
              placeholder="Select Type..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Approximate Weight</label>
            <input
              name="approx_weight"
              placeholder="e.g., 5 kg"
              value={formData.approx_weight}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Package Description / Contents</label>
            <textarea
              name="package_description"
              value={formData.package_description}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Preferences & Additional Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
            <PremiumSelect
              value={formData.urgency || ''}
              onChange={(value) => handleChange({ target: { name: 'urgency', value } } as any)}
              options={[
                { label: "Standard", value: "Standard" },
                { label: "Express", value: "Express" },
                { label: "Immediate", value: "Immediate" }
              ]}
              placeholder="Select Urgency..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Courier</label>
            <input
              name="preferred_courier"
              placeholder="e.g., FedEx, DHL"
              value={formData.preferred_courier}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any specific requests or questions..."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
            />
          </div>

          {source === "ADMIN" && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes (Admin Only)</label>
              <textarea
                name="internal_notes"
                value={formData.internal_notes}
                onChange={handleChange}
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-gray-50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 shadow-sm disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting..." : "Submit Quote Request"}
        </button>
      </div>
    </form>
  );
}
