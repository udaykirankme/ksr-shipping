import { notFound } from 'next/navigation';
import { ShipmentDetailClient } from './shipment-detail-client';
import { prisma } from '@/lib/db';
import { isDelhiveryService } from '@/lib/courier/aggregation';

export const dynamic = 'force-dynamic';

async function getShipment(id: string) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { history: { orderBy: { occurred_at: 'desc' } } },
    });
    if (shipment && shipment.customer_update && shipment.history?.length > 0) {
      const isDelhivery = isDelhiveryService(shipment.service, shipment.service_through, shipment.courier);
      if (isDelhivery) {
        const raw = shipment.customer_update.trim().toLowerCase();
        const matchesCourierHistory = shipment.history.some(h => {
          const hNote = (h.note || '').replace(/\[(?:ID|PKG|WBN|AWB):[^\]]+\]/gi, '').trim().toLowerCase();
          const hStatus = (h.status || '').trim().toLowerCase();
          return (hNote && hNote === raw) || (hStatus && hStatus === raw);
        });
        if (matchesCourierHistory) {
          shipment.customer_update = null;
        }
      }
    }
    return shipment;
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
