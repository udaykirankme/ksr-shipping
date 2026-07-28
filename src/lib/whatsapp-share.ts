import { business } from '@/lib/config';
import { formatDateTime } from '@/lib/format';
import { parseBusinessDateTime } from '@/lib/datetime';

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
  return formatDateTime(parseBusinessDateTime(occurredAt));
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

export function buildContactReplyMessage(customerName?: string): string {
  const greeting = customerName?.trim()
    ? `Hello Mr/Mrs. ${customerName.trim()},`
    : 'Hello,';

  return `${greeting}

Thank you for contacting KSR Shipping Services.

We're here to assist you.

Regards,
KSR Shipping Services - A Courier Service`;
}

export function buildQuoteReplyMessage(customerName?: string): string {
  const greeting = customerName?.trim()
    ? `Hello Mr/Mrs. ${customerName.trim()},`
    : 'Hello,';

  return `${greeting}

Thank you for your quotation request.

Based on the details you shared, here is your shipping quotation. If you have any questions or would like to proceed with the booking, please let me know. We'll be happy to assist you.

Regards,
KSR Shipping Services - A Courier Service`;
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
