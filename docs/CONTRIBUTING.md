# Contributing Guide — Chatter

> How to set up, develop, and contribute to the Chatter messaging platform.

---

## 1. Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | v22.x LTS | Runtime for backend and frontend |
| npm | v10+ | Package manager |
| Git | v2.30+ | Version control |
| Docker Desktop | Latest (optional) | Container builds |
| MongoDB Atlas | Free tier+ | Database |
| Clerk | Free tier+ | Authentication |
| ImageKit | Free tier+ | Media CDN |

---

## 2. Development Setup

### Clone the Repository

```bash
git clone https://github.com/ayushnandi718-dev/Chatter.git
cd chatting
```

### Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Environment Variables

**Backend (`backend/.env`):**

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/Chatter_db?retryWrites=true&w=majority

CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
```

**Frontend (`frontend/.env`):**

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

See `.env.example` files in each directory for reference.

### Start Development Servers

**Terminal 1 — Backend (Express + Socket.io):**

```bash
cd backend && npm run dev
# Runs on http://localhost:3001 with nodemon (auto-reload)
```

**Terminal 2 — Frontend (Vite):**

```bash
cd frontend && npm run dev
# Runs on http://localhost:5173 with HMR
```

### Optional: Seed Database

```bash
cd backend && npm run db:seed
```

Creates sample users for testing.

---

## 3. Clerk Webhook Setup (Local)

Clerk requires a public HTTPS URL for webhooks. Use ngrok for local development:

1. Start ngrok:
   ```bash
   ngrok http 3001
   ```

2. Go to [Clerk Dashboard > Webhooks](https://dashboard.clerk.com/)

3. Add endpoint:
   ```
   https://<ngrok-id>.ngrok-free.app/api/webhooks/clerk
   ```

4. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`

5. Copy the signing secret to `backend/.env`:
   ```
   CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
   ```

---

## 4. Docker Development

### Build

```bash
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_... -t chatter .
```

### Run

```bash
docker run -p 3001:3001 --env-file backend/.env chatter
```

Visit `http://localhost:3001`.

---

## 5. Code Style

### General

- Use ES modules (`import`/`export`) throughout — both backend and frontend use `"type": "module"`
- Prefer `const` over `let`; avoid `var`
- Use meaningful variable and function names
- Keep functions focused and under 50 lines where possible

### Backend

- Controllers go in `backend/src/controllers/`
- Models go in `backend/src/models/` (Mongoose schemas)
- Routes go in `backend/src/routes/` (Express Router)
- Middleware goes in `backend/src/middleware/`
- All route handlers must use `protectRoute` middleware unless explicitly public
- Use `toPublicUser()` for any user data returned to other users
- Use `req.user._id` for the authenticated user (set by `protectRoute`)

### Frontend

- Components go in `frontend/src/components/`
- Zustand stores go in `frontend/src/store/`
- Library utilities go in `frontend/src/lib/`
- Use Zustand stores for global state; React state for local component state
- All API calls go through `axiosInstance` from `lib/axios.js`
- E2EE operations go through `useCryptoStore` — never call `crypto.js` directly from components

### E2EE

- Never log plaintext messages in production
- Never store plaintext in localStorage or sessionStorage
- All crypto keys are stored in IndexedDB only
- Use `cryptoSelfTest()` to verify crypto pipeline before trusting encryption operations

---

## 6. Branch Naming

| Pattern | Purpose | Example |
|---|---|---|
| `main` | Production branch | — |
| `feat/<name>` | New feature | `feat/message-reactions` |
| `fix/<name>` | Bug fix | `fix/decrypt-fallback` |
| `refactor/<name>` | Code refactoring | `refactor/socket-events` |
| `docs/<name>` | Documentation updates | `docs/api-spec` |
| `chore/<name>` | Maintenance tasks | `chore/dependency-update` |

---

## 7. Commit Conventions

Use clear, descriptive commit messages:

```
<type>: <short description>

<optional body>
```

**Types:**

| Type | When to Use |
|---|---|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only changes |
| `chore` | Build process, dependencies, or tooling changes |
| `test` | Adding or updating tests |
| `style` | Code style changes (formatting, no logic change) |

**Examples:**

```
feat: add emoji reactions to messages
fix: handle decrypt failure gracefully in conversation previews
docs: update API spec with pin endpoints
chore: update mongoose to v9.9.2
```

