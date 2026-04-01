<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useDB } from '../composable/useDB.ts';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const props = defineProps<{
    projectId: string;
    activeThreadId: string | null;
    activeVersionId: string | null;
}>();

const emit = defineEmits(['close', 'restored', 'preview', 'exit-preview']);

const { filesDB } = useDB();
const history = ref<any[]>([]);
let changesHandler: any = null;

async function loadHistory() {
    if (!filesDB.value) return;
    try {
        const doc: any = await filesDB.value.get('$history');
        history.value = (doc.versions || []).filter((v: any) =>
            v.id.startsWith('version:'),
        );
    } catch (e) {
        history.value = [];
    }
}

function selectVersion(ver: any, idx: number) {
    if (idx === 0) {
        emit('exit-preview');
        return;
    }
    filesDB.value
        ?.get(ver.id)
        .then((snapshot: any) => {
            emit('preview', snapshot);
        })
        .catch((e) =>
            console.error('[HISTORY] Error fetching snapshot for preview', e),
        );
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString(locale.value, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function listenToChanges() {
    if (changesHandler) changesHandler.cancel();
    if (filesDB.value) {
        changesHandler = filesDB.value
            .changes({
                since: 'now',
                live: true,
                doc_ids: ['$history'],
            })
            .on('change', () => loadHistory());
    }
}

onMounted(() => {
    loadHistory();
    listenToChanges();
});

onUnmounted(() => {
    if (changesHandler) changesHandler.cancel();
});

watch(filesDB, () => {
    loadHistory();
    listenToChanges();
});
</script>

<template>
    <div
        class="flex flex-col h-full bg-base-100 border-l border-base-300 w-80 shadow-2xl z-40"
    >
        <div
            class="p-4 border-b border-base-300 flex items-center justify-between bg-base-100/50 backdrop-blur-md sticky top-0"
        >
            <div class="flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-4 h-4 text-primary"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h3 class="font-bold text-sm">{{ t('versionHistory.title') }}</h3>
            </div>
            <button
                @click="$emit('close')"
                class="btn btn-ghost btn-xs btn-circle"
            >
                ✕
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            <div
                v-if="history.length === 0"
                class="flex flex-col items-center justify-center h-40 opacity-30 text-center p-4"
            >
                <p class="text-xs">{{ t('versionHistory.noVersions') }}</p>
            </div>

            <div
                v-for="(ver, idx) in history"
                :key="ver.id"
                class="group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden"
                :class="
                    props.activeVersionId === ver.id ||
                    (idx === 0 && !props.activeVersionId)
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30 shadow-lg'
                        : 'border-base-300 bg-base-200/30 hover:bg-base-100 hover:border-primary/30'
                "
                @click="selectVersion(ver, idx)"
            >
                <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="flex flex-col gap-0.5">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wider"
                            :class="
                                props.activeVersionId === ver.id ||
                                (idx === 0 && !props.activeVersionId)
                                    ? 'text-primary'
                                    : 'text-base-content/40'
                            "
                            >{{
                                t('versionHistory.versionNumber', {
                                    n: history.length - idx,
                                })
                            }}</span
                        >
                        <span class="text-[10px] opacity-40">{{
                            formatDate(ver.timestamp)
                        }}</span>
                    </div>
                    <div
                        v-if="idx === 0"
                        class="badge badge-success badge-xs opacity-70"
                    >
                        {{ t('versionHistory.current') }}
                    </div>
                </div>

                <p class="text-xs line-clamp-2 mb-3 opacity-70 italic">
                    "{{ ver.title }}"
                </p>

                <div
                    v-if="
                        props.activeVersionId === ver.id ||
                        (idx === 0 && !props.activeVersionId)
                    "
                    class="flex gap-2 animate-in slide-in-from-bottom-2 duration-300"
                >
                    <span
                        class="text-[10px] font-bold text-primary flex items-center gap-1"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            class="w-3 h-3"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        {{
                            idx === 0 && !props.activeVersionId
                                ? t('versionHistory.activeState')
                                : t('versionHistory.viewing')
                        }}
                    </span>
                </div>
                <div
                    v-else
                    class="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                    <span v-if="idx === 0">{{
                        t('versionHistory.backToCurrent')
                    }}</span>
                    <span v-else>{{ t('versionHistory.viewPreview') }}</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        class="w-3 h-3 text-primary/50"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
            </div>
        </div>

        <div
            class="p-4 bg-base-200/50 text-[10px] opacity-40 text-center leading-tight"
        >
            {{ t('versionHistory.note1') }}<br />
            {{ t('versionHistory.note2') }}
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--bc) / 0.1);
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--bc) / 0.2);
}
</style>
