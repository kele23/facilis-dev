import { defineEventHandler, readBody, HTTPError } from 'nitro/h3';
import { verifyJWT } from '../../utils/auth';
import { useCouchAdmin } from '../../utils/couch';
import { encryptToken } from '../../utils/crypto';

export default defineEventHandler(async (event) => {
  const user = await verifyJWT(event);
  const body = await readBody<{ provider?: string; token?: string }>(event);
  
  if (!body?.provider) {
    throw new HTTPError('Provider is required', { status: 400 });
  }

  const couch = useCouchAdmin(user.name, event);
  const docId = encodeURIComponent(`org.couchdb.user:${user.name}`);
  
  try {
    const userDoc = await couch.request<any>(`/_users/${docId}`);
    
    userDoc.aiProvider = body.provider;
    if (body.token) {
      userDoc.aiToken = encryptToken(body.token);
    } else if (!userDoc.aiToken) {
      throw new HTTPError('Token is required', { status: 400 });
    }

    await couch.request(`/_users/${docId}`, {
      method: 'PUT',
      body: JSON.stringify(userDoc),
    });

    return { success: true };
  } catch (err: any) {
    console.error('User settings POST error:', err);
    if (err.statusCode || err.status) throw err;
    throw new HTTPError('Failed to update user settings', { status: 500 });
  }
});
