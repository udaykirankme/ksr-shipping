import { NextRequest } from 'next/server';
import app from '@/server/app';
import { handleExpressRequest } from '@/server/adapter';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ slug?: string[] }> };

async function handler(req: NextRequest, context: RouteContext) {
  const { slug = [] } = await context.params;
  const pathname = `/api/${slug.join('/')}`.replace(/\/$/, '') || '/api';
  return handleExpressRequest(app, req, pathname);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
