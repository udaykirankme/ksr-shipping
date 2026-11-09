import { ShipmentListClient } from "./shipment-list-client";
import { getShipmentsList } from "@/lib/shipments-query";

export const metadata = {
  title: "Shipments | KSR Shipping Services Admin",
};

export const dynamic = "force-dynamic";

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  let initialShipments: any[] = [];
  let initialTotal = 0;
  let initialError: string | null = null;

  const resolvedParams = searchParams ? await searchParams : {};
  const stage = typeof resolvedParams.stage === 'string' ? resolvedParams.stage : undefined;
  const status = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;

  try {
    const initial = await getShipmentsList({
      page: 1,
      limit: 50,
      isActive: true,
      stage,
      status,
    });
    initialShipments = initial.shipments;
    initialTotal = initial.total;
  } catch (err: any) {
    console.error("Failed to load initial shipments in admin:", err);
    initialError = err?.message || "Database connection error while retrieving shipments";
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 w-full max-w-[1600px] mx-auto flex flex-col h-full min-h-0">
      <ShipmentListClient
        initialShipments={initialShipments}
        initialTotal={initialTotal}
        initialError={initialError}
      />
    </div>
  );
}
