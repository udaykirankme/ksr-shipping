import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ShipmentDetailClient } from './shipment-detail-client';

async function getShipment(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const res = await fetch(`${API_BASE}/api/admin/shipments/${id}`, {
    headers: {
      Cookie: `auth_token=${token}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  if (json.success && json.data) {
    return json.data;
  }
  return json;
}

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipment = await getShipment(id);

  if (!shipment) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <ShipmentDetailClient shipmentId={id} initialData={shipment} />
    </div>
  );
}