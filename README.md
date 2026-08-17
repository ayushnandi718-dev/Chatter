# Chatter

> A modern, full-stack private messaging platform with end-to-end encryption, Discord-style anonymous identity, real-time chat, rich media sharing, and a premium customizable UI.

**Live:** [chatter-lrig.onrender.com](https://chatter-lrig.onrender.com) | **Repo:** [github.com/ayushnandi718-dev/Chatter](https://github.com/ayushnandi718-dev/Chatter)

---

## Screenshots

<!-- Add screenshots here -->

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Zustand 5, Socket.io Client, Axios, Lucide Icons, React Router 8 |
| **Backend** | Node.js (ESM), Express 5, Socket.io, Mongoose 9, @clerk/express, Multer, @imagekit/nodejs, Cron |
| **Database** | MongoDB Atlas |
| **Auth** | Clerk (social + email login, webhooks, session middleware) |
| **Media CDN** | ImageKit.io |
| **Encryption** | Web Crypto API (ECDH P-256, HKDF-SHA256, AES-256-GCM) |
| **Deployment** | Docker (multi-stage), Render |

---

## Features

### Authentication & Identity
- Clerk authentication with Google, GitHub, and Email/Password social logins
- Automatic MongoDB webhook sync on user creation, update, and deletion
- Discord-style unique usernames and display names (email, Clerk ID, and full name never exposed)
- Identity key pair generation for end-to-end encryption on first login

### Messaging
- Real-time 1-on-1 text messaging via Socket.io
- Message delivery states: SENDING, SENT, DELIVERED, READ, FAILED
- Retry failed messages with one click
- Reply to specific messages
- Emoji reactions on messages
- Edit sent messages
- Delete messages (for self or for everyone)
- Pin important messages in conversations
- Typing indicators with real-time status
- Read receipts and online presence tracking
- Browser push notifications for new messages when the tab is in the background
- Message deduplication via clientMessageId

### End-to-End Encryption (E2EE)
- ECDH P-256 key agreement for shared secret generation
- HKDF-SHA256 key derivation with per-conversation session keys
- AES-256-GCM authenticated encryption with 12-byte IV and 128-bit auth tag
- Additional Authenticated Data (AAD) binding: protocol version, conversation ID, message ID, sender, recipient, sequence number
- Client-side crypto self-test on startup
- Key fingerprint generation for verification
- IndexedDB persistence for identity keys and session keys
- Graceful fallback for legacy unencrypted messages

### Rich Media Sharing
- Photo upload with inline preview and image lightbox viewer
- Video upload with HTML5 playback controls
- Voice message recording via MediaRecorder API with duration indicator
- Document and file sharing (PDF, DOCX, XLSX, TXT, CSV, ZIP, and more)
- File type detection by MIME type with appropriate display
- Drag-and-drop file upload
- All media served via ImageKit global CDN

### Friend System
- Search users by username or display name
- Send, accept, reject, and cancel friend requests
- Real-time friend request notifications via Socket.io
- Friends-only conversation sidebar
- Remove friends

### Block & Report
- Block users to hide conversations and prevent message delivery
- Unblock previously blocked users
- Report users with reason categories (spam, harassment, scam, impersonation, illegal, other)
- Optional report description field

### Customization
- 25 built-in chat wallpapers across 4 categories: solid, gradient, pattern, abstract
- Custom wallpaper upload (up to 5 custom wallpapers stored in localStorage)
- Per-conversation wallpaper overrides with brightness control
- Keyboard sound effects (mechanical keystroke, send chirp, receive chime) via Web Audio API
- Sound toggle stored in localStorage

### Privacy & Settings
- User preferences: read receipts, online status visibility, profile photo visibility, message sounds, typing sounds
- Per-conversation preferences: mute (with optional duration), pin, archive
- `toPublicUser()` API stripping: email, clerkId, fullName never sent to other users
- E2EE ensures the server never sees plaintext message content

### Mobile Experience
- Responsive 3-column layout (sidebar, chat, details)
- Safe-area insets for notch and toolbar devices
- 36px minimum touch targets
- Overscroll prevention and tap-highlight removal

### Infrastructure
- Docker multi-stage monolith (frontend build + backend build + runtime)
- Non-root container execution
- Render deployment with auto-deploy from main
- Keep-alive cron job for free-tier hosting
- Health check endpoint at `/health`

---

## Getting Started

### Prerequisites

- Node.js v22.x LTS
- npm v10+
- MongoDB Atlas account
- Clerk account ([clerk.com](https://clerk.com))
- ImageKit account ([imagekit.io](https://imagekit.io))

### Clone & Install

```bash
git clone https://github.com/ayushnandi718-dev/Chatter.git
cd chatting

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Environment Setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Backend (backend/.env):**
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/Chatter_db
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
```

**Frontend (frontend/.env):**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

### Run Locally

```bash
# Terminal 1 — Backend (Express + Socket.io)
cd backend && npm run dev

# Terminal 2 — Frontend (Vite)
cd frontend && npm run dev
```

Backend runs on `http://localhost:3001`, frontend on `http://localhost:5173`.

---

## Deployment

### Docker

```bash
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_... -t chatter .
docker run -p 3001:3001 --env-file backend/.env chatter
```

The Dockerfile uses a 3-stage multi-stage build:
1. **frontend-build** — Vite production build (static SPA)
2. **backend-build** — Copies ESM source to `dist/`
3. **runner** — Production runtime on `node:22-bookworm-slim` (non-root, port 3001)

### Render

- Auto-deploy from `main` branch
- Environment variables set in Render dashboard
- Single port serves both the SPA (static files) and API (Express)
- Keep-alive cron runs every 14 minutes for free-tier instances

---

## Security

### End-to-End Encryption

All text messages are encrypted client-to-client using:

| Layer | Algorithm | Purpose |
|---|---|---|
| Key Agreement | ECDH P-256 | Generate shared secret between two users |
| Key Derivation | HKDF-SHA256 | Derive AES key from shared secret + salt + conversation ID |
| Encryption | AES-256-GCM | Authenticated encryption with 12-byte IV + 16-byte auth tag |
| Binding | AAD | Additional Authenticated Data prevents cross-conversation decryption |

The server stores only ciphertext. Plaintext is never transmitted to or stored on the server.

### Privacy Model

- `toPublicUser()` strips `email`, `clerkId`, and `fullName` from all API responses
- Socket.io validates `userId` against MongoDB on connection
- Clerk session verification on every protected route
- Svix cryptographic webhook signature verification
- CORS restricts origins in production (localhost excluded)
- ReDoS-safe regex for user search

---

## API Overview

All API routes are prefixed with `/api`. Protected routes require a valid Clerk session token.

| Route Prefix | Purpose |
|---|---|
| `/api/auth` | Authentication check |
| `/api/users` | User search, profile, public keys, username management |
| `/api/friends` | Friend list, requests, accept/reject/cancel/remove |
| `/api/blocks` | Block, unblock, report users |
| `/api/messages` | Conversations, messages, send, read, reactions, pin, edit, delete |
| `/api/preferences` | User preferences and per-conversation preferences |
| `/api/webhooks/clerk` | Clerk webhook receiver |

Full API documentation: [docs/API_SPEC.md](./docs/API_SPEC.md)

---

## Documentation

| Document | Description |
|---|---|
| [PRD.md](./docs/PRD.md) | Product requirements, personas, user stories, acceptance criteria, success metrics |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System topology, E2EE crypto layer, database schema, Socket.io architecture |
| [API_SPEC.md](./docs/API_SPEC.md) | REST endpoint contracts, Socket.io event catalog, payload schemas |
| [PROJECT_REVIEW.md](./docs/PROJECT_REVIEW.md) | Codebase audit, completed features, E2EE status, known issues, roadmap |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Development setup, code style, branch naming, PR process |

---

## Project Structure

```
chatting/
├── Dockerfile                    # Multi-stage production container
├── README.md
├── docs/                         # Project documentation
│   ├── README.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── PROJECT_REVIEW.md
│   └── CONTRIBUTING.md
├── backend/
│   └── src/
│       ├── index.js              # Express + Socket.io entry point
│       ├── controllers/          # Auth, message, user, friend, block, preferences
│       ├── lib/                  # Socket.io, cron, db, imagekit, utils, crypto
│       ├── middleware/            # Auth (Clerk), upload (Multer)
│       ├── models/               # User, Message, Friendship, Block, Report,
│       │                         # UserPreferences, ConversationPreferences
│       ├── routes/               # REST route definitions
│       ├── seeds/                # Database seed script
│       └── webhooks/             # Clerk webhook handler
└── frontend/
    └── src/
        ├── App.jsx
        ├── index.css             # Design system (CSS variables)
        ├── components/
        │   ├── chat/             # ChatPage, Sidebar, ChatHeader, ChatComposer,
        │   │                     # MessageList, FriendRequests, SearchUsers,
        │   │                     # WallpaperModal, MediaModal, NoChatSelected
        │   └── PageLoader.jsx, UsernameModal.jsx
        ├── constants/            # Themes, wallpapers
        ├── context/              # ThemeContext, WallpaperContext
        ├── lib/                  # Axios, crypto.js, crypto-states.js, wallpapers.js
        ├── pages/                # AuthPage, ChatPage
        └── store/                # useAuthStore, useChatStore, useCryptoStore,
                                  # useFriendStore, useSoundStore, useWallpaperStore,
                                  # usePreferencesStore
```

---

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for development setup, code style, and PR process.

---

## License

ISC
