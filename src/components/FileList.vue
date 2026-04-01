<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useDB } from '../composable/useDB.ts';

const props = defineProps<{
    projectId: string;
}>();

const { filesDB } = useDB();
const files = ref<any[]>([]);
let changesHandler: any = null;

async function loadFiles() {
    if (!filesDB.value) return;
    try {
        const res = await filesDB.value.allDocs({ include_docs: true });
        files.value = res.rows
            .map((r: any) => r.doc)
            .sort((a: any, b: any) => a._id.localeCompare(b._id));
    } catch (e) {
        console.error('[FILELIST] Error loading files', e);
    }
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
                loadFiles();
            });
        loadFiles();
    }
}

async function deleteFile(id: string) {
    if (!filesDB.value || !confirm(`Delete ${id}?`)) return;
    try {
        const doc = await filesDB.value.get(id);
        await filesDB.value.remove(doc);
    } catch (e) {
        console.error('[FILELIST] Error deleting file', e);
    }
}

watch(
    filesDB,
    () => {
        setupChangesListener();
    },
    { immediate: true },
);

onUnmounted(() => {
    if (changesHandler) changesHandler.cancel();
});
</script>

<template>
    <div
        class="bg-base-100 border-b border-base-300 overflow-hidden flex flex-col max-h-48"
    >
        <div
            class="px-4 py-2 bg-base-200 text-xs font-bold uppercase tracking-wider flex justify-between items-center"
        >
            <span>Project Files</span>
            <span class="badge badge-xs badge-ghost">{{ files.length }}</span>
        </div>
        <div class="overflow-y-auto flex-1 p-2">
            <div
                v-if="files.length === 0"
                class="text-center py-4 text-xs opacity-50 italic"
            >
                No files generated yet.
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div
                    v-for="file in files"
                    :key="file._id"
                    class="group flex items-center justify-between p-2 rounded bg-base-100 border border-base-300 hover:border-primary transition-all shadow-sm"
                >
                    <div class="flex items-center gap-2 min-w-0">
                        <div
                            class="w-2 h-2 rounded-full"
                            :class="
                                file._id.endsWith('.html')
                                    ? 'bg-orange-400'
                                    : file._id.endsWith('.js')
                                      ? 'bg-yellow-400'
                                      : 'bg-blue-400'
                            "
                        ></div>
                        <span
                            class="text-xs font-mono truncate"
                            :title="file._id"
                            >{{ file._id }}</span
                        >
                    </div>
                    <button
                        @click="deleteFile(file._id)"
                        class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 text-error"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
