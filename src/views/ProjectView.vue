<template>
    <div class="flex h-screen w-full bg-base-100 overflow-hidden">
        <!-- Left Section: Chat -->
        <div
            class="w-1/3 border-r border-base-300 bg-base-200 flex flex-col z-20 shadow-xl min-h-0"
        >
            <div class="flex-1 flex flex-col min-w-0 min-h-0">
                <div
                    class="p-4 border-b border-base-300 flex justify-between items-center bg-base-100"
                >
                    <div class="flex items-center gap-2 overflow-hidden flex-1">
                        <button
                            class="btn btn-ghost btn-circle btn-sm flex-shrink-0"
                            @click="router.push('/')"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <!-- History Trigger -->
                        <button
                            class="btn btn-ghost btn-sm px-1 flex-shrink-0 opacity-70 hover:opacity-100"
                            @click="showHistoryModal = true"
                            title="Cronologia"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-5 h-5"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </button>
                        <span class="font-bold text-lg truncate">{{
                            activeThread?.title || 'Vibe Studio'
                        }}</span>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                        <div
                            class="badge badge-primary font-mono text-xs hidden sm:inline-flex"
                        >
                            {{ projectId }}
                        </div>
                        <button
                            class="btn btn-ghost btn-circle btn-sm"
                            @click="showSettingsModal = true"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-5 h-5"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                                />
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <div
                    class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
                    ref="chatContainer"
                >
                    <!-- Chat messages -->
                    <div
                        v-for="msg in filteredMessages"
                        :key="msg._id"
                        class="flex flex-col w-full"
                    >
                        <!-- User Message: Right-aligned capsule -->
                        <div
                            v-if="msg.role === 'user'"
                            class="flex justify-end w-full"
                        >
                            <div
                                class="bg-base-300 text-base-content px-5 py-3 rounded-[28px] max-w-[85%] shadow-sm text-sm"
                            >
                                {{ msg.content }}
                            </div>
                        </div>

                        <!-- Assistant Message: Bubble-less markdown -->
                        <div v-else class="flex flex-col w-full gap-2">
                            <div class="flex items-center gap-2 mb-1">
                                <div
                                    class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        class="w-4 h-4 text-primary"
                                    >
                                        <path
                                            fill-rule="evenodd"
                                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                            clip-rule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span
                                    class="text-xs font-bold opacity-60 uppercase tracking-tighter"
                                    >facilis.dev</span
                                >
                            </div>
                            <div
                                class="prose prose-sm max-w-none text-base-content leading-relaxed markdown-content"
                                v-html="renderMarkdown(msg.content)"
                            ></div>
                        </div>
                    </div>

                    <div
                        v-if="filteredMessages.length === 0"
                        class="flex items-center justify-center h-full opacity-40 flex-col gap-6 py-20"
                    >
                        <div class="grid grid-cols-2 gap-4 w-full max-w-md">
                            <div
                                class="p-4 rounded-2xl bg-base-100 border border-base-300 hover:border-primary transition-colors cursor-pointer text-sm"
                            >
                                Build a Vue.js landing page...
                            </div>
                            <div
                                class="p-4 rounded-2xl bg-base-100 border border-base-300 hover:border-primary transition-colors cursor-pointer text-sm"
                            >
                                Refactor the database logic...
                            </div>
                        </div>
                        <span class="text-xl font-light"
                            >How can I help you today?</span
                        >
                    </div>
                </div>

                <div class="p-6 bg-base-200">
                    <form @submit.prevent="sendMessage" class="relative group">
                        <div
                            class="flex items-center gap-4 bg-base-100 rounded-[32px] px-6 py-2 border border-base-300 focus-within:border-primary/50 transition-all shadow-sm shadow-base-300"
                        >
                            <!-- <button type="button" class="btn btn-ghost btn-circle btn-sm opacity-50 hover:opacity-100">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
               </button> -->
                            <textarea
                                ref="chatInput"
                                v-model="prompt"
                                placeholder="Chiedi a facilis.dev..."
                                class="w-full bg-transparent border-none focus:ring-0 focus:outline-none py-3 text-sm resize-none custom-scrollbar max-h-48"
                                rows="1"
                                :disabled="loading"
                                @keydown.enter="handleEnter"
                                @input="autoResize"
                            ></textarea>
                            <button
                                type="submit"
                                class="btn btn-ghost btn-circle btn-sm flex-shrink-0 self-end mb-1"
                                :class="
                                    prompt.trim()
                                        ? 'text-primary opacity-100'
                                        : 'opacity-20'
                                "
                                :disabled="!prompt.trim() || loading"
                            >
                                <span
                                    v-if="loading"
                                    class="loading loading-spinner loading-sm"
                                ></span>
                                <svg
                                    v-else
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    class="w-6 h-6"
                                >
                                    <path
                                        d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </form>
                    <div class="text-[10px] text-center mt-3 opacity-30">
                        Facilis.dev è una IA e può commettere errori. Verifica
                        le informazioni importanti.
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 flex flex-col min-w-0">
            <ProjectSandbox 
                :projectId="projectId" 
                :appReady="appReady" 
                :activeThreadId="activeThreadId"
            />
        </div>
    </div>

    <!-- Settings Modal Component -->
    <ProjectSettings
        v-model="showSettingsModal"
        :projectId="projectId"
        @settings-loaded="(s) => (projectSettings = s)"
    />

    <!-- History Modal -->
    <dialog
        class="modal modal-bottom sm:modal-middle"
        :class="{ 'modal-open': showHistoryModal }"
    >
        <div class="modal-box p-0 max-w-2xl bg-base-100">
            <ThreadList
                :threads="threads"
                :active-thread-id="activeThreadId"
                @select-thread="handleSelectThread"
                @new-thread="handleNewThread"
                @delete-thread="deleteThread"
            />
            <div class="modal-action p-4 bg-base-200/50 mt-0">
                <button
                    class="btn btn-sm btn-ghost"
                    @click="showHistoryModal = false"
                >
                    Chiudi
                </button>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button @click="showHistoryModal = false">close</button>
        </form>
    </dialog>

    <!-- Initial Sync Loader Overlay -->
    <Transition name="fade">
        <div
            v-if="isSyncing"
            class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-100"
        >
            <div class="relative flex flex-col items-center gap-8">
                <div class="relative w-24 h-24">
                    <div
                        class="absolute inset-0 rounded-full border-t-4 border-primary animate-spin opacity-20"
                    ></div>
                    <div
                        class="absolute inset-0 rounded-full border-r-4 border-primary animate-spin"
                        style="animation-duration: 1.5s"
                    ></div>
                    <div
                        class="absolute inset-0 flex items-center justify-center"
                    >
                        <div
                            class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 rotate-12"
                        >
                            <span class="text-white font-bold text-2xl italic"
                                >f.</span
                            >
                        </div>
                    </div>
                </div>
                <div class="flex flex-col items-center gap-2 text-center">
                    <h2 class="text-xl font-bold text-base-content tracking-tight">
                        Initializing Studio
                    </h2>
                    <p class="text-xs text-base-content/40 font-medium uppercase tracking-[0.2em]">
                        Sincronizzazione in corso...
                    </p>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { marked } from 'marked';
