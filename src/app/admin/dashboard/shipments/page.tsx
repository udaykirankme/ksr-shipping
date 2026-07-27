import { ShipmentListClient } from "./shipment-list-client";
import { getShipmentsList } from "@/lib/shipments-query";

export const metadata = {
  title: "Shipments | KSR Shipping Services Admin",
};

export default async function ShipmentsPage() {
  const initial = await getShipmentsList({ page: 1, limit: 10, isActive: true });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <ShipmentListClient
        initialShipments={initial.shipments}
        initialTotal={initial.total}
      />
    </div>
  );
}
