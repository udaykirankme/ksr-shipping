import { notFound } from 'next/navigation';
import { ShipmentDetailClient } from './shipment-detail-client';
import { serverApiFetch } from '@/lib/server-api';

async function getShipment(id: string) {
  return serverApiFetch(`/api/admin/shipments/${id}`);
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