"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { business } from "@ksr/config";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/why-choose-us" },
  { name: "Services", href: "/services" },
  { name: "Support", href: "/support" },
  { name: "Track Shipment", href: "/track" },
  { name: "Contact Us", href: "/contact" },
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
          <Link href="/" className="flex items-center gap-2 z-50">
             <div className="relative h-10 lg:h-12 w-32 lg:w-40">
                <Image src={business.logoUrl || '/logo.png'} alt={business.name} fill className="object-contain object-left" sizes="160px" />
             </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex space-x-1 lg:space-x-6 items-center">
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
             <a href={`tel:${business.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-sm font-bold text-gray-800 hover:text-orange-600 transition-colors px-4 py-2 rounded-full border border-gray-200 hover:border-orange-200 bg-white">
                <Phone className="w-4 h-4 text-orange-500" />
                <span className="hidden xl:inline">Call Us</span>
             </a>
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
               className="p-2 text-gray-900 focus:outline-none"
               aria-label="Toggle Menu"
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
              
              <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                 <a
                    href={`tel:${business.phone.replace(/\s+/g, '')}`}
                    className="flex justify-center items-center gap-2 w-full bg-gray-50 text-gray-900 px-5 py-3.5 rounded-xl text-base font-bold border border-gray-200 transition-all duration-300 hover:bg-gray-100 hover:border-gray-300 active:scale-95"
                 >
                    <Phone className="w-5 h-5 text-orange-500" />
                    Call {business.phone}
                 </a>
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
