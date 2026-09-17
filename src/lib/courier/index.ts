import { CourierProvider } from './types';
import { DelhiveryB2CProvider } from './providers/delhivery-b2c';
import { DelhiveryB2BProvider } from './providers/delhivery-b2b';
import { DTDCProvider } from './providers/dtdc';

export function getCourierProvider(serviceName: string | null | undefined): CourierProvider {
  if (!serviceName) {
    throw new Error("No courier service specified for this shipment.");
  }

  // Remove spaces and dashes for safe comparison
  const normalizedService = serviceName.toLowerCase().replace(/[\s\-]+/g, '');

  if (normalizedService === 'delhiveryb2b') {
    return new DelhiveryB2BProvider();
  }

  if (normalizedService === 'delhiveryb2c') {
    return new DelhiveryB2CProvider();
  }

  if (normalizedService.includes('dtdc')) {
    return new DTDCProvider();
  }

  // Note: XpressBees has been explicitly excluded from this implementation phase.
  // It can be added here later.

  // Fallback for unknown services
  throw new Error(`Courier provider for service '${serviceName}' is not implemented or configured yet.`);
}

export * from './types';
