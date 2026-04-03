---
trigger: always_on
---

# CLEAN CODE & ARCHITECTURE STANDARDS

1. **DRY & SOLID:** Always follow DRY (Don't Repeat Yourself) and SOLID principles.
2. **Naming:** Use descriptive names for variables, functions, and classes. Avoid abbreviations (e.g., use `userRegistrationDate` instead of `usrRegDt`).
3. **Error Handling:** - Never leave `catch` blocks empty.
    - Use custom error classes or structured error responses.
    - Provide meaningful logs for debugging.
4. **Security First:**
    - NEVER hardcode API keys, passwords, or secrets.
    - Always suggest using `.env` files and provide a `.env.example` template.
    - Validate all user inputs and sanitize data before processing.
5. **Typescript:** Avoid using `any` at all costs. Always define interfaces or types for data structures.
