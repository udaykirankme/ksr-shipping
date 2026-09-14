import { ShipmentListClient } from "./shipment-list-client";
import { getShipmentsList } from "@/lib/shipments-query";

export const metadata = {
  title: "Shipments | KSR Shipping Services Admin",
};

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const initial = await getShipmentsList({ page: 1, limit: 50, isActive: true });

  return (
    <div className="p-3 sm:p-5 lg:p-6 w-full max-w-[1600px] mx-auto flex flex-col h-full min-h-0">
      <ShipmentListClient
        initialShipments={initial.shipments}
        initialTotal={initial.total}
      />
    </div>
  );
}
