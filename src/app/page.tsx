"use client";

import { motion } from "framer-motion";
import { TrackingWidget } from "@/components/TrackingWidget";
import { WhyChooseCarousel } from "@/components/WhyChooseCarousel";
import { business } from "@/lib/config";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Globe2, Truck, Plane, HeartPulse, Box, Building2, FileText, ArrowUpRight } from "lucide-react";
import { InfiniteCarousel } from "@/components/ui/InfiniteCarousel";
import { TestimonialSocialProof } from "@/components/ui/testimonial-social-proof";

const PARTNERS = [
  { src: "/delhivery logo.jpg", alt: "Delhivery" },
  { src: "/dtdc logo.png", alt: "DTDC" },
  { src: "/shadowfax logo.png", alt: "Shadowfax" },
  { src: "/ekart logo.jpg", alt: "Ekart" },
  { src: "/fedex logo.jpg", alt: "FedEx" },
  { src: "/ups logo.png", alt: "UPS" },
  { src: "/dhl logo.jpg", alt: "DHL" },
];

export default function Home() {




  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-0 lg:min-h-[760px] overflow-hidden bg-orange-50">
        {/* MOBILE BACKGROUND */}
        <div className="lg:hidden absolute inset-x-0 top-0 z-0 pointer-events-none -translate-y-6">
          <Image
            src="/bg_smaller_display1.png"
            alt="Package journey illustration"
            width={800}
            height={1200}
            className="w-full h-auto opacity-100"
            priority
            quality={75}
            sizes="100vw"
            decoding="async"
            fetchPriority="high"
          />
        </div>

        {/* DESKTOP BACKGROUND */}
        <div className="hidden lg:block absolute inset-0 z-0 overflow-hidden pointer-events-none lg:-translate-y-10">
          <Image
            src="/bg.png"
            alt="Package journey illustration"
            fill
            priority
            className="object-cover object-[center_46%] opacity-100"
            style={{ maskImage: 'radial-gradient(ellipse 80% 80% at center, black 60%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 60%, transparent 100%)' }}
            quality={75}
            sizes="(max-width: 1024px) 100vw, 50vw"
            decoding="async"
            fetchPriority="high"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 pt-[104px] pb-8 lg:pt-[200px] lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">

            {/* LEFT TEXT (col-span-6) */}
            <div className="lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-orange-500 font-black text-sm md:text-base lg:text-lg uppercase tracking-wider mb-3">
                  International & Domestic Courier
                </p>
                <h1 className="text-4xl lg:text-6xl font-black leading-[1.05] tracking-tight text-gray-900 mb-4 lg:mb-6">
                  You Decide,<br />
                  <span className="text-orange-500">We Deliver.</span>
                </h1>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 lg:mb-8 max-w-lg"
              >
                <div className="inline-block relative overflow-hidden px-6 py-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_4px_24px_-8px_rgba(249,115,22,0.15)]">
                  <p className="text-base lg:text-lg text-gray-700 font-semibold relative z-10 leading-snug">
                    Reliable. Fast. Secure.<br />Across India and Beyond.
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />
                </div>
              </motion.div>

              <div className="relative z-10 mt-6 lg:mt-0 mb-0 lg:mb-4">
                {/* DESKTOP BUTTONS */}
                <div className="hidden lg:flex items-center gap-3">
                  <Link href="/get-quotation" className="h-10 px-6 text-sm font-semibold rounded-full bg-orange-500 hover:bg-orange-600 text-white inline-flex items-center justify-center whitespace-nowrap transition-colors">
                    Get Quote
                  </Link>
                  <a href={business.googleReviewUrl.includes('http') ? business.googleReviewUrl : "#"} target="_blank" rel="noopener noreferrer" className="h-10 px-6 text-sm font-semibold rounded-full bg-white border border-gray-200 hover:border-orange-300 text-gray-900 inline-flex items-center justify-center gap-2 whitespace-nowrap">
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.369 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.109 -17.884 43.989 -14.754 43.989 Z" /></g></svg> Review Us on Google
                  </a>
                </div>
                {/* MOBILE BUTTONS */}
                <div className="flex lg:hidden flex-row gap-2 w-full">
                  <Link href="/get-quotation" className="flex-1 min-w-0 h-10 px-3 text-xs sm:text-sm font-semibold rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors">
                    Get Quote
                  </Link>
                  <a href={business.googleReviewUrl.includes('http') ? business.googleReviewUrl : "#"} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 h-10 px-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-full bg-white border border-gray-200 hover:border-orange-300 text-gray-900 flex items-center justify-center gap-1.5 transition-colors">
                    <svg viewBox="0 0 24 24" width="14" height="14" className="shrink-0 sm:w-4 sm:h-4" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.369 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.109 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
                    <span className="truncate">Review on Google</span>
                  </a>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="mt-5 lg:mt-6"
                >
                  <div className="inline-flex rounded-2xl bg-white/50 px-4 py-3 backdrop-blur-md border border-white/70 shadow-[0_4px_20px_-8px_rgba(249,115,22,0.12)]">
                    <TestimonialSocialProof userCount="50,000+" />
                  </div>
                </motion.div>

                {/* MOBILE TRACKING - sits right below buttons */}
                <div className="lg:hidden mt-4 mb-24">
                  <TrackingWidget />
                </div>
              </div>
            </div>

            {/* DESKTOP: Tracking Widget */}
            <motion.div
              id="track-widget"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex lg:col-span-6 lg:col-start-7 lg:mt-48 relative z-20 w-full min-w-0 scroll-mt-[90px] mb-16 justify-end"
            >
              <TrackingWidget />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Why Choose KSR Carousel Section */}
      <WhyChooseCarousel />

      {/* 3. Services Scroll Section */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-4"
            >
              <div className="h-[2px] w-8 sm:w-12 bg-orange-200"></div>
              <h2 className="text-sm sm:text-base font-bold text-orange-500 tracking-widest uppercase">
                What We Ship
              </h2>
              <div className="h-[2px] w-8 sm:w-12 bg-orange-200"></div>
            </motion.div>
            <h3 className="mt-4 text-3xl md:text-4xl font-black text-gray-900">Services built around<br />what you&apos;re sending</h3>
          </div>
        </div>

        <div className="flex flex-col gap-6 relative group/container">
          <InfiniteCarousel speed={1}>
            <div className="flex gap-6 pr-6">
              {[
                { id: "international-courier", title: "International Courier", icon: Plane, desc: "Worldwide shipping with customs handled for you." },
                { id: "domestic-courier", title: "Domestic Courier", icon: Truck, desc: "Fast, reliable delivery to every corner of India." },
                { id: "medicine-shipping", title: "Medicine Shipping", icon: HeartPulse, desc: "Careful handling for medicines and health essentials." },
                { id: "fragile-shipping", title: "Fragile Shipping", icon: Box, desc: "Reinforced packaging for fragile and valuable items." },
                { id: "commercial-shipping", title: "Commercial Shipping", icon: Building2, desc: "Smart logistics for business and bulk orders." },
                { id: "document-shipping", title: "Document Shipping", icon: FileText, desc: "Secure delivery of important documents with fast, reliable and trackable service." },
              ].map((service, i) => (
                <Link
                  href={`/services#${service.id}`}
                  key={`s1-${i}`}
                  className="w-[280px] sm:w-[320px] h-[220px] shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:-translate-y-2 hover:border-orange-200 animate-glow group"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3 text-orange-500 transition-colors duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] shrink-0">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{service.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{service.desc}</p>
                  <div className="mt-auto inline-flex h-9 w-full items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-full transition-all duration-300 shadow-sm group-hover:shadow-[0_4px_14px_rgba(249,115,22,0.35)] group-hover:from-orange-600 group-hover:to-orange-700">
                    Learn More <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </InfiniteCarousel>
        </div>
      </section>

      {/* 4. Stats Strip */}
      <section className="py-12 bg-orange-50 border-y border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-orange-200">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">
                15+
              </div>
              <div className="text-gray-600 font-medium text-xs sm:text-sm uppercase tracking-wider">Years Experience</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                <Box className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">
                50K+
              </div>
              <div className="text-gray-600 font-medium text-xs sm:text-sm uppercase tracking-wider">Happy Customers</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">
                150+
              </div>
              <div className="text-gray-600 font-medium text-xs sm:text-sm uppercase tracking-wider">Countries Covered</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">
                99.5%
              </div>
              <div className="text-gray-600 font-medium text-xs sm:text-sm uppercase tracking-wider">On-Time Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trusted Partners Marquee */}
      <section className="py-20 bg-white overflow-hidden relative">
        <div className="text-center mb-10">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Our Trusted Courier Partners</h3>
        </div>

        <div className="flex flex-col gap-6 relative group/container">
          <InfiniteCarousel speed={1}>
            <div className="flex items-center gap-16 px-8">
              {PARTNERS.map((partner, i) => (
                <div key={`partner-${i}`} className="w-32 h-16 relative transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(249,115,22,0.3)] shrink-0">
                  <Image
                    src={partner.src}
                    alt={partner.alt}
                    fill
                    className="object-contain"
                    sizes="128px"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </InfiniteCarousel>
        </div>
      </section>

      {/* 6. CTA Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white to-orange-50/50">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-[0.02]"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Ready to Ship with Us?</h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Experience premium courier services tailored to your personal and business needs. Get started today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/get-quotation" className="w-full sm:w-auto h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full flex items-center justify-center transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:-translate-y-1">
                Get Quote
              </Link>
              <Link href="/contact" className="w-full sm:w-auto h-14 px-8 bg-white border border-gray-200 hover:border-orange-200 text-gray-900 font-bold rounded-full flex items-center justify-center transition-all hover:shadow-lg hover:-translate-y-1">
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
