import { defineConfig } from 'nitro';

export default defineConfig({
    compatibilityDate: '2026-03-31',
    serverDir: './server',
    preset: 'cloudflare_module',
    cloudflare: {
        deployConfig: true,
        nodeCompat: true,
    },
    runtimeConfig: {
        couchUrl: 'http://localhost:5984',
        couchSecret: 'facilis-default',
        couchAdminRole: '_admin',
        jwtSecret: 'facilis-dev-secret-key-1234',
        encryptionSecret: 'facilis-encryption-key-5678',
    },
});
