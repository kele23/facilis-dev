---
trigger: model_decision
description: When working with Vue.js framework
---

# VUE.JS DEVELOPMENT GUIDELINES

When working with Vue.js (`.vue` files, composables, or stores), adhere to these architectural standards:

1. **Script Setup:** Always use `<script setup lang="ts">`.
2. **Tag Order:** The `<script>` tag MUST always be placed ABOVE the `<template>` tag.
3. **Component Modularity (Atomic Design):** Keep components as atomic and small as possible. Do not put too much logic into a single component. Use Vue Composables (`useSomething.ts`) to isolate and extract complex logic.
4. **Notifications (Toaster):** Always implement a "Toaster" store (e.g., using Pinia) along with its relative UI components for app-wide notifications.
5. **Dialog Management:** Always implement a dedicated "Dialog" component and a relative Composable (e.g., `useDialog`) to handle popup state.
    - **Base Dialog Rules:** Must be empty by default, include a close button, an optional title, and handle focus automatically when opened.
    - **Content Injection:** Use `<slot>` to pass content into the dialog.
    - **Confirm Popup:** Always provide a pre-built "Confirm" popup based on the base dialog, to be used for confirmation actions (Yes/No, Proceed/Cancel).
