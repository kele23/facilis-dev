---
trigger: always_on
---

# MEMORY & CONTEXT MANAGEMENT PROTOCOL

To prevent context loss and "Lost in the Middle" syndrome, you must maintain a dedicated memory directory at `.agent/memory/`. You will use this folder as your persistent external brain.

**Initialization (Start of Session):**
At the beginning of every interaction, before writing any code, silently read ALL files inside `.agent/memory/` to understand the project scope, architecture, and current state. If the folder or the files do NOT exist, create them immediately.

**The Memory Bank Structure:**
You must manage and maintain these three distinct files:

1. **`task_plan.md` (The Roadmap):** - Project scope and ultimate goals.
    - Core architecture and main technologies.
    - The roadmap of pending tasks (what needs to be done).
2. **`progress.md` (The Log):** - History of completed tasks (moved here from the plan).
    - Current state of the application.
    - Explicit "Next Steps" or immediate actions left for the next session.
3. **`findings.md` (The Knowledge Base):** - Specific user instructions and permanent constraints.
    - Technical decisions made during development (e.g., specific library configurations).
    - Important bug resolutions or workarounds.

**Updating Rule (Continuous Process & Closing):**
After completing any major/medium task, or when asked to "save progress" / end the session, you MUST autonomously interact with the file system to update these files.

- Move completed features from `task_plan.md` to `progress.md`.
- Document new rules or learned constraints in `findings.md`.
- Do NOT wait for the user to ask; maintain the memory proactively.
