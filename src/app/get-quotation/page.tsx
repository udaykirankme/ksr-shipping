"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, User, MapPin, Package, ArrowRight, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PremiumSelect } from "@/components/ui/PremiumSelect";

export default function GetQuotationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [success]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    pickup_location: "",
    drop_location: "",
    shipment_type: "",
    package_type: "",
    approx_weight: "",
    urgency: "Standard (2-3 days)",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shipment_type || !formData.package_type) {
      setError("Please select both Shipment Type and Package Type.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/quotations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json().catch(() => null);
        if (data?.errors && data.errors.length > 0) {
          const field = data.errors[0].path[0];
          const msg = data.errors[0].message;
          setError(`Please check your ${field}: ${msg}`);
        } else {
          setError(data?.message || "Failed to submit quotation request. Please try again or contact us directly.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center pt-[104px] lg:pt-[130px] pb-12 sm:px-6 lg:px-8">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="sm:mx-auto sm:w-full sm:max-w-md text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
           >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Request Sent!</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                 Thank you for reaching out. Our team will review your requirements and get back to you with a competitive quotation shortly.
              </p>
              <button 
                 onClick={() => {
                    setSuccess(false);
                    setFormData({...formData, notes: "", approx_weight: "", shipment_type: "", package_type: ""});
                 }}
                 className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-200 shadow-sm text-base font-bold rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none transition-all active:scale-95"
              >
                 Submit another request
              </button>
           </motion.div>
        </div>
     );
  }

  const inputClasses = "w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 outline-none text-gray-900 font-medium placeholder:font-normal placeholder:text-gray-400 hover:border-gray-300";

  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] pb-24 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
         
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-12 lg:mb-16"
         >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-bold mb-6">
              <Truck className="w-4 h-4" />
              Fast & Reliable
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">Get a Free <span className="text-orange-500">Quotation</span></h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
               Fill out the form below and we&apos;ll get back to you with a competitive shipping rate tailored precisely to your needs.
            </p>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100/60"
         >
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 lg:p-12 space-y-12">
               
               {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm font-medium flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                     {error}
                  </div>
               )}

               {/* Section 1: Contact Info */}
               <div className="relative">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <User className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">Your Details</h3>
                        <p className="text-sm text-gray-500 mt-1">Basic contact information</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="sm:col-span-2 group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Full Name *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClasses} placeholder="Srinivas Rao" />
                     </div>
                     <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Phone Number *</label>
                        <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClasses} placeholder="+91 99638 14267" />
                     </div>
                     <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Email Address</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClasses} placeholder="ksrshippingservice@gmail.com" />
                     </div>
                  </div>
               </div>

               <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />

               {/* Section 2: Route */}
               <div className="relative">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <MapPin className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">Route Information</h3>
                        <p className="text-sm text-gray-500 mt-1">Where is the package going?</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Pickup Location *</label>
                        <input type="text" required value={formData.pickup_location} onChange={e => setFormData({...formData, pickup_location: e.target.value})} className={inputClasses} placeholder="City or Pincode" />
                     </div>
                     <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Drop Location *</label>
                        <input type="text" required value={formData.drop_location} onChange={e => setFormData({...formData, drop_location: e.target.value})} className={inputClasses} placeholder="City, Pincode, or Country" />
                     </div>
                  </div>
               </div>

               <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />

               {/* Section 3: Package */}
               <div className="relative">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <Package className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">Package Details</h3>
                        <p className="text-sm text-gray-500 mt-1">What are you sending?</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="group relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Shipment Type *</label>
                        <PremiumSelect 
                           required 
                           value={formData.shipment_type} 
                           onChange={val => setFormData({...formData, shipment_type: val})}
                           placeholder="Select Shipment Type"
                           options={[
                              { value: "International Shipment", label: "International Shipment" },
                              { value: "Domestic Shipment", label: "Domestic Shipment" }
                           ]}
                        />
                     </div>
                     <div className="group relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Package Type *</label>
                        <PremiumSelect 
                           required 
                           value={formData.package_type} 
                           onChange={val => setFormData({...formData, package_type: val})}
                           placeholder="Select Package Type"
                           options={[
                              { value: "Documents", label: "Documents" },
                              { value: "Non-Document", label: "Non-Document" },
                              { value: "Medicines", label: "Medicines" },
                              { value: "Electronics", label: "Electronics" },
                              { value: "Clothing/Apparel", label: "Clothing/Apparel" },
                              { value: "Fragile Items", label: "Fragile Items" },
                              { value: "Other Parcel", label: "Other Parcel" }
                           ]}
                        />
                     </div>
                     <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Approximate Weight *</label>
                        <input type="text" required value={formData.approx_weight} onChange={e => setFormData({...formData, approx_weight: e.target.value})} className={inputClasses} placeholder="e.g. 2.5 kg" />
                     </div>
                     <div className="group relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Delivery Urgency</label>
                        <PremiumSelect 
                           value={formData.urgency} 
                           onChange={val => setFormData({...formData, urgency: val})}
                           options={[
                              { value: "Standard (2-3 days)", label: "Standard (2-3 days)" },
                              { value: "Express (Next day)", label: "Express (Next day)" },
                              { value: "International Standard", label: "International Standard" },
                              { value: "International Priority", label: "International Priority" }
                           ]}
                        />
                     </div>
                     <div className="sm:col-span-2 group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 pl-1 group-focus-within:text-orange-600 transition-colors">Additional Notes</label>
                        <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={cn(inputClasses, "resize-none")} placeholder="Any special instructions, dimensions, or details about the package..."></textarea>
                     </div>
                  </div>
               </div>

               <div className="pt-8">
                  <button type="submit" disabled={loading} className="group w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-lg py-5 rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:-translate-y-1 active:scale-95 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-3 relative overflow-hidden">
                     <span className="relative z-10">{loading ? 'Submitting Request...' : 'Get My Quote'}</span>
                     {!loading && <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />}
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-2xl" />
                  </button>
               </div>

            </form>
         </motion.div>

      </div>
    </div>
  );
}
