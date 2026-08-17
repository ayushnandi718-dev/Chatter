# Chatter

> A modern, full-stack private messaging platform with end-to-end encryption, Discord-style anonymous identity, real-time chat, rich media sharing, and premium UI.

**Live:** [chatter-lrig.onrender.com](https://chatter-lrig.onrender.com) | **Repo:** [github.com/ayushnandi718-dev/Chatter](https://github.com/ayushnandi718-dev/Chatter)

---

## Features

- **End-to-End Encryption** — ECDH P-256 + HKDF-SHA256 + AES-256-GCM with per-conversation session keys, AAD binding, and key fingerprints.
- **Real-Time Messaging** — Instant 1-on-1 chat via Socket.io with typing indicators, read receipts, and auto-reconnection.
- **Anonymous Identity** — Discord-style usernames and display names. Email, Clerk ID, and full name are never exposed to other users.
- **Rich Media Sharing** — Send photos, videos, voice messages, documents (PDF, DOCX, TXT, CSV, XLSX), and any file up to 25MB via ImageKit CDN.
- **Friend System** — Search users by username, send/accept/reject friend requests, friends-only conversation sidebar.
- **Block & Report** — Block users to hide conversations and prevent messages. Report users with reason categories.
- **11 Themes & 13 Wallpapers** — Full design system with CSS variables, dynamic theme switcher, and custom chat wallpapers.
- **Keyboard Sound Effects** — Toggleable mechanical keyboard audio on typing and send.
- **Mobile Optimized** — Responsive 3-column layout, safe-area insets, touch targets, overscroll prevention.
- **Privacy by Design** — Sensitive fields (email, clerkId, fullName) stripped at API layer. ReDoS-safe search regex.
- **Clerk Authentication** — Social logins (Google, GitHub, Email) with automatic MongoDB webhook sync.
- **Keep-Alive Cron** — 14-minute automated ping for free-tier Render hosting.
- **Docker Monolith** — Single multi-stage container serving both Vite SPA and Express API.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Zustand 5, Socket.io Client, Axios, Lucide Icons, React Router 8 |
| **Backend** | Node.js (ESM), Express 5, Socket.io, Mongoose 9, @clerk/express, Multer, @imagekit/nodejs, Cron |
| **Database** | MongoDB Atlas |
| **Auth** | Clerk (webhooks + session middleware) |
| **Media CDN** | ImageKit.io |
| **Encryption** | Web Crypto API (ECDH P-256, HKDF-SHA256, AES-256-GCM) |
| **Deployment** | Docker (multi-stage), Render |

---

## Documentation

| Document | Description |
|---|---|
| [PRD.md](./docs/PRD.md) | Product requirements, user stories, acceptance criteria, and success KPIs |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System topology, E2EE crypto layer, database ERD, Socket.io architecture |
| [API_SPEC.md](./docs/API_SPEC.md) | REST endpoints, Socket.io event catalog, payload schemas |
| [PROJECT_REVIEW.md](./docs/PROJECT_REVIEW.md) | Codebase audit, completed fixes, and engineering status |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Local setup, environment config, Docker build, webhook testing |

---

## Quick Start

### Clone & Install

```bash
git clone https://github.com/ayushnandi718-dev/Chatter.git
cd chatting

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

See `.env.example` files for required keys (MongoDB Atlas, Clerk, ImageKit).

### Run Locally

```bash
# Terminal 1 — Backend (Express + Socket.io)
cd backend && npm run dev

# Terminal 2 — Frontend (Vite)
cd frontend && npm run dev
```

### Docker

```bash
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_... -t chatter .
docker run -p 3001:3001 --env-file backend/.env chatter
```

---

## Project Structure

```
chatting/
├── Dockerfile                    # Multi-stage production container
├── README.md
├── docs/                         # Project documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── PROJECT_REVIEW.md
│   └── CONTRIBUTING.md
├── backend/
│   └── src/
│       ├── index.js              # Express + Socket.io entry
│       ├── controllers/          # Auth, message, user, friend, block, report
│       ├── lib/                  # Socket, cron, db, imagekit, utils, crypto
│       ├── middleware/            # Auth (Clerk), upload (Multer)
│       ├── models/               # User, Message, Friendship, Block, Report
│       ├── routes/               # REST route definitions
│       ├── seeds/                # DB seed script
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
        ├── lib/                  # Axios, crypto.js, crypto-states.js
        ├── pages/                # AuthPage, ChatPage
        └── store/                # useAuthStore, useChatStore, useCryptoStore,
                                  # useFriendStore, useSoundStore
```

---

## License

ISC
