import { defineEventHandler, readBody, setCookie, HTTPError } from 'nitro/h3';
import { createJWT } from '../../utils/auth.ts';
import { jwtVerify } from 'jose';
import { useRuntimeConfig } from 'nitro/runtime-config';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody<{ refreshToken: string }>(event);

    if (!body || !body.refreshToken) {
        throw new HTTPError('Refresh token required', { status: 401 });
    }

    const secret = new TextEncoder().encode(config.jwtSecret as string);

    let payload: any;
    try {
        const verified = await jwtVerify(body.refreshToken, secret);
        payload = verified.payload;
    } catch (err) {
        throw new HTTPError('Invalid refresh token', { status: 401 });
    }

    if (!payload.refresh) {
        throw new HTTPError('Not a refresh token', { status: 400 });
    }

    const user = {
        name: payload.name as string,
        roles: payload.roles as string[],
    };

    const token = await createJWT(user, '10m', false);
    const refreshToken = await createJWT(user, '30d', true);

    setCookie(event, 'token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });

    return { success: true, refreshToken };
});
