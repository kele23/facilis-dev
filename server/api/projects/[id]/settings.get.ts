import { defineEventHandler, HTTPError } from 'nitro/h3';
import { verifyJWT } from '../../../utils/auth.ts';
import { useCouchAdmin } from '../../../utils/couch.ts';

export default defineEventHandler(async (event) => {
    const user = await verifyJWT(event);
    const projectId = event.context.params?.id;

    if (!projectId) {
        throw new HTTPError('Project ID is required', { status: 400 });
    }

    const couch = useCouchAdmin(user.name, event);

    try {
        const projectDoc = await couch.request<any>(
            `/facilis-projects/${projectId}`,
        );

        if (
            !projectDoc.developers?.includes(user.name) &&
            !projectDoc.users?.includes(user.name)
        ) {
            throw new HTTPError('Access denied', { status: 403 });
        }

        return {
            success: true,
            settings: {
                provider: projectDoc.aiProvider || null,
                hasToken: !!projectDoc.aiToken,
                systemPrompt: projectDoc.systemPrompt || '',
            },
        };
    } catch (err: any) {
        if (err.status === 403) throw err;
        throw new HTTPError('Failed to fetch project settings', {
            status: 500,
        });
    }
});
