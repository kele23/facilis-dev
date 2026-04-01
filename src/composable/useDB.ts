import PouchDB from 'pouchdb-browser';
import { ref, shallowRef, watch } from 'vue';
import { useAuthStore } from '../stores/auth.ts';
import { apiLogout, doRefreshToken } from '../utils/apiFetch.ts';

const authStore = useAuthStore();
const currentProject = ref<string | null>(null);

const db = shallowRef<PouchDB.Database>();
const remoteDB = shallowRef<PouchDB.Database>();
let syncHandler: PouchDB.Replication.Sync<{}> | null = null;

const filesDB = shallowRef<PouchDB.Database>();
const remoteFilesDB = shallowRef<PouchDB.Database>();
let filesSyncHandler: PouchDB.Replication.Sync<{}> | null = null;

const chatReady = ref(false);
const filesReady = ref(false);
const isOnline = ref(navigator.onLine);
window.addEventListener('online', () => (isOnline.value = true));
window.addEventListener('offline', () => (isOnline.value = false));

watch(
    [() => authStore.isAuthenticated(), currentProject, db, filesDB, isOnline],
    ([isLogged, project, localDb, localFilesDb, online]) => {
        // Chat sync cleanup
        if (syncHandler) {
            syncHandler.cancel();
            syncHandler = null;
        }
        if (remoteDB.value) {
            remoteDB.value.close();
            remoteDB.value = undefined;
        }

        // Files sync cleanup
        if (filesSyncHandler) {
            filesSyncHandler.cancel();
            filesSyncHandler = null;
        }
        if (remoteFilesDB.value) {
            remoteFilesDB.value.close();
            remoteFilesDB.value = undefined;
        }

        // Reset ready flags on cleanup
        chatReady.value = false;
        filesReady.value = false;

        // If offline, we proceed with local data immediately
        if (!online) {
            chatReady.value = true;
            filesReady.value = true;
            return;
        }

        if (isLogged && online && project) {
            const fetchOpts = {
                fetch: async (url: any, opts: any) => {
                    const response = await (PouchDB as any).fetch(url, opts);
                    if (response.status == 401) {
                        const refreshed = await doRefreshToken();
                        if (refreshed) {
                            return await (PouchDB as any).fetch(url, opts);
                        } else {
                            apiLogout();
                        }
                    }
                    return response;
                },
            };

            if (localDb) {
                remoteDB.value = new PouchDB(
                    `${window.location.origin}/couch/facilis-chat-${project}`,
                    fetchOpts,
                );
                syncHandler = localDb
                    .sync(remoteDB.value, {
                        live: true,
                        retry: true,
                    })
                    .on('paused', () => {
                        console.log('[DB] Chat sync caught up.');
                        chatReady.value = true;
                    })
                    .on('error', (err: any) => {
                        console.warn('[DB] Chat sync error (probably 404 on new project):', err);
                    })
                    .on('denied', (err: any) => {
                        console.error('[DB] Chat sync denied:', err);
                    });
            }

            if (localFilesDb) {
                remoteFilesDB.value = new PouchDB(
                    `${window.location.origin}/couch/facilis-files-${project}`,
                    fetchOpts,
                );
                filesSyncHandler = localFilesDb
                    .sync(remoteFilesDB.value, {
                        live: true,
                        retry: true,
                    })
                    .on('paused', () => {
                        console.log('[DB] Files sync caught up.');
                        filesReady.value = true;
                    })
                    .on('error', (err: any) => {
                        console.warn('[DB] Files sync error (probably 404 on new project):', err);
                    })
                    .on('denied', (err: any) => {
                        console.error('[DB] Files sync denied:', err);
                    });
            }
        }
    },
);

export function useDB() {
    const setCurrentProject = async (projectId: string) => {
        if (db.value) {
            db.value.close();
        }
        if (filesDB.value) {
            filesDB.value.close();
        }
        db.value = new PouchDB(`facilis-chat-${projectId}`);
        filesDB.value = new PouchDB(`facilis-files-${projectId}`);
        currentProject.value = projectId;
    };

    return {
        db,
        filesDB,
        currentProject,
        setCurrentProject,
        chatReady,
        filesReady,
    };
}
