# Findings & Knowledge Base - Facilis Dev

## User Specific Instructions
1. **Language**: Code comments in English.
2. **Browsing**: No automatic browser testing; wait for user confirmation.
3. **Package Manager**: Mandatory `pnpm`.
4. **Internationalization**: Primary EN, translations for IT required.
5. **Vue Rules**: Composition API, Script above Template, Atomic components, "Toaster" store, "Dialog" components/composables.

## Technical Decisions
1. **Persistence**: 
    - PouchDB (Browser) syncing with CouchDB (Server).
    - Patched `pouchdb-browser` (v9.0.0) is used to resolve runtime issues.
2. **Backend**:
    - Nitro with H3.
    - Custom CouchDB proxy route using native request handling.
    - Integration of `consola` for consistent server-side logs.
3. **Frontend**:
    - Use of Tailwind CSS v4 and DaisyUI v5 (Beta).
    - Monomorphic use of `vue-i18n` with local `t` injection for TS safety.
4. **Versioning (Time Machine)**:
    - Linear history enforced: Future versions and messages pruned on restoration.
    - Interactive "Preview Mode" before full restoration is allowed.
    - Background synchronization (`isSyncing` vs `isBackgroundSyncing`) tracks user interaction vs. auto-saves.
5. **RBAC implementation**:
    - Project-prefixed roles (`p-[id]-developer`, `p-[id]-user`).
    - `_security` object on all project DBs using roles.
    - `_design/auth` with `validate_doc_update` on Files DB to restrict write access to `developer` role only.
    - Creator user role assignment in CouchDB `_users` document.
    - Clean-up logic in project deletion to remove project roles from the deleting user.

## Bug Resolutions & Workarounds
- **UI Hang during Sync**: Resolved by optimizing session initialization and separating background sync states.
- **PouchDB Patch**: A patch was applied to `pouchdb-browser@9.0.0` to address dependency/typing issues.
- **AI Proxy Errors**: Refined proxy payloads to match H3's native expected structure.
