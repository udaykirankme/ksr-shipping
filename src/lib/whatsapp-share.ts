import { business } from '@/lib/config';
import { formatDateTime } from '@/lib/format';

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91')) return digits;
  return digits;
}

function getTrackUrl(trackingId: string): string {
  if (typeof window === 'undefined') {
    return `/track?id=${trackingId}`;
  }
  return `${window.location.origin}/track?id=${trackingId}`;
}

function formatOccurredAtLabel(occurredAt: string): string {
  if (!occurredAt) return 'N/A';
  const [datePart, timePart = '00:00:00'] = occurredAt.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  if (!year || !month || !day) return 'N/A';
  return formatDateTime(new Date(year, month - 1, day, hours || 0, minutes || 0));
}

export function buildShipmentCreatedShareMessage(
  trackingId: string,
  recipientName?: string,
): string {
  const greeting = recipientName?.trim() ? `Dear ${recipientName.trim()},` : 'Dear Customer,';
  const trackUrl = getTrackUrl(trackingId);

  return `${greeting}

Your shipment has been created successfully with ${business.name}.

Tracking Number: ${trackingId}

You can track your shipment and view real-time status updates here:
${trackUrl}

Thank you for choosing ${business.name}. We appreciate your trust in us.

— Team ${business.name}`;
}

export type StatusUpdateShareDetails = {
  trackingId: string;
  status: string;
  location: string;
  occurredAt: string;
  note?: string;
  recipientName?: string;
};

export function buildStatusUpdateShareMessage(details: StatusUpdateShareDetails): string {
  const greeting = details.recipientName?.trim()
    ? `Dear ${details.recipientName.trim()},`
    : 'Dear Customer,';
  const trackUrl = getTrackUrl(details.trackingId);
  const updatedOn = formatOccurredAtLabel(details.occurredAt);
  const noteBlock = details.note?.trim()
    ? `\nNote: ${details.note.trim()}\n`
    : '\n';

  return `${greeting}

We have an update on your shipment with ${business.name}.

Tracking Number: ${details.trackingId}

Current Status: ${details.status}
Location: ${details.location}
Updated On: ${updatedOn}
${noteBlock}
You can track your shipment and view further status updates here:
${trackUrl}

Thank you for choosing ${business.name}.

— Team ${business.name}`;
}

export function openWhatsAppShare(phone: string, message: string) {
  if (!phone?.trim()) {
    alert('Phone number is not available for this contact.');
    return;
  }

  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) {
    alert('Please enter a valid phone number.');
    return;
  }

  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${normalizedPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
}
