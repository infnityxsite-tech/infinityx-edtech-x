import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { appRouter } from '../../server/routers';
import { createContext } from '../../server/_core/context';

export default async function handler(req: VercelRequest, res: VercelResponse) {

  const url = new URL(req.url || '', `https://${req.headers.host}`);

  const fetchRequest = new Request(url.toString(), {
    method: req.method,
    headers: req.headers as any,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: fetchRequest,
    router: appRouter,
    createContext() {
      return createContext({ req, res });
    },
  });

  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.send(await response.text());
}
