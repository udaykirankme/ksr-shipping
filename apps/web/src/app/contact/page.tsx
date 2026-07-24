"use client";

import { useState } from "react";
import { business } from "@ksr/config";
import { MapPin, Phone, Mail } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: "", phone: "", email: "", message: "" });
      } else {
        setError("Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("A network error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-[104px] lg:pt-[130px] pb-24 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-full bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none bg-center" />

      {/* Header */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">Contact <span className="text-orange-500">KSR Team</span></h1>
           <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
             Have a question, feedback, or need help with a shipment? We&apos;re here for you.
           </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Contact Info */}
            <div>
               <h2 className="text-3xl font-bold text-gray-900 mb-8">Get in Touch</h2>
               <div className="space-y-8">
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">Our Office</h4>
                        <a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-500 transition-colors block leading-relaxed">{business.address}</a>
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">Phone</h4>
                        <a href={`tel:${business.phone.replace(/\s+/g, '')}`} className="text-gray-600 hover:text-orange-500 transition-colors block">{business.phone}</a>
                        {/* @ts-ignore */}
                        {business.phoneSecondary && (
                           <a href={`tel:${business.phoneSecondary.replace(/\s+/g, '')}`} className="text-gray-600 hover:text-orange-500 transition-colors block mt-1">{business.phoneSecondary}</a>
                        )}
                        <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 transition-colors font-medium text-sm mt-2 inline-block">Also available on WhatsApp</a>
                     </div>
                  </div>

                  <a href={`mailto:${business.email}`} className="flex items-start gap-4 group">
                     <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                        <Mail className="w-6 h-6 group-hover:scale-110 transition-transform" />
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">Email</h4>
                        <span className="text-gray-600 group-hover:text-orange-500 transition-colors">{business.email}</span>
                     </div>
                  </a>
               </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 rounded-3xl p-8 sm:p-10 border border-gray-100">
               <h3 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h3>
               
               {success ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-8 rounded-2xl text-center">
                     <h4 className="text-lg font-bold mb-2">Message Sent!</h4>
                     <p className="text-gray-600">We&apos;ll get back to you as soon as possible.</p>
                     <button onClick={() => setSuccess(false)} className="mt-6 text-orange-600 font-semibold hover:text-orange-700">Send another message</button>
                  </div>
               ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                     {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                           {error}
                        </div>
                     )}

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-gray-900" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-gray-900" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-gray-900" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                        <textarea required rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-gray-900"></textarea>
                     </div>

                     <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg py-4 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50">
                        {loading ? 'Sending...' : 'Send Message'}
                     </button>
                  </form>
               )}
            </div>

         </div>
      </div>
    </div>
  );
}
