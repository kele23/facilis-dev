import { defineEventHandler, readBody, HTTPError } from 'nitro/h3';
import { verifyJWT } from '../../../utils/auth';
import { useCouchAdmin } from '../../../utils/couch';
import { encryptToken } from '../../../utils/crypto';

export default defineEventHandler(async (event) => {
    const user = await verifyJWT(event);
    const projectId = event.context.params?.id;
    const body = await readBody<{
        provider?: string;
        token?: string;
        systemPrompt?: string;
    }>(event);

    if (!projectId) {
        throw new HTTPError('Project ID is required', { status: 400 });
    }

    if (!body?.provider) {
        throw new HTTPError('Provider is required', { status: 400 });
    }

    const couch = useCouchAdmin(user.name, event);

    try {
        // Leggi il meta documento
        const projectDoc = await couch.request<any>(
            `/facilis-projects/${projectId}`,
        );

        // Controlla che l'utente sia abilitato (developer)
        if (!projectDoc.developers?.includes(user.name)) {
            throw new HTTPError(
                'Only developers can configure project settings',
                { status: 403 },
            );
        }

        projectDoc.aiProvider = body.provider;
        projectDoc.systemPrompt = body.systemPrompt;
        if (body.token) {
            projectDoc.aiToken = encryptToken(body.token);
        } else if (!projectDoc.aiToken) {
            throw new HTTPError('Token is required', { status: 400 });
        }

        await couch.request(`/facilis-projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectDoc),
        });

        return { success: true };
    } catch (err: any) {
        console.error('Project settings POST error:', err);
        if (err.statusCode || err.status) throw err; // rethrow h3 errors
        throw new HTTPError(
            'Failed to update project settings: ' + err.message,
            { status: 500 },
        );
    }
});