---

## 8. Testing

### Crypto Self-Test

The E2EE crypto pipeline includes an automated self-test (`cryptoSelfTest()` in `lib/crypto.js`) that runs on application startup. It verifies:

1. ECDH P-256 key agreement between two ephemeral key pairs
2. HKDF-SHA256 key derivation from shared secrets
3. AES-256-GCM encrypt/decrypt roundtrip
4. AAD tamper detection (decryption should fail with modified AAD)

### Manual Testing

- Test message sending and receiving in two browser windows
- Verify E2EE by checking server logs (no plaintext should appear)
- Test file upload (image, video, audio, document)
- Test friend request flow (send, accept, reject, cancel)
- Test block/unblock flow
- Test on mobile viewport (320px minimum width)

---

## 9. Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Test thoroughly (see Testing section)
4. Run the linter:
   ```bash
   cd frontend && npm run lint
   ```
5. Commit with clear, descriptive messages
6. Push to your fork and create a pull request against `main`
7. Fill in the PR description with:
   - What changed and why
   - How to test the changes
   - Any breaking changes or migration steps

### PR Review Checklist

- [ ] Code follows existing conventions and patterns
- [ ] No plaintext logged or stored insecurely
- [ ] No secrets or keys committed
- [ ] API changes are reflected in `docs/API_SPEC.md`
- [ ] UI changes work on mobile (320px+)
- [ ] E2EE operations go through the crypto store
- [ ] Error handling is in place

---

## 10. Security Considerations

### Never Log Plaintext

- Never log decrypted message content in production
- The `[E2EE]` debug logs in `useCryptoStore` are gated behind `import.meta.env.DEV`
- If adding new logging, ensure it is development-only

### Never Commit Secrets

- Never commit `.env` files, API keys, or signing secrets
- The `.gitignore` should exclude `backend/.env` and `frontend/.env`
- Use environment variables for all secrets
- Rotate any keys that are accidentally committed

### API Security

- All protected routes must use `protectRoute` middleware
- User data returned to other users must go through `toPublicUser()`
- Socket.io connections must validate `userId` against MongoDB
- File uploads must be limited to 25MB and processed in-memory

### E2EE Security

- Private keys never leave the client browser
- Session keys are derived per-conversation and never transmitted
- AAD binding prevents cross-conversation decryption
- The server never has access to plaintext message content

---

## 11. Project Structure Reference

```
chatting/
├── Dockerfile
├── README.md
├── docs/
│   ├── README.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── PROJECT_REVIEW.md
│   └── CONTRIBUTING.md
├── backend/
│   └── src/
│       ├── index.js              # Express + Socket.io entry
│       ├── controllers/          # Route handlers
│       ├── lib/                  # Socket, cron, db, imagekit, crypto, utils
│       ├── middleware/            # Auth (Clerk), upload (Multer)
│       ├── models/               # User, Message, Friendship, Block, Report,
│       │                         # UserPreferences, ConversationPreferences
│       ├── routes/               # REST route definitions
│       ├── seeds/                # DB seed script
│       └── webhooks/             # Clerk webhook handler
└── frontend/
    └── src/
        ├── App.jsx
        ├── index.css             # Design system (CSS variables)
        ├── components/
        │   ├── chat/             # ChatPage, Sidebar, ChatHeader, etc.
        │   └── PageLoader.jsx, UsernameModal.jsx
        ├── constants/            # Themes, wallpapers
        ├── context/              # ThemeContext, WallpaperContext
        ├── lib/                  # Axios, crypto.js, crypto-states.js, wallpapers.js
        ├── pages/                # AuthPage, ChatPage
        └── store/                # Zustand stores (7)
```

---

## 12. Scripts Reference

| Command | Location | Description |
|---|---|---|
| `npm run dev` | Backend | Start Express with nodemon (auto-reload) |
| `npm run start` | Backend | Production start |
| `npm run build` | Backend | Copy src/ to dist/ |
| `npm run db:seed` | Backend | Seed sample users into MongoDB |
| `npm run dev` | Frontend | Start Vite dev server with HMR |
| `npm run build` | Frontend | Production build |
| `npm run lint` | Frontend | ESLint check |
| `npm run preview` | Frontend | Preview production build locally |
