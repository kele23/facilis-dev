import PouchDB from 'pouchdb-browser';
import { ref, shallowRef } from 'vue';
import { useAuthStore } from '../stores/auth.ts';
import { apiLogout, doRefreshToken } from '../utils/apiFetch.ts';

const authStore = useAuthStore();
const currentProject = ref<string | null>(null);

const db = shallowRef<PouchDB.Database>();
const filesDB = shallowRef<PouchDB.Database>();

const isOnline = ref(navigator.onLine);
window.addEventListener('online', () => (isOnline.value = true));
window.addEventListener('offline', () => (isOnline.value = false));

const syncState = ref({
    isSyncing: false,
    isBackgroundSyncing: false,
    lastSync: null as Date | null,
    error: null as string | null
});

const performSync = async (options?: { background?: boolean }) => {
    if (!db.value || !filesDB.value || !currentProject.value || !authStore.isAuthenticated() || !isOnline.value) {
        return;
    }

    try {
        if (options?.background) {
            syncState.value.isBackgroundSyncing = true;
        } else {
            syncState.value.isSyncing = true;
        }
        syncState.value.error = null;

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

        const remoteChatDB = new PouchDB(
            `${window.location.origin}/couch/facilis-chat-${currentProject.value}`,
            fetchOpts,
        );
        const remoteFilesDB = new PouchDB(
            `${window.location.origin}/couch/facilis-files-${currentProject.value}`,
            fetchOpts,
        );

        // Sync Chat
        try {
            await db.value.sync(remoteChatDB, {
                live: false,
                retry: false,
            });
        } catch (e: any) {
            console.warn('[DB] Chat sync warning (potentially 404 on new project):', e.message);
        }

        // Sync Files
        try {
            await filesDB.value.sync(remoteFilesDB, {
                live: false,
                retry: false,
            });
        } catch (e: any) {
            console.warn('[DB] Files sync warning (potentially 404 on new project):', e.message);
        }
        
        syncState.value.lastSync = new Date();
    } catch (err: any) {
        console.error('[DB] Sync error:', err);
        syncState.value.error = err.message || 'Error record processing sync';
    } finally {
        syncState.value.isSyncing = false;
        syncState.value.isBackgroundSyncing = false;
    }
};

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
        performSync,
        syncState
    };
}
