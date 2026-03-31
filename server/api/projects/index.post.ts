import { defineEventHandler, readBody, type H3Event } from "nitro/h3";
import { useCouchAdmin } from "../../utils/couch";
import { verifyJWT } from "../../utils/auth";

export default defineEventHandler(async (event: H3Event) => {
  const user = await verifyJWT(event);
  const body = await readBody(event);

  let rawId = body.id || "";
  rawId = String(rawId)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  const projectId = rawId.replace(/[^a-z0-9-]/g, '');

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const client = useCouchAdmin(user.name, event);

  const databases = [
    `facilis-chat-${projectId}`,
    `facilis-files-${projectId}`,
    `facilis-data-${projectId}`,
  ];

  // Configura i database
  for (const dbName of databases) {
    // Crea il DB (ignora errore se esiste)
    try {
      await client.request(`/${dbName}`, { method: "PUT" });
    } catch (e: any) {
      if (!e.message.includes("file_exists")) {
        console.error(`Failed to create db ${dbName}:`, e);
      }
    }

    // Imposta Security Object
    // Developer: user chiamante ha admin read/write
    // Su files e data: metti members { roles: ["user"] }
    // Su chat: members { names: [user.name] } => solo il developer o ruoli specifici
    const securityObject = {
      admins: {
        names: [user.name],
        roles: [],
      },
      members: {
        names: dbName.startsWith("facilis-chat-") ? [user.name] : [],
        roles: dbName.startsWith("facilis-chat-") ? [] : ["user"], // allow standard users to access files/data if required
      },
    };

    await client.request(`/${dbName}/_security`, {
      method: "PUT",
      body: JSON.stringify(securityObject),
    });
  }

  // Crea/Aggiorna il database globale dei progetti "projects"
  try {
    await client.request("/facilis-projects", { method: "PUT" });
    // Crea sicurezza: accessibile solo tramite backend (admin)
  } catch (e: any) {
    if (!e.message.includes("file_exists")) {
        console.error("Failed to create meta db projects:", e);
    }
  }

  // Fetch default AI settings from user profile
  let aiProvider = null;
  let aiToken = null;
  try {
    const docId = encodeURIComponent(`org.couchdb.user:${user.name}`);
    const userDoc = await client.request<any>(`/_users/${docId}`);
    if (userDoc.aiProvider && userDoc.aiToken) {
      aiProvider = userDoc.aiProvider;
      aiToken = userDoc.aiToken;
    }
  } catch(e) { /* ignore */ }

  // Inserisci metadata del progetto
  try {
    await client.request(`/facilis-projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: projectId,
        developers: [user.name],
        users: [],
        aiProvider,
        aiToken,
        createdAt: new Date().toISOString()
      })
    });
  } catch(e: any) {
    console.error("Failed to save project metadata", e);
  }

  return { success: true, projectId, databases };
});
