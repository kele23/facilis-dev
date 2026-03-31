import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nitro(),
    tailwindcss(),
    vue(),
  ],
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      my_events: 'events',
    },
  },
});
