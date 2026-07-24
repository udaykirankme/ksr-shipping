import { ShipmentListClient } from "./shipment-list-client";

export const metadata = {
  title: "Shipments | KSR Shipping Services Admin",
};

export default function ShipmentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <ShipmentListClient />
    </div>
  );
}
