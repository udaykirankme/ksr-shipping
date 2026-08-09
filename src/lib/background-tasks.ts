type Task = () => Promise<void>;

const taskRegistry = new Map<string, Task[]>();

/**
 * Registers an asynchronous background task to be executed natively by Next.js `after()`.
 * This acts as a bridge to escape the Express `supertest` context boundary.
 * 
 * @param requestId The unique ID of the current request.
 * @param task A closure capturing only primitive data (do NOT capture req/res).
 */
export function registerBackgroundTask(requestId: string, task: Task) {
  if (!taskRegistry.has(requestId)) {
    taskRegistry.set(requestId, []);
  }
  taskRegistry.get(requestId)!.push(task);
}

/**
 * Retrieves and completely removes all tasks registered for a request ID.
 * Mathematically guarantees tasks can only be retrieved once.
 */
export function getAndClearBackgroundTasks(requestId: string): Task[] {
  const tasks = taskRegistry.get(requestId) || [];
  taskRegistry.delete(requestId);
  return tasks;
}
