import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncTracking } from '@/lib/courier/sync';

// Next.js config for Vercel Cron
// Optionally you can set maxDuration if this is a long-running job.
export const maxDuration = 60; // 1 minute max duration
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Authentication: Vercel sends the CRON_SECRET in the Authorization header
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not configured.');
    return NextResponse.json(
      { success: false, message: 'Cron secret not configured on server.' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[CRON] Starting batch synchronization for active shipments...');

  try {
    // 1. Find active/non-delivered shipments
    // Only looking for shipments that have an official tracking ID and service
    const activeShipments = await prisma.shipment.findMany({
      where: {
        is_active: true,
        current_status: { not: 'Delivered' },
        official_tracking_id: { not: null },
        service: { not: null },
      },
      select: {
        id: true,
        tracking_id: true,
      }
    });

    console.log(`[CRON] Found ${activeShipments.length} active shipments to synchronize.`);

    let successCount = 0;
    let failCount = 0;

    // 2. Process them in controlled batches
    // (Doing sequentially here to avoid rate-limiting the courier APIs prematurely)
    for (const shipment of activeShipments) {
      try {
        await syncTracking(shipment.id);
        successCount++;
      } catch (err: any) {
        console.error(`[CRON] Failed to sync shipment ${shipment.tracking_id}:`, err.message);
        failCount++;
        // 5. Continue processing other shipments if one fails.
      }
    }

    const success = failCount === 0;

    return NextResponse.json(
      {
        success,
        total: activeShipments.length,
        successful: successCount,
        failed: failCount
      },
      { status: success ? 200 : 500 }
    );

  } catch (err: any) {
    console.error('[CRON] Critical error during batch synchronization:', err);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
