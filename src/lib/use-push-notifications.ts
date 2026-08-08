import { useState, useEffect } from 'react';
import { apiFetch, API_HOST } from './api-client';

export function usePushNotifications() {
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  useEffect(() => {
    let mounted = true;
    if (isSupported) {
      
      const initSW = async () => {
        try {
          await navigator.serviceWorker.register('/sw.js');
          const registration = await navigator.serviceWorker.ready;
          const sub = await registration.pushManager.getSubscription();
          if (mounted) setSubscription(sub);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };
      initSW();
    }
    return () => { mounted = false; };
  }, [isSupported]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result !== 'granted') return false;

      let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        try {
          const res = await apiFetch(`${API_HOST}/api/admin/push/vapid-public-key`, {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.publicKey) {
              vapidPublicKey = data.publicKey;
            }
          }
        } catch (e) {
          console.error('Failed to fetch VAPID public key from backend:', e);
        }
      }

      if (!vapidPublicKey) {
        console.error("VAPID public key is missing. Ensure NEXT_PUBLIC_VAPID_PUBLIC_KEY is set in .env and the server is restarted.");
        alert("Push notifications are not fully configured yet. Please restart your dev server.");
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(sub);
      
      // Send to backend
      await apiFetch(`${API_HOST}/api/admin/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
            auth: arrayBufferToBase64(sub.getKey('auth'))
          }
        }),
        credentials: 'include'
      });

      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    }
  };
  
  const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
    if (!buffer) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const unsubscribe = async () => {
    if (!subscription) return;
    try {
      await apiFetch(`${API_HOST}/api/admin/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        credentials: 'include'
      });
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    subscribe,
    unsubscribe
  };
}
