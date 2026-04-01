import { defineEventHandler } from 'nitro/h3';
import { verifyJWT } from '../../utils/auth.ts';

export default defineEventHandler(async (event) => {
    const user = await verifyJWT(event);
    return user;
});
