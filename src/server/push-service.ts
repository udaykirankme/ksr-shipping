import webpush from 'web-push';
import { prisma } from '../lib/db';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BNAqPXzCPoBqtz9vsXbnZq5zdFcF_9ddDGmUx5KHQCzgO2ru0p2VMw7LgS3oS8UxHVEon0PJIvws1lYiWHNIrg4';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'guvp9PwTa4M5TkwaAys7yZ0vhZGp9FLWecVXNxrOOI8';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:ksrshippingservice@gmail.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    vapidSubject,
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn('VAPID keys not configured. Push notifications will not work.');
}

export const pushService = {
  async broadcastToAdmins(payload: { title: string; message: string; url?: string; submissionId?: string; type?: string }) {
    if (!publicVapidKey || !privateVapidKey) {
      console.warn('[WebPush] VAPID keys not configured, skipping push notification.');
      return;
    }

    const logPrefix = `[WebPush${payload.submissionId ? ` - ${payload.submissionId}` : ''}]`;
    const startTime = Date.now();

    try {
      console.log(`${logPrefix} Attempting to send push notification ("${payload.title}")`);
      const subscriptions = await prisma.pushSubscription.findMany();
      if (subscriptions.length === 0) {
        console.log(`${logPrefix} No admin subscriptions found. Skipping.`);
        return;
      }
      
      console.log(`${logPrefix} Found ${subscriptions.length} target subscriptions.`);

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.message,
        url: payload.url || '/admin/dashboard',
        icon: '/logo.png', // Assuming we have a logo
        badge: '/favicon.ico'
      });

      let successCount = 0;
      let failureCount = 0;
      let removedCount = 0;

      const promises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, pushPayload);
          successCount++;
        } catch (err: unknown) {
          failureCount++;
          // If subscription is invalid/gone, remove it
          if ((err as any).statusCode === 410 || (err as any).statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
            removedCount++;
          } else {
            console.error(`${logPrefix} Error sending to endpoint ${sub.endpoint.substring(0, 30)}...:`, err);
          }
        }
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;
      console.log(`${logPrefix} Notification broadcast complete in ${duration}ms. Success: ${successCount}, Failed: ${failureCount}, Invalid subscriptions removed: ${removedCount}.`);
    } catch (error) {
      console.error(`${logPrefix} Broadcast push error:`, error);
    }
  },

  /**
   * Schedules a background push by pushing a primitive closure into the global task registry.
   * This operates synchronously and does not block the Express HTTP response.
   */
  scheduleBackgroundPush(req: any, payload: { title: string; message: string; url?: string; submissionId?: string; type?: string }) {
    const requestId = req.headers['x-internal-request-id'];
    
    try {
      if (requestId) {
        // Register the task to be picked up by next/server after()
        const { registerBackgroundTask } = require('@/lib/background-tasks');
        registerBackgroundTask(requestId, async () => {
          await this.broadcastToAdmins(payload);
        });
      } else {
        console.warn('[WebPush] No internal request ID found, push skipped to avoid blocking response.');
      }
    } catch (error) {
      console.error('[WebPush] Failed to register background task:', error);
    }
  }
};
