import crypto from 'crypto';
import { createError, defineEventHandler, getProxyRequestHeaders, type H3Event } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { verifyJWT } from '../../utils/auth';

export default defineEventHandler(async (event: H3Event) => {
  const user = await verifyJWT(event);
  const config = useRuntimeConfig();

  // generate couch db credentials
  const hash = crypto.createHmac('sha256', config.couchSecret as string || 'default-secret');
  hash.update(user.name);
  const couchToken = hash.digest('hex');

  // generate authentication headers
  const proxyHeaders: Record<string, string> = {
    'X-Auth-CouchDB-UserName': user.name,
    'X-Auth-CouchDB-Roles': user.roles.join(','),
    'X-Auth-CouchDB-Token': couchToken,
  };

  // create real path
  const path = event.node?.req.url || '/';
  const targetPath = path.replace(/^\/couch/, '');
  const targetUrl = `${config.couchUrl}${targetPath}`;

  // Determiniamo il fetch (VPC su Cloudflare oppure globale in dev)
  let internalFetch = globalThis.fetch;
  const env = (event as any)?.runtime?.cloudflare?.env;
  if (env?.VPC_SERVICE) {
    internalFetch = env.VPC_SERVICE.fetch.bind(env.VPC_SERVICE);
  }

  // Costruiamo gli header request replicando il comportamento di H3 proxyRequest
  const fetchHeaders = new Headers(getProxyRequestHeaders(event) as any);
  for (const [key, value] of Object.entries(proxyHeaders)) {
    fetchHeaders.set(key, value);
  }

  const method = event.node?.req.method;
  const payloadMethods = new Set(['PATCH', 'POST', 'PUT', 'DELETE']);
  
  // Use event.web?.request?.arrayBuffer() for safer body streaming in H3
  let requestBody: any = undefined;
  if (payloadMethods.has(method as string)) {
    const webRequest = (event as any).web?.request;
    if (webRequest) {
      const buffer = await webRequest.arrayBuffer();
      requestBody = buffer.byteLength > 0 ? buffer : undefined;
    } else {
      // Fallback
      requestBody = event.node?.req;
    }
  }

  let response: Response;
  try {
    response = await internalFetch(targetUrl, {
      method,
      body: requestBody,
      duplex: requestBody ? 'half' : undefined,
      headers: fetchHeaders,
    } as RequestInit);
  } catch (error) {
    throw createError({ statusCode: 502, cause: error });
  }

  // Filtriamo gli header response esattamente come fa H3 proxy
  const responseHeaders = new Headers();
  for (const [key, value] of response.headers.entries()) {
    if (key === 'content-encoding' || key === 'content-length' || key === 'transfer-encoding') {
      continue;
    }
    responseHeaders.append(key, value);
  }

  // Ritorniamo la Response costruita nativamente per H3
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
});