import { useRoute, useRouter } from 'vue-router';
import { useDB } from '../composable/useDB';

import { apiFetch } from '../utils/apiFetch';
import ProjectSandbox from '../components/ProjectSandbox.vue';
import ProjectSettings from '../components/ProjectSettings.vue';
import ThreadList from '../components/ThreadList.vue';

const route = useRoute();
const router = useRouter();
const projectId = route.params.id as string;

const prompt = ref('');
const loading = ref(false);
const appReady = ref(false);
const chatContainer = ref<HTMLDivElement | null>(null);
const chatInput = ref<HTMLTextAreaElement | null>(null);

// Modal & Layout states
const showSettingsModal = ref(false);
const showHistoryModal = ref(false);
const projectSettings = ref<{
    provider: string | null;
    hasToken: boolean;
} | null>(null);

interface ChatMessage {
    _id: string;
    _rev?: string;
    role: 'user' | 'assistant';
    content: string;
    threadId: string;
    timestamp: string;
}

interface ChatThread {
    _id: string;
    _rev?: string;
    type: 'thread';
    title: string;
    createdAt: string;
    updatedAt: string;
}

const messages = ref<ChatMessage[]>([]);
const threads = ref<ChatThread[]>([]);
const activeThreadId = ref<string | null>(null);

