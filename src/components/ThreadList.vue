<template>
  <div class="flex flex-col w-full bg-base-100 overflow-hidden">
    <div class="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/30">
      <span class="font-bold text-xs uppercase tracking-widest opacity-60">Cronologia Chat</span>
      <button class="btn btn-primary btn-sm rounded-full px-4" @click="emit('new-thread')">
        Nuova conversazione
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto max-h-[60vh] p-4 space-y-2 custom-scrollbar">
      <div v-if="threads.length === 0" class="p-12 text-center opacity-40 text-sm italic">
        Inizia la tua prima conversazione...
      </div>
      <div 
        v-for="thread in threads" 
        :key="thread._id"
        class="group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:bg-base-200 active:scale-[0.98]"
        :class="{ 'bg-primary/10 text-primary ring-1 ring-primary/30': activeThreadId === thread._id }"
        @click="emit('select-thread', thread._id)"
      >
        <div class="w-10 h-10 rounded-xl bg-base-300 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 opacity-70"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="text-md truncate font-bold">{{ thread.title }}</div>
          <div class="text-[11px] opacity-50 uppercase font-bold tracking-tight">{{ formatDate(thread.updatedAt) }}</div>
        </div>
        
        <button 
          v-if="threads.length > 1"
          class="btn btn-ghost btn-sm btn-circle opacity-0 group-hover:opacity-100 hover:bg-error/20 hover:text-error transition-all" 
          @click.stop="emit('delete-thread', thread._id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  threads: any[]
  activeThreadId: string | null
}>()

const emit = defineEmits<{
  (e: 'select-thread', id: string): void
  (e: 'new-thread'): void
  (e: 'delete-thread', id: string): void
}>()

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
/* Scoped styles removed in favor of global main.css styling */
</style>
