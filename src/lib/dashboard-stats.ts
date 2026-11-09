import { isCancelledOrReturnedStatus } from '@/lib/courier/normalization';
import { prisma } from '@/lib/db';
import { getBusinessMonthRange } from '@/lib/datetime';
import { resolveMilestoneFromHistory } from '@/lib/courier/normalization';
import { isDelhiveryService } from '@/lib/courier/aggregation';

export type DashboardStats = {
  createdShipments: number;
  deliveredShipments: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlyWeight: number;
  recentShipments: unknown[];
  statusCounts: Record<string, number>;
  stageCounts: Record<number, number>;
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
    monthShipmentsForProfit,
    statusGroups,
    activeShipmentsForStages,
    recentShipments,
  ] = await Promise.all([
    prisma.shipment.count({ where: monthWhere }),
    prisma.shipment.count({
      where: { ...monthWhere, current_status: 'Delivered' },
    }),
    prisma.shipment.aggregate({
      where: monthWhere,
      _sum: { received_amount: true, weight: true },
    }),
    prisma.shipment.findMany({
      where: monthWhere,
      select: { profit: true, current_status: true },
    }),
    prisma.shipment.groupBy({
      by: ['current_status'],
      where: ACTIVE_SHIPMENT_WHERE,
      _count: { _all: true },
    }),
    prisma.shipment.findMany({
      where: ACTIVE_SHIPMENT_WHERE,
      select: {
        id: true,
        current_status: true,
        customer_update: true,
        service: true,
        service_through: true,
        courier: true,
        history: {
          select: {
            status: true,
            note: true,
            location: true,
            occurred_at: true,
          },
        },
      },
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

  const stageCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const s of activeShipmentsForStages) {
    const isDelhivery = isDelhiveryService(s.service, s.service_through, s.courier);
    const stage = resolveMilestoneFromHistory(s.current_status, s.history, s.customer_update, isDelhivery);
    if (stage >= 0 && stage <= 4) {
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    }
  }

  const rawWeight = financials._sum.weight ?? 0;
  const monthlyWeight = Math.round(rawWeight * 100) / 100;

  const monthlyProfit = monthShipmentsForProfit.reduce((sum, s) => {
    if (isCancelledOrReturnedStatus(s.current_status)) {
      return sum;
    }
    return sum + (s.profit ?? 0);
  }, 0);

  return {
    createdShipments,
    deliveredShipments,
    monthlyRevenue: financials._sum.received_amount ?? 0,
    monthlyProfit,
    monthlyWeight,
    recentShipments: JSON.parse(JSON.stringify(recentShipments)),
    statusCounts,
    stageCounts,
  };
}
