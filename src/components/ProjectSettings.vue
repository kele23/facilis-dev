<template>
  <dialog class="modal" :class="{ 'modal-open': modelValue }">
    <div class="modal-box">
      <h3 class="font-bold text-lg">AI Provider Settings</h3>
      <p class="py-4 text-sm text-base-content/70">
        Configure the AI provider and API key used for this specific project.
        <span v-if="projectSettings?.hasToken" class="text-success font-bold block mt-2">✓ API Token is currently configured</span>
        <span v-else class="text-warning font-bold block mt-2">⚠ No API Token configured yet</span>
      </p>

      <form @submit.prevent="saveSettings" class="space-y-4">
        <div class="form-control">
          <label class="label"><span class="label-text">Provider</span></label>
          <select v-model="settingsForm.provider" class="select select-bordered w-full" required>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="openrouter">OpenRouter (Anthropic, DeepSeek, Llama)</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Global Context / System Prompt</span>
            <span class="label-text-alt opacity-50 italic">Overrides default behavior</span>
          </label>
          <textarea 
            v-model="settingsForm.systemPrompt" 
            class="textarea textarea-bordered h-32 font-mono text-xs" 
            placeholder="Provide custom instructions for the AI... (Empty = Default)"
          ></textarea>
          <div class="mt-1 flex justify-end">
            <button type="button" @click="showDefaultPrompt = !showDefaultPrompt" class="link link-secondary text-xs">
              {{ showDefaultPrompt ? 'Hide Default Prompt' : 'View Default Prompt' }}
            </button>
          </div>
          <div v-if="showDefaultPrompt" class="mt-2 p-3 bg-base-200 rounded text-[10px] font-mono whitespace-pre-wrap border border-base-300 opacity-80">
            {{ DEFAULT_SYSTEM_PROMPT_PREVIEW }}
          </div>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">API Token</span></label>
          <input 
            v-model="settingsForm.token" 
            type="password" 
            placeholder="sk-..." 
            class="input input-bordered w-full" 
            :required="!projectSettings?.hasToken"
          />
          <label class="label" v-if="projectSettings?.hasToken">
             <span class="label-text-alt text-base-content/60">Leave blank to keep existing token</span>
          </label>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="$emit('update:modelValue', false)" :disabled="savingSettings">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="savingSettings">
            <span v-if="savingSettings" class="loading loading-spinner loading-sm"></span>
            Save
          </button>
        </div>
      </form>

      <div class="divider"></div>
      <div class="flex flex-col gap-2">
        <h4 class="font-bold text-error">Danger Zone</h4>
        <p class="text-sm text-base-content/70">Once you delete a project, there is no going back. Please be certain.</p>
        <div v-if="!showDeleteConfirm">
          <button type="button" class="btn btn-outline btn-error w-full mt-2" @click="showDeleteConfirm = true">Delete Project</button>
        </div>
        <div v-else class="bg-error/10 p-4 rounded-lg mt-2 border border-error/20">
          <p class="text-sm font-bold mb-2 text-error">Type <span class="select-all font-mono bg-base-100 px-1 rounded">{{ projectId }}</span> to confirm</p>
          <input 
            v-model="deleteConfirmText" 
            type="text" 
            class="input input-sm input-bordered w-full mb-2" 
            placeholder="Project ID..."
          />
          <div class="flex gap-2">
            <button 
              type="button" 
              class="btn btn-sm btn-error flex-1" 
              :disabled="deleteConfirmText !== projectId || deleting"
              @click="deleteProject"
            >
              <span v-if="deleting" class="loading loading-spinner loading-xs"></span>
              Delete this project
            </button>
            <button type="button" class="btn btn-sm btn-ghost" @click="showDeleteConfirm = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="$emit('update:modelValue', false)"><button>close</button></form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '../utils/apiFetch'

const props = defineProps<{
  modelValue: boolean
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'settings-loaded', settings: { provider: string | null, hasToken: boolean, systemPrompt?: string }): void
}>()

const router = useRouter()

// UI state
const showDefaultPrompt = ref(false)
const DEFAULT_SYSTEM_PROMPT_PREVIEW = `You are facilis.dev AI...
RULES FOR FILE GENERATION:
1. Use <!-- filename: ... -->
2. Default index.html
3. Vue 3 + Twind CDN
4. Blob URL handling
...`

const savingSettings = ref(false)
const projectSettings = ref<{ provider: string | null, hasToken: boolean, systemPrompt?: string } | null>(null)
const settingsForm = ref({ provider: 'gemini', token: '', systemPrompt: '' })

// Delete state
const showDeleteConfirm = ref(false)
const deleteConfirmText = ref('')
const deleting = ref(false)

async function loadProjectSettings() {
  try {
    const res = await apiFetch(`/api/projects/${props.projectId}/settings`)
    const data = await res.json()
    projectSettings.value = data.settings
    if (data.settings?.provider) {
      settingsForm.value.provider = data.settings.provider
    }
    if (data.settings?.systemPrompt) {
      settingsForm.value.systemPrompt = data.settings.systemPrompt
    }
    emit('settings-loaded', data.settings)
  } catch (e) {
    console.error("Failed to load settings", e)
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
        systemPrompt: settingsForm.value.systemPrompt
      })
    })
    await loadProjectSettings()
    emit('update:modelValue', false)
    settingsForm.value.token = '' // clear memory
  } catch (e) {
    alert("Failed to save settings")
  } finally {
    savingSettings.value = false
  }
}

async function deleteProject() {
  if (deleteConfirmText.value !== props.projectId || deleting.value) return;
  
  deleting.value = true;
  try {
    const res = await apiFetch(`/api/projects/${props.projectId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      emit('update:modelValue', false);
      router.push('/');
    } else {
      alert("Failed to delete project: " + data.message);
    }
  } catch (e) {
    alert("Failed to delete project");
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  if (props.projectId) {
    loadProjectSettings()
  }
})
</script>
