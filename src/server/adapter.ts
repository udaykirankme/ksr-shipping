import { NextRequest } from 'next/server';
import request from 'supertest';
import type { Express } from 'express';

async function readBody(req: NextRequest): Promise<string | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const text = await req.text();
  return text || undefined;
}

const SKIP_REQUEST_HEADERS = new Set([
  'host',
  'content-length',
  'if-none-match',
  'if-modified-since',
  'if-match',
  'if-unmodified-since',
]);

function buildResponse(supertestRes: request.Response): Response {
  const headers = new Headers();
  for (const [key, value] of Object.entries(supertestRes.headers)) {
    if (value === undefined) continue;
    if (key.toLowerCase() === 'set-cookie') {
      const cookies = Array.isArray(value) ? value : [String(value)];
      for (const cookie of cookies) {
        headers.append('set-cookie', cookie);
      }
      continue;
    }
    headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
  }

  // The Fetch Response constructor rejects 304 in Next.js route handlers.
  const status = supertestRes.status === 304 || supertestRes.status < 200 ? 200 : supertestRes.status;
  headers.delete('etag');

  return new Response(supertestRes.text || null, {
    status,
    headers,
  });
}

export async function handleExpressRequest(
  app: Express,
  req: NextRequest,
  pathname: string,
  requestId?: string
): Promise<Response> {
  const url = new URL(req.url);
  const fullPath = `${pathname}${url.search}`;
  const body = await readBody(req);
  const method = req.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';

  let agent = request(app)[method](fullPath);

  for (const [key, value] of req.headers.entries()) {
    if (SKIP_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    agent = agent.set(key, value);
  }

  if (requestId) {
    agent = agent.set('x-internal-request-id', requestId);
  }

  if (body) {
    agent = agent.send(body);
  }

  const response = await agent;
  return buildResponse(response);
}
