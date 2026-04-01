<template>
    <dialog class="modal" :class="{ 'modal-open': modelValue }">
        <div class="modal-box">
            <h3 class="font-bold text-lg">{{ t('projectSettings.modalTitle') }}</h3>
            <p class="py-4 text-sm text-base-content/70">
                {{ t('projectSettings.description') }}
                <span
                    v-if="projectSettings?.hasToken"
                    class="text-success font-bold block mt-2"
                    >{{ t('projectSettings.tokenConfigured') }}</span
                >
                <span v-else class="text-warning font-bold block mt-2"
                    >{{ t('projectSettings.tokenNotConfigured') }}</span
                >
            </p>

            <form @submit.prevent="saveSettings" class="space-y-4">
                <div class="form-control">
                    <label class="label"
                        ><span class="label-text">{{
                            t('projectSettings.providerLabel')
                        }}</span></label
                    >
                    <select
                        v-model="settingsForm.provider"
                        class="select select-bordered w-full"
                        required
                    >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="openrouter">
                            OpenRouter (Anthropic, DeepSeek, Llama)
                        </option>
                    </select>
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">{{
                            t('projectSettings.systemPromptLabel')
                        }}</span>
                        <span class="label-text-alt opacity-50 italic">{{
                            t('projectSettings.systemPromptSubLabel')
                        }}</span>
                    </label>
                    <textarea
                        v-model="settingsForm.systemPrompt"
                        class="textarea textarea-bordered h-32 font-mono text-xs"
                        :placeholder="
                            t('projectSettings.systemPromptPlaceholder')
                        "
                    ></textarea>
                    <div class="mt-1 flex justify-end">
                        <button
                            type="button"
                            @click="showDefaultPrompt = !showDefaultPrompt"
                            class="link link-secondary text-xs"
                        >
                            {{
                                showDefaultPrompt
                                    ? t('projectSettings.hideDefaultPrompt')
                                    : t('projectSettings.viewDefaultPrompt')
                            }}
                        </button>
                    </div>
                    <div
                        v-if="showDefaultPrompt"
                        class="mt-2 p-3 bg-base-200 rounded text-[10px] font-mono whitespace-pre-wrap border border-base-300 opacity-80"
                    >
                        {{ DEFAULT_SYSTEM_PROMPT_PREVIEW }}
                    </div>
                </div>

                <div class="form-control">
                    <label class="label"
                        ><span class="label-text">{{
                            t('projectSettings.tokenLabel')
                        }}</span></label
                    >
                    <input
                        v-model="settingsForm.token"
                        type="password"
                        :placeholder="t('projectSettings.tokenPlaceholder')"
                        class="input input-bordered w-full"
                        :required="!projectSettings?.hasToken"
                    />
                    <label class="label" v-if="projectSettings?.hasToken">
                        <span class="label-text-alt text-base-content/60">{{
                            t('projectSettings.tokenLeaveBlank')
                        }}</span>
                    </label>
                </div>

                <div class="modal-action">
                    <button
                        type="button"
                        class="btn"
                        @click="$emit('update:modelValue', false)"
                        :disabled="savingSettings"
                    >
                        {{ t('common.cancel') }}
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        :disabled="savingSettings"
                    >
                        <span
                            v-if="savingSettings"
                            class="loading loading-spinner loading-sm"
                        ></span>
                        {{ t('common.save') }}
                    </button>
                </div>
            </form>

            <div class="divider"></div>
            <div class="flex flex-col gap-2">
                <h4 class="font-bold text-error">
                    {{ t('projectSettings.dangerZoneTitle') }}
                </h4>
                <p class="text-sm text-base-content/70">
                    {{ t('projectSettings.dangerZoneDescription') }}
                </p>
                <div v-if="!showDeleteConfirm">
                    <button
                        type="button"
                        class="btn btn-outline btn-error w-full mt-2"
                        @click="showDeleteConfirm = true"
                    >
                        {{ t('projectSettings.deleteProjectButton') }}
                    </button>
                </div>
                <div
                    v-else
                    class="bg-error/10 p-4 rounded-lg mt-2 border border-error/20"
                >
                    <p class="text-sm font-bold mb-2 text-error">
                        {{
                            t('projectSettings.deleteConfirmInstructions', {
                                id: projectId,
                            })
                        }}
                    </p>
                    <input
                        v-model="deleteConfirmText"
                        type="text"
                        class="input input-sm input-bordered w-full mb-2"
                        :placeholder="
                            t('projectSettings.deleteConfirmPlaceholder')
                        "
                    />
                    <div class="flex gap-2">
                        <button
                            type="button"
                            class="btn btn-sm btn-error flex-1"
                            :disabled="
                                deleteConfirmText !== projectId || deleting
                            "
                            @click="deleteProject"
                        >
                            <span
                                v-if="deleting"
                                class="loading loading-spinner loading-xs"
                            ></span>
                            {{ t('projectSettings.deleteConfirmButton') }}
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-ghost"
                            @click="showDeleteConfirm = false"
                        >
                            {{ t('common.cancel') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <form
            method="dialog"
            class="modal-backdrop"
            @click="$emit('update:modelValue', false)"
        >
            <button>{{ t('common.close') }}</button>
        </form>
    </dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { apiFetch } from '../utils/apiFetch.ts';

const { t } = useI18n();

const props = defineProps<{
    modelValue: boolean;
    projectId: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (
        e: 'settings-loaded',
        settings: {
            provider: string | null;
            hasToken: boolean;
            systemPrompt?: string;
        },
    ): void;
}>();

const router = useRouter();

// UI state
const showDefaultPrompt = ref(false);
const DEFAULT_SYSTEM_PROMPT_PREVIEW = `You are facilis.dev AI...
RULES FOR FILE GENERATION:
1. Use <!-- filename: ... -->
2. Default index.html
3. Vue 3 + Twind CDN
4. Blob URL handling
...`;

const savingSettings = ref(false);
const projectSettings = ref<{
    provider: string | null;
    hasToken: boolean;
    systemPrompt?: string;
} | null>(null);
const settingsForm = ref({ provider: 'gemini', token: '', systemPrompt: '' });

// Delete state
const showDeleteConfirm = ref(false);
const deleteConfirmText = ref('');
const deleting = ref(false);

async function loadProjectSettings() {
    try {
        const res = await apiFetch(`/api/projects/${props.projectId}/settings`);
        const data = await res.json();
        projectSettings.value = data.settings;
        if (data.settings?.provider) {
            settingsForm.value.provider = data.settings.provider;
        }
        if (data.settings?.systemPrompt) {
            settingsForm.value.systemPrompt = data.settings.systemPrompt;
        }
        emit('settings-loaded', data.settings);
    } catch (e) {
        console.error('Failed to load settings', e);
    }
}

async function saveSettings() {
    if (savingSettings.value) return;
    savingSettings.value = true;

    try {
        await apiFetch(`/api/projects/${props.projectId}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: settingsForm.value.provider,
                token: settingsForm.value.token || undefined,
                systemPrompt: settingsForm.value.systemPrompt,
            }),
        });
        await loadProjectSettings();
        emit('update:modelValue', false);
        settingsForm.value.token = ''; // clear memory
    } catch (e) {
        alert(t('projectSettings.saveError'));
    } finally {
        savingSettings.value = false;
    }
}

async function deleteProject() {
    if (deleteConfirmText.value !== props.projectId || deleting.value) return;

    deleting.value = true;
    try {
        const res = await apiFetch(`/api/projects/${props.projectId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) {
            emit('update:modelValue', false);
            router.push('/');
        } else {
            alert('Failed to delete project: ' + data.message);
        }
    } catch (e) {
        alert(t('projectSettings.deleteError'));
    } finally {
        deleting.value = false;
    }
}

onMounted(() => {
    if (props.projectId) {
        loadProjectSettings();
    }
});
</script>
