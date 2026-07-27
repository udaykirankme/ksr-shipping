import Link from "next/link";
import Image from "next/image";
import { business } from "@/lib/config";
import { MapPin, Phone, Mail } from "lucide-react";
import { LocationMap } from "@/components/LocationMap";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-xl inline-block shadow-lg leading-none">
               <Image 
                 src="/logo.png" 
                 alt={business.name} 
                 width={180} 
                 height={120} 
                 className="w-36 sm:w-40 h-auto object-contain" 
               />
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mt-4">
              Your trusted partner for domestic and international courier services. We provide fast, secure, and reliable shipping solutions tailored to your needs.
            </p>
            {/* Social & Business Links */}
            <div className="flex flex-col gap-4 mt-6">
               <a href={business.social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors shrink-0">
                     <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </div>
                  <span className="text-sm">@ksr_shipping_services</span>
               </a>
               <a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors shrink-0">
                     <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
                  </div>
                  <span className="text-sm">KSR Shipping Services – A Courier Service</span>
               </a>
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer quick links">
            <h4 className="text-white font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/" className="hover:text-orange-500 transition-colors">Home</Link></li>
              <li><Link href="/services" className="hover:text-orange-500 transition-colors">Our Services</Link></li>
              <li><Link href="/why-choose-us" className="hover:text-orange-500 transition-colors">Why Choose Us</Link></li>
              <li><Link href="/track" className="hover:text-orange-500 transition-colors">Track Shipment</Link></li>
              <li><Link href="/restricted-items" className="hover:text-orange-500 transition-colors">Restricted Items</Link></li>
              <li><a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Reviews on Google Maps</a></li>
              <li><a href={business.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Write a Google Review</a></li>
            </ul>
          </nav>

          {/* Contact */}
          <address className="not-italic">
            <h4 className="text-white font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors block">{business.address}</a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <a href={`tel:${business.phone.replace(/\s+/g, '')}`} className="hover:text-orange-500 transition-colors">{business.phone}</a>
                  {/* @ts-ignore */}
                  {business.phoneSecondary && (
                     <a href={`tel:${business.phoneSecondary.replace(/\s+/g, '')}`} className="hover:text-orange-500 transition-colors">{business.phoneSecondary}</a>
                  )}
                </div>
              </li>
              <li>
                <a href={`mailto:${business.email}`} className="flex items-center gap-3 group hover:text-orange-500 transition-colors">
                  <Mail className="w-5 h-5 text-orange-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{business.email}</span>
                </a>
              </li>
            </ul>
          </address>

          {/* Google Maps Container */}
          <div>
            <h4 className="text-white font-semibold mb-6">Our Location</h4>
            <LocationMap />
          </div>

        </div>

        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} {business.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
