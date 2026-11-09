import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export const SHIPMENT_LIST_SELECT = {
  id: true,
  tracking_id: true,
  official_tracking_id: true,
  sender_name: true,
  sender_city: true,
  receiver_name: true,
  receiver_city: true,
  service: true,
  courier: true,
  current_status: true,
  booked_date: true,
  profit: true,
  is_active: true,
  created_at: true,
} satisfies Prisma.ShipmentSelect;

export type ShipmentListFilters = {
  search?: string;
  status?: string;
  stage?: number | string;
  courier?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  olderThan31Days?: boolean;
  page?: number;
  limit?: number;
};

const STAGE_STATUS_MAP: Record<number, string[]> = {
  0: ['Shipment Created', 'Manifested', 'Manifest Uploaded', 'Ready to Ship', 'Label Created', 'Order Created', 'Not Picked', 'Pickup Scheduled'],
  1: ['Picked Up', 'Shipped', 'Shipment Bagged', 'Shipment Received'],
  2: ['In Transit', 'At Hub', 'Vehicle Departed', 'Vehicle Departed from Client Location', 'Trip Arrived', 'Left Origin', 'Pending'],
  3: ['Out For Delivery', 'Dispatched'],
  4: ['Delivered', 'Successfully Delivered'],
};

function buildShipmentListWhere(filters: ShipmentListFilters): Prisma.ShipmentWhereInput {
  const where: Prisma.ShipmentWhereInput = {
    is_active: filters.isActive ?? true,
  };

  const stageVal = filters.stage !== undefined && filters.stage !== ''
    ? (typeof filters.stage === 'string' ? parseInt(filters.stage, 10) : filters.stage)
    : (filters.status?.startsWith('stage:') ? parseInt(filters.status.replace('stage:', ''), 10) : undefined);

  if (stageVal !== undefined && !isNaN(stageVal) && STAGE_STATUS_MAP[stageVal]) {
    where.current_status = { in: STAGE_STATUS_MAP[stageVal] };
  } else if (filters.status) {
    if (filters.status === 'Non-delivered') {
      where.current_status = { notIn: ['Delivered', 'Successfully Delivered'] };
    } else {
      where.current_status = filters.status;
    }
  }

  if (filters.courier) {
    where.courier = filters.courier;
  }

  if (filters.startDate && filters.endDate) {
    where.booked_date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  } else if (filters.olderThan31Days) {
    const thirtyOneDaysAgo = new Date();
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
    where.booked_date = {
      lt: thirtyOneDaysAgo,
    };
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    where.OR = [
      { tracking_id: { contains: search, mode: 'insensitive' } },
      { official_tracking_id: { contains: search, mode: 'insensitive' } },
      { sender_name: { contains: search, mode: 'insensitive' } },
      { receiver_name: { contains: search, mode: 'insensitive' } },
      { sender_phone: { contains: search, mode: 'insensitive' } },
      { receiver_phone: { contains: search, mode: 'insensitive' } },
      { service: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function getShipmentsList(filters: ShipmentListFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;
  const where = buildShipmentListWhere(filters);

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: SHIPMENT_LIST_SELECT,
      orderBy: [{ booked_date: 'desc' }, { created_at: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    shipments: JSON.parse(JSON.stringify(shipments)),
    total,
    page,
    limit,
  };
}
