<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { useDB } from '../composable/useDB.ts';
import { useI18n } from 'vue-i18n';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import VersionHistory from './VersionHistory.vue';

const { t } = useI18n();

const props = defineProps<{
    projectId: string;
    appReady: boolean;
    activeThreadId: string | null;
}>();

const { filesDB } = useDB();
const iframeKey = ref(0);
let changesHandler: any = null;

// UI States
const viewMode = ref<'preview' | 'code'>('preview');
const previewSize = ref<'mobile' | 'tablet' | 'desktop'>('desktop');
const selectedFileId = ref('index.html');
const files = ref<any[]>([]);

const processedHtml = ref('');
const blobUrls = ref<Record<string, string>>({});
const showHistory = ref(false);
const previewSnapshot = ref<any>(null);
const isPreviewMode = computed(() => !!previewSnapshot.value);
const restoring = ref(false);

const defaultIndex = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      :root { scrollbar-gutter: stable; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
      ::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.1); }
    </style>
    <script>
      window.FACILIS_DATA_DB_NAME = "facilis-data-${props.projectId}";
      window.FACILIS_DATA_DB_URL = "${window.location.origin}/couch/facilis-data-${props.projectId}";
    <\/script>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js"><\/script>
</head>
<body class="bg-gray-50 flex flex-col items-center justify-center min-h-screen font-sans">
    <div class="text-center space-y-6">
        <div class="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200">
            <span class="text-white font-bold text-4xl italic">f.</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">${t('sandbox.readyTitle')}</h1>
        <p class="text-gray-500 max-w-xs mx-auto">${t('sandbox.readySubtitle')}</p>
    </div>
</body>
</html>`;

const currentFileContent = computed(() => {
    const file = files.value.find((f) => f._id === selectedFileId.value);
    return file ? file.content : '';
});

const currentFileLanguage = computed(() => {
    if (selectedFileId.value.endsWith('.js')) return 'javascript';
    if (selectedFileId.value.endsWith('.css')) return 'css';
    if (selectedFileId.value.endsWith('.html')) return 'html';
    return 'text';
});

async function updateSandbox() {
    if (!filesDB.value) return;

    try {
        let currentFiles: any[] = [];
        if (previewSnapshot.value) {
            // Map snapshot files to the format used by updateSandbox
            currentFiles = Object.entries(previewSnapshot.value.files).map(
                ([id, content]) => ({
                    _id: id,
                    content: content,
                }),
            );
        } else {
            const res = await filesDB.value.allDocs({ include_docs: true });
            currentFiles = res.rows.map((r: any) => r.doc);
        }

        files.value = currentFiles;

        // Revoke old URLs
        Object.values(blobUrls.value).forEach((url) =>
            URL.revokeObjectURL(url),
        );
        const newBlobUrls: Record<string, string> = {};

        // Create new blobs for assets
        files.value.forEach((f: any) => {
            if (f._id !== 'index.html' && f.content) {
                const type = f._id.endsWith('.js')
                    ? 'application/javascript'
                    : f._id.endsWith('.css')
                      ? 'text/css'
                      : 'text/plain';
                const blob = new Blob([f.content], { type });
                newBlobUrls[f._id] = URL.createObjectURL(blob);
            }
        });

        blobUrls.value = newBlobUrls;

        const indexFile = files.value.find((f: any) => f._id === 'index.html');
        let html = indexFile ? indexFile.content : defaultIndex;

        // Replace relative paths with blob URLs in HTML
        for (const [filename, blobUrl] of Object.entries(newBlobUrls)) {
            const escapedFilename = filename.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&',
            );
            const regex = new RegExp(
                `(["'])(\\.?\\/)?${escapedFilename}\\1`,
                'g',
            );
            html = html.replace(regex, `$1${blobUrl}$1`);
        }

        processedHtml.value = html.replace(
            '</head>',
            `
    <style>
      :root { scrollbar-gutter: stable; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
      ::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.1); }
    </style>
    <script>
      window.FACILIS_DATA_DB_NAME = 'facilis-data-${props.projectId}';
      window.FACILIS_DATA_DB_URL = '${window.location.origin}/couch/facilis-data-${props.projectId}';
    <\/script>
    <script src="https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js"><\/script>
    </head>`,
        );
        iframeKey.value++;
    } catch (e) {
        console.error('[SANDBOX] Update error', e);
    }
}