const { db, filesDB, setCurrentProject, chatReady, filesReady } = useDB();
const syncTimeoutReached = ref(false);

const isSyncing = computed(() => {
    // If online, wait for both; if offline, we don't wait (or we handle it differently)
    // Adding a safety timeout to avoid permanent lock
    return !syncTimeoutReached.value && (!chatReady.value || !filesReady.value);
});
let changesHandler: any = null;

const activeThread = computed(() =>
    threads.value.find((t) => t._id === activeThreadId.value),
);
const filteredMessages = computed(() =>
    messages.value.filter((m) => m.threadId === activeThreadId.value),
);

async function loadData() {
    await setCurrentProject(projectId);

    if (!db.value) return;

    // Wait for the sync catch-up (max 10s via timeout or sync itself)
    const start = Date.now();
    while (!chatReady.value && !syncTimeoutReached.value && Date.now() - start < 10000) {
        await new Promise(r => setTimeout(r, 100));
    }

    try {
        // Carica tutti i documenti (thread e messaggi)
        const res = await db.value.allDocs({ include_docs: true });
        const allDocs = res.rows.map((r: any) => r.doc);

        // Separa threads e messaggi
        threads.value = allDocs
            .filter((d: any) => d.type === 'thread')
            .sort(
                (a: any, b: any) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime(),
            );

        messages.value = allDocs
            .filter((d: any) => d.role)
            .sort(
                (a: any, b: any) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
            );

        // Se non ci sono thread, ne creiamo uno di default
        if (threads.value.length === 0) {
            await createNewThread('Default Conversation');
        } else if (!activeThreadId.value) {
            // Seleziona il thread più recente
            activeThreadId.value = threads.value[0]._id;
        }

        scrollToBottom();

        // Controllo se ci sono file per mostrare la sandbox
        if (filesDB.value) {
            const fileRes = await filesDB.value.allDocs({ limit: 1 });
            if (fileRes.rows.length > 0) {
                appReady.value = true;
            }
        }
    } catch (e) {
        console.error('Error loading chat data', e);
    }

    // Gestione cambiamenti real-time
    changesHandler = db.value
        .changes({
            since: 'now',
            live: true,
            include_docs: true,
        })
        .on('change', (change: any) => {
            if (change.deleted) {
                messages.value = messages.value.filter(
                    (m) => m._id !== change.id,
                );
                threads.value = threads.value.filter(
                    (t) => t._id !== change.id,
                );
                if (activeThreadId.value === change.id) {
                    activeThreadId.value = threads.value[0]?._id || null;
                }
                return;
            }

            const doc = change.doc;
            if (doc.type === 'thread') {
                const idx = threads.value.findIndex((t) => t._id === doc._id);
                if (idx > -1) threads.value[idx] = doc;
                else threads.value.unshift(doc);
                threads.value.sort(
                    (a: any, b: any) =>
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime(),
                );
            } else if (doc.role) {
                const idx = messages.value.findIndex((m) => m._id === doc._id);
                if (idx > -1) messages.value[idx] = doc;
                else messages.value.push(doc);
                messages.value.sort(
                    (a: any, b: any) =>
                        new Date(a.timestamp).getTime() -
                        new Date(b.timestamp).getTime(),
                );
                if (doc.threadId === activeThreadId.value) scrollToBottom();
            }
        });
}

