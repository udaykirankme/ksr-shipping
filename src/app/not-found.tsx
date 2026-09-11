import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-[75vh] bg-white flex flex-col items-center justify-center text-center px-4 py-16" aria-labelledby="not-found-heading">
      <p className="text-8xl md:text-9xl font-black text-gray-100 mb-2 select-none" aria-hidden="true">
        404
      </p>
      <h1 id="not-found-heading" className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
        Page or Shipment Link Not Found
      </h1>
      <p className="text-gray-600 mb-8 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
        The page you are looking for may have been moved, renamed, or is temporarily unavailable. Use the helpful links below to navigate back to our courier services.
      </p>
      
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl mb-8">
        <Link href="/" className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all shadow-sm">
          Home
        </Link>
        <Link href="/services" className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-colors">
          All Services
        </Link>
        <Link href="/services/international-courier" className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-colors">
          International Courier
        </Link>
        <Link href="/services/domestic-courier" className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-colors">
          Domestic Courier
        </Link>
        <Link href="/track" className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-colors">
          Track Shipment
        </Link>
        <Link href="/get-quotation" className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-colors">
          Get Quotation
        </Link>
        <Link href="/contact" className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-sm transition-colors">
          Contact Us
        </Link>
      </div>
    </section>
  );
}
