import { NextRequest } from 'next/server';
import app from '@/server/app';
import { handleExpressRequest } from '@/server/adapter';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return handleExpressRequest(app, req, '/health');
}
