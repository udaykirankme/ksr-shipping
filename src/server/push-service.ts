import webpush from 'web-push';
import { prisma } from '../lib/db';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
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
  async broadcastToAdmins(payload: { title: string; message: string; url?: string }) {
    if (!publicVapidKey || !privateVapidKey) return;

    try {
      const subscriptions = await prisma.pushSubscription.findMany();
      if (subscriptions.length === 0) return;

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.message,
        url: payload.url || '/admin/dashboard',
        icon: '/logo.png', // Assuming we have a logo
        badge: '/favicon.ico'
      });

      const promises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, pushPayload);
        } catch (err: unknown) {
          // If subscription is invalid/gone, remove it
          if ((err as any).statusCode === 410 || (err as any).statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            console.error('Error sending push notification:', err);
          }
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Broadcast push error:', error);
    }
  }
};
