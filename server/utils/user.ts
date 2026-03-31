import { createError, type H3Event, HTTPError } from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { useCouchAdmin } from './couch';

export interface User {
  name: string;
  roles: string[];
}

export const checkLogin = async (event: any, name: string, password: string): Promise<boolean> => {
  try {
    const config = useRuntimeConfig();
    const credentials = btoa(`${name}:${password}`);

    let internalFetch = globalThis.fetch;
    const env = event?.runtime?.cloudflare?.env;

    if (env?.VPC_SERVICE) {
      internalFetch = env.VPC_SERVICE.fetch.bind(env.VPC_SERVICE);
    }

    const response = await internalFetch(`${config.couchUrl}/_session`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${credentials}`,
      },
    });

    if (response.ok) return true;
    console.warn('Cannot login, invalid credentials or couchdb unreachable');
    return false;
  } catch (e: any) {
    console.warn('Cannot login, error: ' + e.message);
    return false;
  }
};

export const getUser = async (name: string, event: H3Event): Promise<User | undefined> => {
  const docId = encodeURIComponent(`org.couchdb.user:${name}`);
  const couch = useCouchAdmin(name, event);
  
  try {
    const user = await couch.request<User>(`/_users/${docId}`);
    return user;
  } catch (e) {
    return undefined;
  }
};

export const getUserOrThrow = async (name: string, event: H3Event): Promise<User> => {
  const user = await getUser(name, event);
  if (!user) {
    throw new HTTPError('User not found', { status: 401 });
  }
  return user;
};
