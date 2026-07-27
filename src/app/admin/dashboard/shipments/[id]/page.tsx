import { notFound } from 'next/navigation';
import { ShipmentDetailClient } from './shipment-detail-client';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getShipment(id: string) {
  try {
    return await prisma.shipment.findUnique({
      where: { id },
      include: { history: { orderBy: { occurred_at: 'desc' } } },
    });
  } catch (error) {
    console.error('Failed to load shipment:', error);
    return null;
  }
}

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipment = await getShipment(id);

  if (!shipment) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <ShipmentDetailClient
        shipmentId={id}
        initialData={JSON.parse(JSON.stringify(shipment))}
      />
    </div>
  );
}
