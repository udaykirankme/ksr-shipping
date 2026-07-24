import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-9xl font-black text-gray-100 mb-4">404</h2>
      <h3 className="text-3xl font-bold text-gray-900 mb-2">Package Not Found</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved or the tracking link is invalid.
      </p>
      <Link href="/" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-orange-500/25">
        Return Home
      </Link>
    </div>
  )
}
