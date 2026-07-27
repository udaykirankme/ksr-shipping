"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { QuoteForm } from '@/components/forms/quote-form';

export default function NewQuotePage() {
  const router = useRouter();

  const handleSuccess = (quoteId: string) => {
    router.push(`/admin/dashboard/quotations/${quoteId}`);
  };

  const handleCancel = () => {
    router.push('/admin/dashboard/quotations');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/dashboard/quotations" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Quote Request</h1>
          <p className="text-sm text-gray-500 mt-1">Manually enter a quote request on behalf of a customer</p>
        </div>
      </div>

      <QuoteForm 
        source="ADMIN"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
