import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-[70vh] bg-white flex flex-col items-center justify-center text-center px-4" aria-labelledby="not-found-heading">
      <p className="text-9xl font-black text-gray-100 mb-4" aria-hidden="true">
        404
      </p>
      <h1 id="not-found-heading" className="text-3xl font-bold text-gray-900 mb-2">
        Package Not Found
      </h1>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved or the tracking link is invalid.
      </p>
      <Link
        href="/"
        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-orange-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        Return Home
      </Link>
    </section>
  );
}
