import { NextRequest } from 'next/server';
import request from 'supertest';
import type { Express } from 'express';

async function readBody(req: NextRequest): Promise<string | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const text = await req.text();
  return text || undefined;
}

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

  return new Response(supertestRes.text, {
    status: supertestRes.status,
    headers,
  });
}

export async function handleExpressRequest(
  app: Express,
  req: NextRequest,
  pathname: string,
): Promise<Response> {
  const url = new URL(req.url);
  const fullPath = `${pathname}${url.search}`;
  const body = await readBody(req);
  const method = req.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';

  let agent = request(app)[method](fullPath);

  for (const [key, value] of req.headers.entries()) {
    if (key.toLowerCase() === 'host' || key.toLowerCase() === 'content-length') continue;
    agent = agent.set(key, value);
  }

  if (body) {
    agent = agent.send(body);
  }

  const response = await agent;
  return buildResponse(response);
}
