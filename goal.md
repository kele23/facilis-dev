# Project Scope
Facilis Dev is a development environment/tooling platform, likely for AI-powered sandbox development, based on the conversation history. It uses Vue 3 for the frontend and Nitro for the backend.

# Project Structure
- **Frontend**: Vue 3 with Vite, Pinia, Vue Router, DaisyUI, Tailwind CSS, Vue I18n.
- **Backend/Server**: Nitro.
- **Persistence**: PouchDB.
- **Styling**: Tailwind CSS / DaisyUI.

# Task History
- Initial setup.
- Integration of Consola logger.
- Refactoring error handling.
- Implementing AI-powered sandbox features, time machine versioning, etc.
- **Brand Identity Evolution**: Transitioned from a letter-based "f." logo to a purely symbolic icon representing "Easy" and "Flow" (Option 4: The Simple Path), integrated across the chat UI, favicon, and loaders.
- **Sync & Initialization Fixes**: 
    - Resolved UI hang ("Rendering..." stuck) on new or empty projects by ensuring `appReady` is always signaled after the initial sync attempt.
    - Added error and denial handling to PouchDB sync to prevent permanent loading loops when the remote database is missing or unreachable.
- **Internationalization (i18n)**: 
    - Installed `vue-i18n`.
    - Set up i18n configuration for English (EN) and Italian (IT).
    - Replaced static strings with dynamic translations across components and views.
    - **Refactored from global `$t` to local `t` function** using `useI18n()` to resolve TypeScript errors and ensure Composition API best practices.
    - Enabled `globalInjection: true` in the i18n plugin for project-wide compatibility.

# Tasks to Do
- [x] Internationalize all static strings.
    - [x] Install `vue-i18n`.
    - [x] Set up i18n configuration (English and Italian).
    - [x] Scan and extract static strings from existing components.
    - [x] Replace static strings with translations.
    - [x] Resolve TypeScript errors by using local `t` function.
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