async function createNewThread(title = 'New Chat') {
    if (!db.value) return;

    const newThread: ChatThread = {
        _id: `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        type: 'thread',
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const res = await db.value.put(newThread as any);
    newThread._rev = res.rev;
    threads.value.unshift(newThread);
    activeThreadId.value = newThread._id;
}

async function handleSelectThread(id: string) {
    selectThread(id);
    showHistoryModal.value = false;
}

async function handleNewThread() {
    await createNewThread();
    showHistoryModal.value = false;
}

async function selectThread(id: string) {
    activeThreadId.value = id;
    scrollToBottom();
}

async function saveVersion(title: string) {
    if (!filesDB.value) return;
    try {
        const res = await filesDB.value.allDocs({ include_docs: true });
        const files: Record<string, string> = {};
        res.rows.forEach((r: any) => {
            // Include only actual app files
            if (r.doc.type === 'file' && r.doc.content) {
                files[r.doc._id] = r.doc.content;
            }
        });

        if (Object.keys(files).length === 0) return;

        const timestamp = Date.now();
        const versionId = `version:${timestamp}`;
        const versionDoc = {
            _id: versionId,
            type: 'snapshot',
            files,
            timestamp: new Date().toISOString(),
            title
        };
        await filesDB.value.put(versionDoc as any);

        // Update $history index
        let historyDoc: any = { _id: '$history', versions: [] };
        try {
            const existing = await filesDB.value.get('$history');
            historyDoc = { ...existing };
        } catch (e) {}

        if (!historyDoc.versions) historyDoc.versions = [];
        historyDoc.versions.unshift({
            id: versionId,
            timestamp: versionDoc.timestamp,
            title
        });

        // Rotation logic: keep only 20
        if (historyDoc.versions.length > 20) {
            const extra = historyDoc.versions.splice(20);
            for (const v of extra) {
                try {
                    const docToDelete = await filesDB.value.get(v.id);
                    await filesDB.value.remove(docToDelete);
                } catch (e) {}
            }
        }

        await filesDB.value.put(historyDoc);
        console.log(`[HISTORY] Saved version: ${versionId}`);
    } catch (e) {
        console.error('[HISTORY] Error saving version', e);
    }
}

async function deleteThread(id: string) {
    if (
        !db.value ||
        !confirm('Are you sure you want to delete this conversation?')
    )
        return;

    try {
        // Trova thread doc
        const threadDoc = threads.value.find((t) => t._id === id);
        if (threadDoc) {
            await db.value.remove(threadDoc as any);
        }

        // Trova e cancella tutti i messaggi associati
        const docsToDelete = messages.value
            .filter((m) => m.threadId === id)
            .map((m) => ({ ...m, _deleted: true }));

        if (docsToDelete.length > 0) {
            await db.value.bulkDocs(docsToDelete as any);
        }
    } catch (e) {
        console.error('Delete thread error', e);
    }
}

function scrollToBottom() {
    nextTick(() => {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
    });
}

async function processAssistantMessage(content: string) {
    if (!filesDB.value) return;

    // Regex to find code blocks with filename hint
    // Format: <!-- filename: path/to/file.ext -->
    const fileRegex =
        /<!--\s*filename:\s*([^\s]+?)\s*-->\s*```[a-z]*\n([\s\S]+?)\n```/g;
    let match;
    const filesToSave = [];

    while ((match = fileRegex.exec(content)) !== null) {
        const filename = match[1];
        const fileContent = match[2];

        filesToSave.push({
            _id: filename,
            type: 'file',
            content: fileContent,
            updatedAt: new Date().toISOString(),
        });
    }

    if (filesToSave.length > 0) {
        console.log(`[FILES] Detected ${filesToSave.length} files to save`);
        try {
            // Find existing revisions to avoid conflicts
            const keys = filesToSave.map((f: any) => f._id);
            const existing = await filesDB.value.allDocs({
                keys,
                include_docs: true,
            });

            const docs = filesToSave.map((fileData: any) => {
                const row: any = existing.rows.find(
                    (r: any) => r.id === fileData._id,
                );
                if (row && row.doc) {
                    return { ...fileData, _rev: row.doc._rev };
                }
                return fileData;
            });

            await filesDB.value.bulkDocs(docs);
            appReady.value = true;
            return true;
        } catch (e) {
            console.error('[FILES] Error in bulk save', e);
            return false;
        }
    }
    return false;
}

async function sendMessage() {
    if (!prompt.value.trim() || loading.value || !activeThreadId.value) return;

    if (!projectSettings.value?.hasToken) {
        alert(
            'Please configure your AI Provider API token in the settings first.',
        );
        showSettingsModal.value = true;
        return;
    }

    const content = prompt.value.trim();
    prompt.value = '';

    if (chatInput.value) {
        chatInput.value.style.height = 'auto';
    }

    const msg: ChatMessage = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        role: 'user',
        content,
        threadId: activeThreadId.value,
        timestamp: new Date().toISOString(),
    };

    try {
        loading.value = true;
        if (db.value) await db.value.put(msg as any);

        // Auto-rename thread if it's the first message
        if (
            activeThread.value?.title === 'New Chat' ||
            activeThread.value?.title === 'Default Conversation'
        ) {
            const updatedThread = {
                ...activeThread.value,
                title:
                    content.substring(0, 30) +
                    (content.length > 30 ? '...' : ''),
                updatedAt: new Date().toISOString(),
            };
            if (db.value) await db.value.put(updatedThread as any);
        } else {
            // Update updatedAt
            const updatedThread = {
                ...activeThread.value,
                updatedAt: new Date().toISOString(),
            };
            if (db.value) await db.value.put(updatedThread as any);
        }

        // Costruisci la history per l'AI filtrata per thread
        const chatHistory = filteredMessages.value.map((m) => ({
            role: m.role,
            content: m.content,
        }));

        // Se è il primo messaggio del thread, includi i file correnti del progetto
        let currentFiles: any[] = [];
        if (chatHistory.length === 0 && filesDB.value) {
            try {
                const res = await filesDB.value.allDocs({ include_docs: true });
                currentFiles = res.rows
                    .map((r: any) => ({
                        name: r.doc._id,
                        content: r.doc.content,
                    }))
                    .filter((f) => f.content);
            } catch (e) {
                console.error('Failed to fetch files for AI context', e);
            }
        }

        // Call backend proxy
        const res = await apiFetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId,
                messages: chatHistory,
                files: currentFiles.length > 0 ? currentFiles : undefined,
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
        }

        const response = await res.json();
        const replyContent =
            response.choices?.[0]?.message?.content || 'No response content';

        const reply: ChatMessage = {
            _id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            role: 'assistant',
            content: replyContent,
            threadId: activeThreadId.value,
            timestamp: new Date().toISOString(),
        };

        if (db.value) await db.value.put(reply as any);

        // Process files from assistant response
        const filesSaved = await processAssistantMessage(replyContent);

        // Create a version snapshot if change detected
        if (filesSaved) {
            await saveVersion(
                replyContent.substring(0, 50).replace(/\n/g, ' ') + '...',
            );
        }
    } catch (e: any) {
        console.error('Chat API error', e);
        alert(
            'Chat API communication failed: ' + (e.message || 'Unknown error'),
        );
    } finally {
        loading.value = false;
    }
}

function handleEnter(e: KeyboardEvent) {
    if (!e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResize(e: Event) {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 192) + 'px';
}

const renderMarkdown = (content: string) => {
    // Rimuove i blocchi di codice che contengono filename (usati per la generazione file)
    const cleanContent = content.replace(
        /<!--\s*filename:\s*([^\s]+?)\s*-->\s*```[a-z]*\n([\s\S]+?)\n```/g,
        '',
    );
    // Configura marked per andare a capo sui singoli invii (come Gemini)
    return marked.parse(cleanContent, { breaks: true });
};

onMounted(() => {
    loadData();
    // Safety timeout: 10 seconds if sync hangs
    setTimeout(() => {
        syncTimeoutReached.value = true;
    }, 10000);
});

onUnmounted(() => {
    if (changesHandler) {
        changesHandler.cancel();
    }
});
</script>
