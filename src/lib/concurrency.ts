/**
 * Centralized in-memory execution coordinator to serialize operations on the same shipment
 * within a Node.js process / serverless execution environment.
 */
interface ActiveLock {
  id: number;
  promise: Promise<any>;
}

const shipmentLocks = new Map<string, ActiveLock>();
let lockSequence = 0;

export function normalizeShipmentKey(identifier: string | null | undefined): string {
  if (!identifier) return '';
  return String(identifier).trim().toUpperCase();
}

/**
 * Executes an async task while holding an exclusive lock on the given shipment key.
 * If another task is already executing for the same shipment on this instance,
 * subsequent tasks are queued sequentially.
 */
export async function runWithShipmentLock<T>(
  identifier: string,
  fn: () => Promise<T>
): Promise<T> {
  const key = normalizeShipmentKey(identifier);
  if (!key) {
    return fn();
  }

  while (shipmentLocks.has(key)) {
    try {
      await shipmentLocks.get(key)!.promise;
    } catch {
      // Ignore previous errors; we wait our turn
    }
  }

  const lockId = ++lockSequence;
  const promise = (async () => {
    try {
      return await fn();
    } finally {
      const active = shipmentLocks.get(key);
      if (active && active.id === lockId) {
        shipmentLocks.delete(key);
      }
    }
  })();

  shipmentLocks.set(key, { id: lockId, promise });
  return promise;
}
