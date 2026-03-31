import { defineEventHandler, HTTPError } from 'nitro/h3';
import { verifyJWT } from '../../../utils/auth';
import { useCouchAdmin } from '../../../utils/couch';

export default defineEventHandler(async (event) => {
  const user = await verifyJWT(event);
  const projectId = event.context.params?.id;

  if (!projectId) {
    throw new HTTPError('Project ID is required', { status: 400 });
  }

  const client = useCouchAdmin(user.name, event);

  try {
    // Leggi il meta documento per verificare permessi
    const projectDoc = await client.request<any>(`/facilis-projects/${projectId}`);
    
    // Controlla che l'utente sia abilitato (developer)
    if (!projectDoc.developers?.includes(user.name)) {
       throw new HTTPError('Only developers can delete the project', { status: 403 });
    }

    // Droppa i database
    const databases = [
      `facilis-chat-${projectId}`,
      `facilis-files-${projectId}`,
      `facilis-data-${projectId}`,
    ];

    for (const dbName of databases) {
      try {
        await client.request(`/${dbName}`, { method: 'DELETE' });
      } catch(e: any) {
        if (!e.message.includes("not_found")) {
          console.error(`Failed to delete db ${dbName}:`, e);
        }
      }
    }

    // Rimuovi dai meta project (inserendo l'_rev aggiornata per cancellare)
    await client.request(`/facilis-projects/${projectId}?rev=${projectDoc._rev}`, {
      method: 'DELETE'
    });

    return { success: true };
  } catch (err: any) {
    if (err.statusCode || err.status) throw err;
    throw new HTTPError('Failed to delete project', { status: 500 });
  }
});
