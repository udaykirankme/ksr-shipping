import { prisma } from '@/lib/db';
import { getBusinessMonthRange } from '@/lib/datetime';

export type DashboardStats = {
  createdShipments: number;
  deliveredShipments: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  recentShipments: unknown[];
  statusCounts: Record<string, number>;
};

const ACTIVE_SHIPMENT_WHERE = { is_active: true };

export async function getDashboardStats(month?: number, year?: number): Promise<DashboardStats> {
  const { gte: monthStart, lt: monthEnd } = getBusinessMonthRange(month, year);
  const monthWhere = {
    ...ACTIVE_SHIPMENT_WHERE,
    booked_date: { gte: monthStart, lt: monthEnd },
  };

  const [
    createdShipments,
    deliveredShipments,
    financials,
    statusGroups,
    recentShipments,
  ] = await Promise.all([
    prisma.shipment.count({ where: monthWhere }),
    prisma.shipment.count({
      where: { ...monthWhere, current_status: 'Delivered' },
    }),
    prisma.shipment.aggregate({
      where: monthWhere,
      _sum: { received_amount: true, profit: true },
    }),
    prisma.shipment.groupBy({
      by: ['current_status'],
      where: ACTIVE_SHIPMENT_WHERE,
      _count: { _all: true },
    }),
    prisma.shipment.findMany({
      where: ACTIVE_SHIPMENT_WHERE,
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        tracking_id: true,
        sender_name: true,
        receiver_name: true,
        receiver_city: true,
        destination: true,
        booked_date: true,
        current_status: true,
      },
    }),
  ]);

  const statusCounts = statusGroups.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.current_status] = curr._count._all;
    return acc;
  }, {});

  return {
    createdShipments,
    deliveredShipments,
    monthlyRevenue: financials._sum.received_amount ?? 0,
    monthlyProfit: financials._sum.profit ?? 0,
    recentShipments: JSON.parse(JSON.stringify(recentShipments)),
    statusCounts,
  };
}
