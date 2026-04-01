import { defineEventHandler, HTTPError } from 'nitro/h3';
import { verifyJWT } from '../../utils/auth.ts';
import { useCouchAdmin } from '../../utils/couch.ts';

export default defineEventHandler(async (event) => {
    const user = await verifyJWT(event);
    const couch = useCouchAdmin(user.name, event);
    const docId = encodeURIComponent(`org.couchdb.user:${user.name}`);

    try {
        const userDoc = await couch.request<any>(`/_users/${docId}`);
        return {
            success: true,
            settings: {
                provider: userDoc.aiProvider || null,
                hasToken: !!userDoc.aiToken,
            },
        };
    } catch (err: any) {
        throw new HTTPError('Failed to fetch settings', { status: 500 });
    }
});
