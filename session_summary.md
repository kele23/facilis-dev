# Project Status & Functional Context - facilis.dev

This document provides a comprehensive overview of **facilis.dev** (Vibe Studio), its purpose, technical stack, and the current state of development.

## 🎯 What is facilis.dev?

**facilis.dev** is an **AI-Native Development Studio** designed for rapid prototyping. It allows developers to build applications by conversing with advanced AI models in a project-based environment with real-time feedback.

### Core User Features:

- **Project Isolation**: Dedicated workspaces for different apps, each with its own database and settings.
- **AI-Assisted Coding**: Chat with Gemini, OpenAI, or OpenRouter to generate code and debug.
- **Live Sandbox**: Integrated preview environment for generated code.
- **Multi-Thread Conversations**: Logical grouping of tasks into independent threads.

---

## 🎨 Frontend State & UI Architecture

The "Frontend" section is built with **Vue 3**, **Tailwind 4**, and **DaisyUI 5**, focusing on a premium developer experience.

### ✅ Implemented & Operational:

- **HomeView (Dashboard)**:
    - Dynamic project list fetching and creation.
    - Global User Settings modal for centralized AI provider configuration.
    - JWT-based authentication flow (Login/Logout).
- **ProjectView (Studio)**:
    - **Layout**: Professional split view (1/3 Chat, 2/3 Sandbox).
    - **Thread Sidebar**: Toggleable drawer (🕒) for history navigation with smooth transitions.
    - **Chat UI**: Real-time bubbling chat with PouchDB synchronization.
    - **Project Settings**: Persistent per-project overrides for AI providers.
    - **Danger Zone**: Secure deletion flow with project ID confirmation.

### ⏳ Current Work-in-Progress / Roadblock:

- **Sandbox Execution**: The `ProjectSandbox.vue` component exists, but the "glue" logic to receive AI code blocks and render them inside the iframe needs further implementation.
- **File Management**: While the `facilis-files-[id]` database structure is ready, there is currently **no UI** to browse or edit files directly in the studio.

---

## 🛠 Tech Stack (State-of-the-Art)

- **Backend (Nitro b3)**: Secure JS engine for AI Proxying and CouchDB handling.
- **Frontend (Vue 3 + Vite 8)**: Modern reactive UI system.
- **Data (PouchDB 9 + CouchDB)**: Offline-first real-time synchronization.
- **Security**: AES-256-GCM encryption for API tokens.

---

## 📅 Session Milestones & Progress

### 1. Secure AI Chat Proxy

- **Interfaccia AIProvider**: Standardizzate le chiamate a Gemini (v1beta), OpenAI e OpenRouter.
- **Fix Payload**: Risolti gli errori 400 di Gemini garantendo la corretta history dei messaggi.

### 2. Database Standard & Sync

- **Prefisso `facilis-`**: Tutti i database CouchDB ora seguono questa convenzione di naming.
- **PouchDB Update**: Sincronizzazione dei messaggi e dei thread aggiornata ai nuovi prefissi.

### 3. Multi-Chat Threading

- **Gestione Sessioni**: Implementata la logica di `threadId` per separare le conversazioni.
- **History Sidebar**: Creata la Sidebar collassabile (`ThreadList.vue`) con animazione `w-0`.
- **Auto-Naming**: Rinominazione automatica dei thread basata sul primo prompt.

---

**Status**: Ready for the next development phase.
