import { randomBytes } from 'node:crypto';
import { defineEventHandler, readBody, type H3Event } from 'nitro/h3';
import { useCouchAdmin } from '../../utils/couch.js';
import { verifyJWT } from '../../utils/auth.js';

interface ProjectBody {
    id?: string;
}

export default defineEventHandler(async (event: H3Event) => {
    const user = await verifyJWT(event);
    const body = await readBody<ProjectBody>(event);

    let rawId = body?.id || '';
    rawId = String(rawId)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
    const friendlyId = rawId.replace(/[^a-z0-9-]/g, '');

    if (!friendlyId) {
        throw new Error('Project ID is required');
    }

    const secureSuffix = randomBytes(5).toString('hex');
    const projectId = `${friendlyId}-${secureSuffix}`;

    const client = useCouchAdmin(user.name, event);
    
    const roleDev = `p-${projectId}-developer`;
    const roleUser = `p-${projectId}-user`;

    const databases = [
        `facilis-chat-${projectId}`,
        `facilis-files-${projectId}`,
        `facilis-data-${projectId}`,
    ];

    // Configura i database
    for (const dbName of databases) {
        // Crea il DB (ignora errore se esiste)
        try {
            await client.request(`/${dbName}`, { method: 'PUT' });
        } catch (e: any) {
            if (!e.message.includes('file_exists')) {
                console.error(`Failed to create db ${dbName}:`, e);
            }
        }

        // Imposta Security Object
        // Chat: only developers
        // Files & Data: developers and users
        const securityObject = {
            admins: {
                names: [user.name],
                roles: [],
            },
            members: {
                names: [],
                roles: dbName.startsWith('facilis-chat-') ? [roleDev] : [roleDev, roleUser],
            },
        };

        await client.request(`/${dbName}/_security`, {
            method: 'PUT',
            body: JSON.stringify(securityObject),
        });

        // Add validation to files database to restrict write access to developers only
        if (dbName.startsWith('facilis-files-')) {
            const validationDoc = {
                _id: '_design/auth',
                validate_doc_update: `function(newDoc, oldDoc, userCtx) { 
                    if (userCtx.roles.indexOf('${roleDev}') === -1 && userCtx.roles.indexOf('_admin') === -1) { 
                        throw({forbidden: 'Only developers can modify files'}); 
                    } 
                }`.replace(/\s+/g, ' '),
            };

            // Get existing or create new design doc
            try {
                const existing = await client.request<any>(`/${dbName}/_design/auth`).catch(() => null);
                if (existing) {
                    (validationDoc as any)._rev = existing._rev;
                }
                await client.request(`/${dbName}/_design/auth`, {
                    method: 'PUT',
                    body: JSON.stringify(validationDoc),
                });
            } catch (e) {
                console.error(`Failed to set validation on ${dbName}`, e);
            }
        }
    }

    // Crea/Aggiorna il database globale dei progetti "projects"
    try {
        await client.request('/facilis-projects', { method: 'PUT' });
    } catch (e: any) {
        if (!e.message.includes('file_exists')) {
            console.error('Failed to create meta db projects:', e);
        }
    }

    // Update user profile: roles and get default settings
    const docId = encodeURIComponent(`org.couchdb.user:${user.name}`);
    let aiProvider = null;
    let aiToken = null;
    try {
        const userDoc = await client.request<any>(`/_users/${docId}`);
        
        // Add new role if not present
        if (!userDoc.roles) userDoc.roles = [];
        if (!userDoc.roles.includes(roleDev)) {
            userDoc.roles.push(roleDev);
            await client.request(`/_users/${docId}`, {
                method: 'PUT',
                body: JSON.stringify(userDoc),
            });
        }

        if (userDoc.aiProvider && userDoc.aiToken) {
            aiProvider = userDoc.aiProvider;
            aiToken = userDoc.aiToken;
        }
    } catch (e) {
        console.error('Failed to update user roles or fetch settings', e);
    }

    // Inserisci metadata del progetto
    try {
        await client.request(`/facilis-projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: friendlyId,
                projectId,
                roles: {
                    developer: roleDev,
                    user: roleUser
                },
                developers: [user.name],
                users: [],
                aiProvider,
                aiToken,
                createdAt: new Date().toISOString(),
            }),
        });
    } catch (e: any) {
        console.error('Failed to save project metadata', e);
    }

    return { success: true, projectId, databases };
});
