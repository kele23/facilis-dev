<template>
  <div class="h-full bg-base-200 p-8 flex flex-col gap-6 overflow-auto">
    <div class="flex justify-between items-center w-full max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold">Your Projects</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm opacity-70">Logged in as: <strong>{{ auth.user?.name }}</strong></span>
        <button class="btn btn-outline btn-sm btn-ghost" @click="showSettingsModal = true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <button class="btn btn-outline btn-sm" @click="handleLogout">Logout</button>
      </div>
    </div>

    <!-- Create project Form -->
    <div class="card bg-base-100 shadow-sm max-w-5xl mx-auto w-full">
      <div class="card-body">
        <h2 class="card-title text-xl">Create New Project</h2>
        <div class="flex flex-col sm:flex-row gap-4 mt-2">
          <input 
            v-model="newProjectId"
            type="text" 
            placeholder="Unique Project ID (e.g. my-awesome-app)" 
            class="input input-bordered flex-1" 
            :disabled="creating"
            @keyup.enter="createProject"
          />
          <button class="btn btn-primary" :disabled="!newProjectId || creating" @click="createProject">
            <span v-if="creating" class="loading loading-spinner"></span>
            Create Project
          </button>
        </div>
        <div v-if="createError" class="text-error mt-2">{{ createError }}</div>
      </div>
    </div>

    <!-- Projects List -->
    <div class="max-w-5xl mx-auto w-full">
      <div v-if="loading" class="flex justify-center p-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      
      <div v-else-if="projects.length === 0" class="text-center p-12 opacity-50">
        No projects found. Create one above!
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="project in projects" :key="project.id" class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
          <div class="card-body cursor-pointer" @click="openProject(project.id)">
            <div class="flex justify-between items-start mb-2">
              <h3 class="card-title text-lg truncate" :title="project.name">{{ project.name }}</h3>
              <div class="badge badge-sm" :class="project.role === 'Developer' ? 'badge-primary' : 'badge-secondary'">
                {{ project.role }}
              </div>
            </div>
            <p class="text-sm opacity-60">
              Created: {{ new Date(project.createdAt).toLocaleDateString() }}
            </p>
            <div class="card-actions justify-end mt-4">
              <button class="btn btn-ghost btn-sm" @click.stop="openProject(project.id)">Open Studio</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- User Settings Modal -->
  <dialog id="user_settings_modal" class="modal" :class="{ 'modal-open': showSettingsModal }">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Global Profile Settings</h3>
      <p class="py-4 text-sm text-base-content/70">
        Configure your default AI provider and API key. This will be automatically used for all new projects you create.
        <span v-if="userSettings?.hasToken" class="text-success font-bold block mt-2">✓ API Token is currently configured</span>
        <span v-else class="text-warning font-bold block mt-2">⚠ No Default API Token configured</span>
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
          <label class="label"><span class="label-text">API Token</span></label>
          <input 
            v-model="settingsForm.token" 
            type="password" 
            placeholder="sk-..." 
            class="input input-bordered w-full" 
            :required="!userSettings?.hasToken"
          />
          <label class="label" v-if="userSettings?.hasToken">
             <span class="label-text-alt text-base-content/60">Leave blank to keep existing token</span>
          </label>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="showSettingsModal = false" :disabled="savingSettings">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="savingSettings">
            <span v-if="savingSettings" class="loading loading-spinner loading-sm"></span>
            Save
          </button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop" @click="showSettingsModal = false"><button>close</button></form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiFetch } from '../utils/apiFetch'

const router = useRouter()
const auth = useAuthStore()

const newProjectId = ref('')
const loading = ref(true)
const creating = ref(false)
const createError = ref('')

// Modal states
const showSettingsModal = ref(false)
const savingSettings = ref(false)
const userSettings = ref<{ provider: string | null, hasToken: boolean } | null>(null)
const settingsForm = ref({ provider: 'gemini', token: '' })

interface Project {
  id: string;
  name: string;
  role: string;
  createdAt: string;
}

const projects = ref<Project[]>([])

async function loadUserSettings() {
  try {
    const res = await apiFetch(`/api/user/settings`)
    const data = await res.json()
    userSettings.value = data.settings
    if (data.settings?.provider) {
      settingsForm.value.provider = data.settings.provider
    }
  } catch (e) {
    console.error("Failed to load user settings", e)
  }
}

async function saveSettings() {
  if (savingSettings.value) return;
  savingSettings.value = true;
  
  try {
    await apiFetch(`/api/user/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: settingsForm.value.provider,
        token: settingsForm.value.token || undefined
      })
    })
    await loadUserSettings()
    showSettingsModal.value = false
    settingsForm.value.token = '' // clear memory
  } catch (e) {
    alert("Failed to save settings")
  } finally {
    savingSettings.value = false
  }
}

async function fetchProjects() {
  loading.value = true
  try {
    const res = await apiFetch('/api/projects')
    const data = await res.json()
    if (data.success) {
      projects.value = data.projects
    }
  } catch (error) {
    console.error('Failed to fetch projects', error)
  } finally {
    loading.value = false
  }
}

async function createProject() {
  if (!newProjectId.value.trim() || creating.value) return
  
  creating.value = true
  createError.value = ''
  try {
    const res = await apiFetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: newProjectId.value.trim() })
    })
    const data = await res.json()
    if (data.success) {
      newProjectId.value = ''
      await fetchProjects()
    } else {
      createError.value = data.message || 'Failed to create project'
    }
  } catch (error) {
    createError.value = 'Failed to create project'
    console.error(error)
  } finally {
    creating.value = false
  }
}

function openProject(id: string) {
  router.push(`/project/${id}`)
}

function handleLogout() {
  auth.logout()
}

onMounted(() => {
  fetchProjects()
  loadUserSettings()
})
</script>
