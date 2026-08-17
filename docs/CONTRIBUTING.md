# Development & Contributing Guide — Chatter

> How to set up, develop, and deploy Chatter locally.

---

## 1. Prerequisites

- **Node.js** v22.x LTS
- **npm** v10+
- **Git** v2.30+
- **Docker Desktop** (optional)
- **MongoDB Atlas** account
- **Clerk** account ([clerk.com](https://clerk.com))
- **ImageKit** account ([imagekit.io](https://imagekit.io))

---

## 2. Environment Variables

### Backend (`backend/.env`)

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/Chatter_db?retryWrites=true&w=majority

CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
```

### Frontend (`frontend/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

---

## 3. Local Development

### Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Seed Database (Optional)
```bash
cd backend && npm run db:seed
```

### Start Dev Servers

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
# Express + Socket.io on http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
# Vite on http://localhost:5173
```

---

## 4. Clerk Webhook Setup (Local)

Clerk needs a public HTTPS URL for webhooks:

1. Start ngrok: `ngrok http 3000`
2. Go to [Clerk Dashboard > Webhooks](https://dashboard.clerk.com/)
3. Add endpoint: `https://<ngrok-id>.ngrok-free.app/api/webhooks/clerk`
4. Subscribe to: `user.created`, `user.updated`, `user.deleted`
5. Copy signing secret to `backend/.env` as `CLERK_WEBHOOK_SIGNING_SECRET`

---

## 5. UI Customization

### Themes
11 themes defined in `frontend/src/constants/themes.js`. Switch via `ThemeContext`.

### Wallpapers
13 wallpapers in `frontend/public/wallpapers/`. Managed by `WallpaperContext`.

### Keyboard Sounds
Sound clips in `frontend/public/sounds/`. Toggle via `useSoundStore`.

---

## 6. Docker

```bash
# Build
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_... -t chatter .

# Run
docker run -p 3001:3001 --env-file backend/.env chatter
```

Visit `http://localhost:3001`.

---

## 7. Project Structure

```
chatting/
├── backend/src/
│   ├── index.js              # Express + Socket.io entry
│   ├── controllers/           # Auth, message, user, friend, block
│   ├── lib/                   # Socket, cron, db, imagekit, crypto
│   ├── middleware/             # Auth, upload (Multer)
│   ├── models/                # User, Message, Friendship, Block, Report
│   ├── routes/                # REST routes
│   ├── seeds/                 # DB seed
│   └── webhooks/              # Clerk webhook
└── frontend/src/
    ├── components/chat/       # ChatComposer, ChatHeader, MessageList, etc.
    ├── constants/             # Themes, wallpapers
    ├── context/               # ThemeContext, WallpaperContext
    ├── lib/                   # Axios, crypto.js, crypto-states.js
    ├── pages/                 # AuthPage, ChatPage
    └── store/                 # Zustand stores (5)
```

---

## 8. Scripts

| Command | Location | Description |
|---|---|---|
| `npm run dev` | Backend | Start Express with nodemon |
| `npm run start` | Backend | Production start |
| `npm run build` | Backend | Copy src/ to dist/ |
| `npm run db:seed` | Backend | Seed sample users |
| `npm run dev` | Frontend | Start Vite dev server |
| `npm run build` | Frontend | Production build |
| `npm run lint` | Frontend | ESLint check |
| `npm run preview` | Frontend | Preview production build |
