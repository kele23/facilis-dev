# Task Plan - Facilis Dev

## Project Scope
Facilis Dev is a platform for creating mini web-apps through **VibeCoding** (AI-powered natural language development). It allows users to build, preview, and iterate on web applications within an integrated AI sandbox.

Core features:
- **AI Sandbox Studio**: Real-time generation and preview of web components.
- **VibeCoding Workflow**: Seamless interaction between chat-based instructions and code execution.
- **Time Machine Versioning**: A linear history system for project snapshots and state restoration.
- **Multi-tenant Persistence**: Local and remote synchronization using PouchDB/CouchDB.

## Core Architecture
- **Frontend**: Vue 3 (Composition API, TypeScript), Vite, Pinia, Vue Router, DaisyUI, Tailwind CSS, Vue I18n.
- **Backend/Server**: Nitro (H3) with custom CouchDB proxying.
- **Persistence**: PouchDB (Browser) with CouchDB synchronization.
- **Aesthetics**: Premium, modern designs using Tailwind CSS v4 and DaisyUI v5.

## Roadmap & Pending Tasks
- [x] Create project-specific roles (developer and user) and assign them to project DBs.
- [x] Restrict write access to `files` DB for the `user` role using `validate_doc_update`.
- [x] Automatically assign the `developer` role to the project creator.
- [x] Implement role cleanup when a project is deleted.
- [ ] Further UI/UX refinements (Micro-animations, polished transitions).
- [ ] Performance optimizations for database operations (e.g., bulkDocs).
- [ ] Implement robust error handling for AI provider failures.
- [ ] Implement project sharing and access management.
