import { defineEventHandler, type H3Event } from 'nitro/h3';
import { useCouchAdmin } from '../../utils/couch.ts';
import { verifyJWT } from '../../utils/auth.ts';

export default defineEventHandler(async (event: H3Event) => {
    const user = await verifyJWT(event);
    const client = useCouchAdmin(user.name, event);

    try {
        // Fetch all documents from the facilis-projects database
        const response = await client.request(
            '/facilis-projects/_all_docs?include_docs=true',
        );

        const allProjects = response.rows.map((row: any) => row.doc);

        // Filter projects where the user is either a developer or a user
        const userProjects = allProjects
            .filter((p: any) => {
                const isDev = p.developers && p.developers.includes(user.name);
                const isUsr = p.users && p.users.includes(user.name);
                return isDev || isUsr;
            })
            .map((p: any) => ({
                id: p.name || p._id,
                name: p.name || p._id,
                role:
                    p.developers && p.developers.includes(user.name)
                        ? 'Developer'
                        : 'User',
                createdAt: p.createdAt,
            }));

        return { success: true, projects: userProjects };
    } catch (error: any) {
        // se il DB non esiste ancora ritorniamo array vuoto
        if (
            error.message?.includes('not_found') ||
            error.message?.includes('404')
        ) {
            return { success: true, projects: [] };
        }
        console.error('Error fetching projects', error);
        throw new Error('Failed to fetch projects');
    }
});
