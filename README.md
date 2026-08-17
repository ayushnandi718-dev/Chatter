# Chatter 💬

> A modern, full-stack real-time messaging application with rich media sharing, Clerk authentication, ImageKit media CDN, Socket.io presence, and MongoDB Atlas persistence.

---

## ✨ Core Features

- 💬 **Full-Stack Real-Time Messaging:** Instant 1-on-1 direct messaging powered by custom Socket.io server.
- 🟢 **Live Online Presence:** Real-time online/offline indicator badges and dynamic user registry.
- 🖼️ **Rich Media Sharing:** Zero-disk photo and video uploads (up to 25MB) via Multer and ImageKit CDN.
- 🔐 **Clerk Authentication:** Social logins (Google, GitHub, Email/Password) with automatic MongoDB webhook sync.
- 🎨 **11 Themes & 13 Wallpapers:** Dynamic theme switcher (Dark, Light, Cupcake, Synthwave, Cyberpunk, Forest, etc.) and custom chat wallpapers.
- ⌨️ **Mechanical Keyboard Sound Effects:** Toggleable typing audio and sent message sound feedback.
- ⏰ **Uptime Protection:** Automated 14-minute cron job to keep free-tier instances awake.
- 🐳 **Monolithic Docker Deployment:** Single multi-stage container serving both the Vite React SPA and Express API.

---

## 📑 Complete Documentation Suite (`/docs`)

All project specifications, architectural blueprints, and developer guides are maintained in the [`/docs`](./docs) directory:

| Document | Purpose & Contents |
|---|---|
| 📋 **[PRD.md](./docs/PRD.md)** | **Product Requirements Document:** Vision, personas, user stories, acceptance criteria, functional matrix, NFRs, and success KPIs. |
| 🏗️ **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | **Technical Design & Architecture:** System topology, Socket.io presence engine, MongoDB aggregations, and Docker containerization. |
| 🔌 **[API_SPEC.md](./docs/API_SPEC.md)** | **API & WebSocket Specifications:** REST endpoint contracts, Clerk webhook schemas, payload examples, and Socket.io event catalog. |
| 🔍 **[PROJECT_REVIEW.md](./docs/PROJECT_REVIEW.md)** | **Comprehensive Project Review:** In-depth codebase audit, target architecture analysis, drop-in bug fixes, and roadmap. |
| 🤝 **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** | **Developer & Contribution Guide:** Local setup, environment templates, database seeding (`npm run db:seed`), and testing. |

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Tailwind CSS, Hero UI, Zustand, Socket.io Client, Axios, Lucide Icons, Vite 8
- **Backend:** Node.js (ESM), Express 5, Socket.io, Mongoose 9, `@clerk/express`, Multer, `@imagekit/nodejs`, Cron
- **Database:** MongoDB Atlas
- **Storage & CDN:** ImageKit.io
- **Deployment:** Docker (Multi-stage build)

---

## 🚀 Quick Start

### 1. Clone & Setup Environment

```bash
# Clone repository
git clone https://github.com/ayushnandi718-dev/Chatter.git
cd chatting

# Configure Backend environment
cp backend/.env.example backend/.env

# Configure Frontend environment
cp frontend/.env.example frontend/.env
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Run Locally

```bash
# Terminal 1: Backend (Express + Socket.io)
cd backend
npm run dev

# Terminal 2: Frontend (Vite)
cd frontend
npm run dev
```

### 4. Run with Docker (Production)

```bash
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=your_key_here -t chatter .
docker run -p 3001:3001 --env-file backend/.env chatter
```

---

## 📁 Repository Structure

```
chatting/
├── Dockerfile              # Multi-stage production container
├── README.md               # Quickstart and documentation overview
├── docs/                   # Complete project documentation suite
│   ├── README.md           # Documentation hub
│   ├── PRD.md              # Product Requirements Document
│   ├── ARCHITECTURE.md     # Technical architecture & database ERD
│   ├── API_SPEC.md         # REST API & WebSocket specifications
│   ├── PROJECT_REVIEW.md   # Detailed codebase review & audit
│   └── CONTRIBUTING.md     # Local developer setup & testing guide
├── backend/                # Express API, Socket.io, MongoDB models, Clerk webhooks, ImageKit
└── frontend/               # React 19 + Vite client application
```

---

## 📄 License

ISC License
