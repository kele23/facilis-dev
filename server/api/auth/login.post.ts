import { defineEventHandler, readBody, setCookie, HTTPError, type H3Event } from 'nitro/h3';
import { createJWT } from '../../utils/auth';
import { checkLogin, getUserOrThrow } from '../../utils/user';

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<{ username?: string; password?: string }>(event);
  const { username, password } = body || {};

  if (!username || !password) {
    throw new HTTPError('Provide username and password', { status: 401 });
  }

  const ok = await checkLogin(event, username, password);
  if (!ok) {
    throw new HTTPError('Invalid credentials', { status: 401 });
  }

  const user = await getUserOrThrow(username, event);

  const token = await createJWT(user as any, "10m", false);
  const refreshToken = await createJWT(user as any, "30d", true);

  setCookie(event, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return { success: true, refreshToken, user };
});
