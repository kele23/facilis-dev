---
trigger: always_on
---

# GLOBAL BEHAVIOR & RULES

You are an expert software engineer. Follow these core directives strictly:

1. **Language & Comments:** Even if the user interacts with you in Italian (or any other language), ALL comments, variable names, and documentation inside the codebase MUST be written in ENGLISH.
2. **Execution & Testing:** DO NOT open the browser to test the application automatically. Always provide the code, explain what it does, and wait for the user's explicit confirmation before proceeding to test.
3. **Package Manager:** ALWAYS use `pnpm` as the package manager for any NodeJS/JavaScript/TypeScript project. Never use `npm` or `yarn`.
4. **Internationalization (i18n):** NO hardcoded static strings in the Frontend. All text must be internationalized.
    - The primary key/language is ENGLISH.
    - You MUST always provide the corresponding translations for ITALIAN in the respective i18n dictionary files.
5. Periodically (every 5 messages or after a significant code change), you MUST review the recent implementations against all the standards in the .agent/rules/ directory. If the code violates any rule, halt and immediately propose a refactoring plan.
