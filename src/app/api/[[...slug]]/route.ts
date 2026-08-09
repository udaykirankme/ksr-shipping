import { NextRequest } from 'next/server';
import app from '@/server/app';
import { handleExpressRequest } from '@/server/adapter';
import { after } from 'next/server';
import crypto from 'crypto';
import { getAndClearBackgroundTasks } from '@/lib/background-tasks';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, context: RouteContext) {
  const { slug = [] } = await context.params;
  const pathname = `/api/${slug.join('/')}`.replace(/\/$/, '') || '/api';
  const requestId = crypto.randomUUID();

  let response: Response;
  try {
    response = await handleExpressRequest(app, req, pathname, requestId);
  } finally {
    // Guaranteed cleanup for this request ID
    const tasks = getAndClearBackgroundTasks(requestId);
    if (tasks.length > 0) {
      after(async () => {
        for (const task of tasks) {
          try {
            await task();
          } catch (error) {
            console.error('[WebPush] Background task execution failed:', error);
          }
        }
      });
    }
  }

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
