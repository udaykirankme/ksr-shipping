"use client";

import Image from "next/image";

export function WhatsAppButton() {
  const whatsappNumber = "919963814267";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello%20KSR%20Shipping%20Services`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:shadow-[0_0_30px_rgba(37,211,102,0.6)] hover:scale-[1.05] active:scale-95 transition-all duration-300 cursor-pointer"
      aria-label="Chat with us on WhatsApp"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-full overflow-hidden border-2 border-white bg-white">
        <Image 
          src="/whatsapp logo.jpg"
          alt="WhatsApp"
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
    </a>
  );
}
