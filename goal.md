# Project Scope
Facilis Dev is a platform for creating mini web-apps through **VibeCoding** (AI-powered natural language development). It allows users to build, preview, and iterate on web applications within an integrated AI sandbox, featuring:
- **AI Sandbox Studio**: Real-time generation and preview of web components.
- **VibeCoding Workflow**: Seamless interaction between chat-based instructions and code execution.
- **Time Machine Versioning**: A linear history system for project snapshots and state restoration.
- **Multi-tenant Persistence**: Local and remote synchronization using PouchDB/CouchDB.

# Project Structure
- **Frontend**: Vue 3 (Composition API, TypeScript), Vite, Pinia, Vue Router, DaisyUI, Tailwind CSS, Vue I18n.
- **Backend/Server**: Nitro (H3) with custom CouchDB proxying.
- **Persistence**: PouchDB (Browser) with CouchDB synchronization.
- **Styling**: Modern, premium aesthetics using Tailwind CSS and DaisyUI.

# Task History & Recent GIT Changes
- **Initial Infrastructure**: Setup of Nitro, Vue 3, and PouchDB integration.
- **Project Management**: Implementation of full-stack project management and authentication.
- **AI Studio Core**: Integration of AI-driven sandbox and chat streaming (apiFetch).
- **Structured Logging**: Integration of `consola` for robust server-side logging.
- **Proxy Refactor**: Updated CouchDB proxy route to use H3 native request handling and `HTTPError` for better error reporting.
- **Deployment**: Configured Cloudflare deployment presets and `wrangler.json` for VPC service binding.
- **Identity & Aesthetics**: Transitioned to the "Simple Path" logo/icon and integrated `FacilisLogo` component.
- **Internationalization (i18n)**: 
    - Full implementation of `vue-i18n` with EN/IT support.
    - Refactored components to use local `t` function for TypeScript compatibility.
- **Sync & Initialization**: 
    - Resolved UI hanging during initial sync.
    - **Background Sync**: Implemented `isBackgroundSyncing` to allow silent automatic version saves without obstructing the UI with the full-screen loader.
- **Linear History**: Finalized "Time Machine" versioning with snapshot-based restoration.

# Tasks to Do
- [x] Internationalize all static strings.
    - [x] Install `vue-i18n`.
    - [x] Set up i18n configuration (English and Italian).
    - [x] Scan and extract static strings from existing components.
    - [x] Replace static strings with translations.
    - [x] Resolve TypeScript errors by using local `t` function.
- [x] Implement background sync for automatic versioning.
- [ ] Further UI/UX refinements.
- [ ] Performance optimizations for database operations.

# Specific User Instructions
1. **Language**: Comments in code must be in English.
2. **Browsing**: Do not open browser to test; wait for user confirmation.
3. **Package Manager**: Use `pnpm`.
4. **Internationalization**: Main language English, translations for Italian provided.
5. **Vue Rules**:
    - TypeScript setup.
    - Script above template.
    - Atomic components.
    - "Toaster" store and components.
    - "Dialog" component and composable.
