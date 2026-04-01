import {
    defineEventHandler,
    HTTPError,
    readBody,
    setCookie,
    type H3Event,
} from 'nitro/h3';
import { useRuntimeConfig } from 'nitro/runtime-config';
import { checkLogin, getUserOrThrow } from '../../utils/user.ts';
import { SignJWT } from 'jose';

export default defineEventHandler(async (event: H3Event) => {
    const config = useRuntimeConfig();

    const body = await readBody<{ username?: string; password?: string }>(
        event,
    );
    const { username, password } = body || {};

    if (!username || !password) {
        throw new HTTPError('Provide username and password', { status: 401 });
    }

    const ok = await checkLogin(event, username, password);
    if (!ok) {
        throw new HTTPError('Invalid credentials', { status: 401 });
    }

    const user = await getUserOrThrow(username, event);

    const secret = new TextEncoder().encode(config.jwtSecret);

    // Main token
    const token = await new SignJWT({
        sub: user.name,
        name: user.name,
        roles: user.roles,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('10m')
        .sign(secret);

    // Refresh token
    const refreshToken = await new SignJWT({
        name: user.name,
        refresh: true,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('30d')
        .sign(secret);

    // Set cookie
    setCookie(event, 'token', token, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: true,
    });

    return { success: true, refreshToken, user };
});