async function exportZip() {
    if (files.value.length === 0) return;
    const zip = new JSZip();
    files.value.forEach((f) => {
        if (f.content) zip.file(f._id, f.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `project-${props.projectId}.zip`);
}

function setupChangesListener() {
    if (changesHandler) changesHandler.cancel();
    if (filesDB.value) {
        changesHandler = filesDB.value
            .changes({
                since: 'now',
                live: true,
                include_docs: true,
            })
            .on('change', () => {
                updateSandbox();
            });
        updateSandbox();
    }
}

function handlePreview(snapshot: any) {
    previewSnapshot.value = snapshot;
    showHistory.value = false; // Close sidebar on selection
    updateSandbox();
}

function exitPreview() {
    previewSnapshot.value = null;
    showHistory.value = false;
    updateSandbox();
}

async function restoreCurrentPreview() {
    if (!previewSnapshot.value || !filesDB.value) return;

    if (
        !confirm(
            t('sandbox.restoreConfirm'),
        )
    )
        return;

    restoring.value = true;
    const { db } = useDB();
    try {
        const snapshot = previewSnapshot.value;
        const snapshotTime = new Date(snapshot.timestamp).getTime();

        // 1. Cleanup Chat History (All threads)
        if (db.value) {
            const chatRes = await db.value.allDocs({ include_docs: true });
            const toDelete = chatRes.rows
                .map((r: any) => r.doc)
                .filter((doc: any) => {
                    const docTime = doc.timestamp
                        ? new Date(doc.timestamp).getTime()
                        : doc.createdAt
                          ? new Date(doc.createdAt).getTime()
                          : 0;
                    return docTime > snapshotTime;
                })
                .map((doc: any) => ({ ...doc, _deleted: true }));

            if (toDelete.length > 0) {
                await db.value.bulkDocs(toDelete);
            }
        }

        // 2. Cleanup Future Versions (Linear history)
        const allDocs = await filesDB.value.allDocs({ include_docs: true });
        const futureVersions = allDocs.rows
            .map((r: any) => r.doc)
            .filter((doc: any) => {
                return (
                    doc._id.startsWith('version:') &&
                    new Date(doc.timestamp).getTime() > snapshotTime
                );
            })
            .map((doc: any) => ({ ...doc, _deleted: true }));

        if (futureVersions.length > 0) {
            await filesDB.value.bulkDocs(futureVersions);
        }

        // 3. (Removed $history update)

        // 4. Restore Files (Batch optimized)
        const fileEntries = Object.entries(snapshot.files);
        const keys = fileEntries.map(([name]) => name);
        const existingFiles = await filesDB.value.allDocs({
            keys,
            include_docs: true,
        });

        const docsToRestore = fileEntries.map(([filename, content]) => {
            const fileDoc: any = {
                _id: filename,
                type: 'file',
                content: content as string,
                updatedAt: new Date().toISOString(),
            };
            const row: any = existingFiles.rows.find(
                (r: any) => r.id === filename,
            );
            if (row && row.doc) {
                fileDoc._rev = row.doc._rev;
            }
            return fileDoc;
        });

        await filesDB.value.bulkDocs(docsToRestore);

        console.log(`[HISTORY] Restored version ${snapshot._id}`);
        handleRestored();
    } catch (e) {
        console.error('[HISTORY] Restore error', e);
        alert(t('sandbox.restoreError'));
    } finally {
        restoring.value = false;
    }
}

function handleRestored() {
    previewSnapshot.value = null;
    updateSandbox();
}

const previewContainerWidth = computed(() => {
    if (previewSize.value === 'mobile') return '375px';
    if (previewSize.value === 'tablet') return '768px';
    return '100vw';
});

watch(filesDB, () => setupChangesListener(), { immediate: true });
onUnmounted(() => {
    if (changesHandler) changesHandler.cancel();
});
</script>

<template>
    <div
        class="flex-1 bg-base-100 relative flex flex-col overflow-hidden border-l border-base-300"
    >
        <!-- Premium Header -->
        <div
            class="h-14 border-b border-base-300 bg-base-100 flex items-center px-4 w-full z-20 gap-4 shadow-sm"
        >
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="flex gap-1.5 flex-shrink-0">
                    <div class="w-3 h-3 rounded-full bg-error/40"></div>
                    <div class="w-3 h-3 rounded-full bg-warning/40"></div>
                    <div class="w-3 h-3 rounded-full bg-success/40"></div>
                </div>
                <div class="flex items-center gap-2 truncate opacity-70">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="text-xs font-mono truncate">{{
                        projectId
                    }}</span>
                </div>
            </div>

            <!-- Center: Switcher -->
            <div class="flex-shrink-0">
                <div
                    class="join bg-base-200 p-0.5 rounded-xl border border-base-300"
                >
                    <button
                        class="btn btn-xs join-item rounded-lg border-none hover:bg-base-300"
                        :class="
                            viewMode === 'code'
                                ? 'bg-base-100 shadow-sm text-primary'
                                : 'bg-transparent text-base-content/60'
                        "
                        @click="viewMode = 'code'"
                    >
                        {{ t('sandbox.code') }}
                    </button>
                    <button
                        class="btn btn-xs join-item rounded-lg border-none hover:bg-base-300"
                        :class="
                            viewMode === 'preview'
                                ? 'bg-base-100 shadow-sm text-primary'
                                : 'bg-transparent text-base-content/60'
                        "
                        @click="viewMode = 'preview'"
                    >
                        {{ t('sandbox.preview') }}
                    </button>
                </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-1 ml-auto flex-shrink-0">
                <button
                    v-if="viewMode === 'preview'"
                    class="btn btn-ghost btn-square btn-sm opacity-50 hover:opacity-100 transition-opacity"
                    @click="updateSandbox"
                    :title="t('sandbox.refresh')"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        class="w-4 h-4"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                        />
                    </svg>
                </button>
                <button
                    class="btn btn-ghost btn-square btn-sm"
                    :class="{ 'text-primary bg-primary/10': showHistory }"
                    @click="showHistory = !showHistory"
                    :title="t('versionHistory.title')"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        class="w-4 h-4"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </button>
                <button
                    class="btn btn-primary btn-sm rounded-lg px-3"
                    @click="exportZip"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="currentColor"
                        class="w-4 h-4 mr-1"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                    </svg>
                    {{ t('sandbox.export') }}
                </button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 relative flex flex-col bg-base-200 overflow-hidden">
            <!-- CODE VIEW -->
            <div
                v-if="viewMode === 'code'"
                class="flex-1 flex flex-col bg-base-100"
            >
                <div
                    class="h-10 bg-base-100 border-b border-base-300 flex items-center px-4"
                >
                    <select
                        v-model="selectedFileId"
                        class="select select-ghost select-xs font-mono focus:outline-none"
                    >
                        <option v-for="f in files" :key="f._id" :value="f._id">
                            {{ f._id }}
                        </option>
                    </select>
                </div>
                <div class="flex-1">
                    <VueMonacoEditor
                        theme="vs-dark"
                        :language="currentFileLanguage"
                        :value="currentFileContent"
                        :options="{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 13,
                            fontFamily: 'JetBrains Mono, monospace',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            padding: { top: 10 },
                        }"
                    />
                </div>
            </div>

            <!-- PREVIEW VIEW -->
            <div
                v-else
                class="flex-1 flex flex-col relative items-center justify-center p-8 transition-all duration-500"
            >
                <!-- Preview Banner -->
                <div
                    v-if="isPreviewMode"
                    class="absolute top-0 inset-x-0 bg-primary text-primary-content px-4 py-1.5 z-40 flex items-center justify-between text-xs font-medium shadow-md"
                >
                    <div class="flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            class="w-4 h-4"
                            :class="{ 'animate-pulse': !restoring }"
                        >
                            <path
                                d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                            />
                            <path
                                fill-rule="evenodd"
                                d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span v-if="restoring" class="flex items-center gap-2">
                            <span
                                class="loading loading-spinner loading-xs"
                            ></span>
                            {{ t('sandbox.restoring') }}
                        </span>
                        <span v-else
                            >{{ t('sandbox.previewBanner') }}
                            {{ previewSnapshot.title }}</span
                        >
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            @click="restoreCurrentPreview"
                            :disabled="restoring"
                            class="btn btn-xs bg-white text-primary border-none hover:bg-white/90 rounded-lg font-bold"
                        >
                            {{ t('sandbox.restoreButton') }}
                        </button>
                        <button
                            @click="exitPreview"
                            :disabled="restoring"
                            class="btn btn-xs btn-ghost hover:bg-white/10 text-white rounded-lg"
                        >
                            {{ t('sandbox.exit') }}
                        </button>
                    </div>
                </div>

                <!-- Floating Device Controls -->
                <div
                    class="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-base-100 p-1 rounded-full shadow-xl border border-base-300 z-30"
                >
                    <button
                        class="btn btn-ghost btn-circle btn-xs transition-colors"
                        :class="
                            previewSize === 'mobile'
                                ? 'text-primary bg-primary/10'
                                : 'opacity-40 hover:opacity-100'
                        "
                        @click="previewSize = 'mobile'"
                        :title="t('sandbox.viewMobile')"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            class="w-4 h-4"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                            />
                        </svg>
                    </button>
                    <button
                        class="btn btn-ghost btn-circle btn-xs transition-colors"
                        :class="
                            previewSize === 'tablet'
                                ? 'text-primary bg-primary/10'
                                : 'opacity-40 hover:opacity-100'
                        "
                        @click="previewSize = 'tablet'"
                        :title="t('sandbox.viewTablet')"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-4 h-4"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z"
                            />
                        </svg>
                    </button>
                    <button
                        class="btn btn-ghost btn-circle btn-xs transition-colors"
                        :class="
                            previewSize === 'desktop'
                                ? 'text-primary bg-primary/10'
                                : 'opacity-40 hover:opacity-100'
                        "
                        @click="previewSize = 'desktop'"
                        :title="t('sandbox.viewDesktop')"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-4 h-4"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M9 17.25v1.007a3 3 0 01-.878 2.122L7.5 21h9l-.622-.621a3 3 0 01-.878-2.122v-1.007m-7.5 0a4.5 4.5 0 119 0m-9 0h9"
                            />
                        </svg>
                    </button>
                </div>

                <div
                    class="flex shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-base-300 rounded-2xl overflow-hidden transition-all duration-500 ease-in-out bg-base-100"
                    :style="{
                        width: previewContainerWidth,
                        height: previewSize === 'desktop' ? '100%' : '80%',
                        maxWidth: '100%',
                    }"
                >
                    <iframe
                        v-if="appReady"
                        :key="iframeKey"
                        :srcdoc="processedHtml"
                        class="w-full h-full relative z-10 border-none bg-white"
                    ></iframe>
                    <div
                        v-else
                        class="flex flex-col items-center justify-center w-full h-full gap-4 text-base-content/20 bg-base-100"
                    >
                        <span
                            class="loading loading-ring loading-lg text-primary/30"
                        ></span>
                        <span class="font-medium animate-pulse text-sm"
                            >{{ t('sandbox.rendering') }}</span
                        >
                    </div>
                </div>
            </div>
        </div>

        <!-- Version History Sidebar (Teleported to avoid clipping) -->
        <Teleport to="body">
            <Transition name="slide">
                <VersionHistory
                    v-if="showHistory"
                    class="fixed inset-y-0 right-0 z-[100]"
                    :project-id="projectId"
                    :activeThreadId="activeThreadId"
                    :activeVersionId="previewSnapshot?._id || null"
                    @close="
                        showHistory = false;
                        exitPreview();
                    "
                    @preview="handlePreview"
                    @exit-preview="exitPreview"
                    @restored="handleRestored"
                />
            </Transition>
        </Teleport>
    </div>
</template>

<style>
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(100%);
}
</style>
