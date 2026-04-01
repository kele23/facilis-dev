import { defineEventHandler, getQuery, HTTPError } from 'nitro/h3';
import { useCouchAdmin } from '../../../utils/couch.ts';
import { verifyJWT } from '../../../utils/auth.ts';

export default defineEventHandler(async (event) => {
    const user = await verifyJWT(event);
    const projectId = event.context.params?.id;
    const query = getQuery(event);

    const lastChatSeq = query.chatSeq || '0';
    const lastFilesSeq = query.filesSeq || '0';

    if (!projectId) {
        throw new HTTPError('Project ID is required', { status: 400 });
    }

    const client = useCouchAdmin(user.name, event);

    const chatDb = `facilis-chat-${projectId}`;
    const filesDb = `facilis-files-${projectId}`;

    const results = {
        chat: { hasChanges: false, newSeq: lastChatSeq, latestDocId: null as string | null },
        files: { hasChanges: false, newSeq: lastFilesSeq, latestDocId: null as string | null },
    };

    // Check Chat DB
    try {
        const chatInfo = await client.request<any>(`/${chatDb}`);
        results.chat.newSeq = chatInfo.update_seq;
        
        // 1. Check if there are changes since last sequence
        const chatChanges = await client.request<any>(
            `/${chatDb}/_changes?since=${lastChatSeq}&limit=1`
        );
        results.chat.hasChanges = chatChanges.results.length > 0;

        // 2. Regardless of since, find what the absolute latest doc id is to wait for
        const chatLatest = await client.request<any>(
            `/${chatDb}/_changes?descending=true&limit=1`
        );
        if (chatLatest.results?.length > 0) {
            results.chat.latestDocId = chatLatest.results[0].id;
            // Provide context on the specific revision to poll for, or if it was deleted
            (results.chat as any).latestDocDeleted = !!chatLatest.results[0].deleted;
        }

    } catch (e: any) {
        console.warn(`[SYNC-CHECK] Chat DB ${chatDb} not found or inaccessible:`, e.message);
    }

    // Check Files DB
    try {
        const filesInfo = await client.request<any>(`/${filesDb}`);
        results.files.newSeq = filesInfo.update_seq;

        // 1. Check if there are changes since last sequence
        const filesChanges = await client.request<any>(
            `/${filesDb}/_changes?since=${lastFilesSeq}&limit=1`
        );
        results.files.hasChanges = filesChanges.results.length > 0;

        // 2. Regardless of since, find what the absolute latest doc id is to wait for
        const filesLatest = await client.request<any>(
            `/${filesDb}/_changes?descending=true&limit=1`
        );
        if (filesLatest.results?.length > 0) {
            results.files.latestDocId = filesLatest.results[0].id;
            (results.files as any).latestDocDeleted = !!filesLatest.results[0].deleted;
        }

    } catch (e: any) {
        console.warn(`[SYNC-CHECK] Files DB ${filesDb} not found or inaccessible:`, e.message);
    }

    return { 
        success: true, 
        projectId, 
        ...results 
    };
});
