"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { business } from "@/lib/config";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Why Choose Us", href: "/why-choose-us" },
  { name: "Support", href: "/support" },
  { name: "Track Shipment", href: "/track" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled ? "bg-white shadow-md py-3" : "bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-50" aria-label={`${business.name} — Home`}>
             <div className="relative h-10 lg:h-12 w-32 lg:w-40">
                <Image src={business.logoUrl || '/logo.png'} alt={business.name} fill className="object-contain object-left" sizes="160px" />
             </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex space-x-1 lg:space-x-6 items-center" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                <Link
                  href={link.href}
                  className={cn(
                    "block px-1 py-2 text-sm font-semibold transition-all duration-300 relative group-hover:-translate-y-0.5",
                    pathname === link.href ? "text-orange-500" : "text-gray-800 hover:text-orange-500"
                  )}
                >
                  {link.name}
                  <span className={cn(
                    "absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full rounded-full",
                    pathname === link.href ? "w-full" : ""
                  )} />
                </Link>
              </div>
            ))}
          </nav>

          {/* CTA Button & Right actions */}
          <div className="hidden md:flex items-center space-x-4 ml-4">
             <div className="relative group">
               <a 
                 href={`tel:${business.phone.replace(/\s+/g, '')}`} 
                 className="flex items-center gap-2 text-sm font-bold text-gray-800 hover:text-orange-600 transition-all duration-200 px-4 py-2 rounded-full border border-gray-200 hover:border-orange-300 bg-white hover:shadow-md hover:shadow-orange-500/10 active:scale-95" 
                 aria-label={`Call us at ${business.phone}`}
               >
                  <Phone className="w-4 h-4 text-orange-500 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="hidden xl:inline">Call Us</span>
               </a>

               {/* Hover Quick-Dial Popover */}
               <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                 <div className="bg-white rounded-2xl p-3 shadow-xl border border-orange-100 min-w-[240px] space-y-1.5">
                   <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 pt-1">Direct Call Support</div>
                   <a
                     href={`tel:${business.phone.replace(/\s+/g, '')}`}
                     className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-orange-50 text-gray-800 hover:text-orange-600 transition-all group/item"
                   >
                     <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-orange-600 group-hover/item:bg-orange-500 group-hover/item:text-white flex items-center justify-center transition-colors">
                       <Phone className="w-3.5 h-3.5" />
                     </div>
                     <div>
                       <span className="text-xs font-bold block">{business.phone}</span>
                       <span className="text-[10px] text-gray-500">Primary / WhatsApp</span>
                     </div>
                   </a>
                   {business.phoneSecondary && (
                     <a
                       href={`tel:${business.phoneSecondary.replace(/\s+/g, '')}`}
                       className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-orange-50 text-gray-800 hover:text-orange-600 transition-all group/item"
                     >
                       <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-orange-600 group-hover/item:bg-orange-500 group-hover/item:text-white flex items-center justify-center transition-colors">
                         <Phone className="w-3.5 h-3.5" />
                       </div>
                       <div>
                         <span className="text-xs font-bold block">{business.phoneSecondary}</span>
                         <span className="text-[10px] text-gray-500">Secondary Support</span>
                       </div>
                     </a>
                   )}
                 </div>
               </div>
             </div>

             <Link
                href="/get-quotation"
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] flex items-center justify-center relative overflow-hidden group"
             >
                <span className="relative z-10">Get Quote</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
             </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden z-50 relative">
             <a 
                href={`tel:${business.phone.replace(/\s+/g, '')}`} 
                className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center transition-all active:scale-95 hover:bg-orange-100"
                aria-label="Call Us"
             >
                <Phone className="w-4 h-4" />
             </a>
             <button
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
               className="p-2 text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg"
               aria-label="Toggle Menu"
               aria-expanded={mobileMenuOpen}
               aria-controls="mobile-navigation"
             >
               {mobileMenuOpen ? (
                 <X className={cn("w-6 h-6", isScrolled ? "text-gray-900" : "text-gray-900")} />
               ) : (
                 <Menu className={cn("w-6 h-6", isScrolled ? "text-gray-900" : "text-gray-900")} />
               )}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 w-full bg-white shadow-xl flex flex-col md:hidden border-t border-gray-100 max-h-[calc(100vh-80px)] overflow-y-auto"
            id="mobile-navigation"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <div key={link.name}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300",
                      pathname === link.href ? "bg-orange-50 text-orange-600 shadow-sm" : "text-gray-900 hover:bg-orange-50 hover:text-orange-500"
                    )}
                  >
                    {link.name}
                  </Link>
                </div>
              ))}
              
              <div className="pt-6 mt-6 border-t border-gray-100 space-y-3">
                 <div className="grid grid-cols-1 gap-2">
                   <a
                      href={`tel:${business.phone.replace(/\s+/g, '')}`}
                      className="flex justify-center items-center gap-2 w-full bg-gray-50 text-gray-900 px-4 py-3 rounded-xl text-sm font-bold border border-gray-200 transition-all duration-300 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 active:scale-95"
                   >
                      <Phone className="w-4 h-4 text-orange-500" />
                      Call {business.phone}
                   </a>
                   {business.phoneSecondary && (
                     <a
                        href={`tel:${business.phoneSecondary.replace(/\s+/g, '')}`}
                        className="flex justify-center items-center gap-2 w-full bg-gray-50 text-gray-900 px-4 py-3 rounded-xl text-sm font-bold border border-gray-200 transition-all duration-300 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 active:scale-95"
                     >
                        <Phone className="w-4 h-4 text-orange-500" />
                        Call {business.phoneSecondary}
                     </a>
                   )}
                 </div>
                 <Link
                    href="/get-quotation"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex justify-center w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-3.5 rounded-xl text-base font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:scale-[1.02] active:scale-95 relative overflow-hidden group"
                 >
                    <span className="relative z-10">Get Quote</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl" />
                 </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
