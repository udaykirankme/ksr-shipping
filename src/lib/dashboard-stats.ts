import { prisma } from '@/lib/db';

export type DashboardStats = {
  createdShipments: number;
  deliveredShipments: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  recentShipments: unknown[];
  statusCounts: Record<string, number>;
};

export async function getDashboardStats(month?: number, year?: number): Promise<DashboardStats> {
  const targetDate = new Date();

  if (month && year) {
    targetDate.setFullYear(year);
    targetDate.setMonth(month - 1);
  }

  targetDate.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const firstDayOfNextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
  const monthWhere = {
    booked_date: { gte: firstDayOfMonth, lt: firstDayOfNextMonth },
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
      where: { ...monthWhere, is_active: true },
      _sum: { received_amount: true, profit: true },
    }),
    prisma.shipment.groupBy({
      by: ['current_status'],
      where: monthWhere,
      _count: { _all: true },
    }),
    prisma.shipment.findMany({
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
