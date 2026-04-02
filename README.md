# 🚀 Facilis.dev

### Build the Web with the Power of your Vibe

**Facilis.dev** is the ultimate **VibeCoding** platform. It transforms your ideas into fully functional web applications using just natural language. Whether you're a seasoned developer or just starting, Facilis is designed to let you build, iterate, and deploy at the speed of thought.

---

## ✨ Features that empower your creativity

### 🎨 VibeCoding: Code at the Speed of Chat

Stop worrying about syntax. Just describe what you want, and Facilis builds it.

- **Natural Language First**: "Build me a personal task manager with a sleek dark theme" — done.
- **Instant Live Preview**: See your app come to life in real-time as the AI writes the code.
- **Iterative Refinement**: Need a change? Just ask. The AI understands your project's context and evolves it with you.

### 💾 Persistent Mini-Apps (Built-in Database)

Your creations aren't just static prototypes; they are real applications.

- **Smart Data Persistence**: Every mini-app you build can have its own **persistent database** (Powered by PouchDB/CouchDB). Your data stays safe and syncs automatically.
- **Ready for Logic**: Build forms, user dashboards, or inventory systems that actually save state.
- **Seamless Sync**: Work offline or online; your projects are always synchronized across all your devices.

### ⏳ The Time Machine (Safe Exploration)

Never be afraid to experiment.

- **Automatic Snapshots**: Every major change is automatically saved.
- **Preview the Past**: Browse through your project's history and preview any version without losing your current progress.
- **Contextual Rollback**: Restore an old version with a single click. Facilis even cleans up the AI's "memory" so it stays perfectly aligned with the restored version.

### 📱 Multi-Device Ready

- **Responsive by Nature**: Switch between Mobile, Tablet, and Desktop views instantly to ensure your app looks stunning on every screen.
- **Secure Sandbox**: Your apps run in an isolated environment, ensuring safety and performance.

---

## 🛠️ How it Works (The Technical Side)

Facilis.dev is built on a robust, modern stack to ensure maximum performance and flexibility:

- **Core Strategy**: [Vue 3](https://vuejs.org/) + [Nitro](https://nitro.unjs.io/) for a lightning-fast full-stack experience.
- **Database Engine**: [PouchDB](https://pouchdb.com/) for local-first responsiveness with [CouchDB](https://couchdb.apache.org/) for cloud sync.
- **Design System**: [TailwindCSS](https://tailwindcss.com/) & [DaisyUI](https://daisyui.com/) for beautiful, customizable interfaces.
- **AI Intelligence**: Native support for **Google Gemini**, **Claude**, and **OpenAI**.

---

## 🚀 Getting Started

### 1. Simple Installation

```bash
git clone https://github.com/kele23/facilis-dev.git
cd facilis-dev
pnpm install
```

### 2. Configure your Backend

Define your CouchDB connection in your environment or `nitro.config.ts`:

```env
NITRO_COUCH_URL=http://your-couchdb:5984
NITRO_JWT_SECRET=your-secret-key
```

### 3. Launch & Build

```bash
pnpm run dev
```

> [!TIP]
> **No Environment Variables for AI Tokens!** Configure your preferred AI provider directly in the app's settings UI for each project.

---

## 🤝 Community & Support

Facilis.dev is an evolving ecosystem. Feel free to open issues or contribute to making the most fluid VibeCoding experience on the web.

---

## 📄 License

This project is licensed under the MIT License.
