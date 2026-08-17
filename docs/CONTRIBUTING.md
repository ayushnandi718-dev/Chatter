# Development & Contributing Guide — Chatter

> This guide outlines how to configure, develop, test, and contribute to **Chatter**.

---

## 1. Prerequisites & Tooling

Ensure you have the following installed locally:

- **Node.js:** v20.x or v22.x LTS
- **npm:** v10.x or higher
- **Git:** v2.30+
- **Docker Desktop:** (Optional, for containerized testing)
- **MongoDB Atlas Cluster / Local MongoDB instance**
- **Clerk Identity Account:** [clerk.com](https://clerk.com)
- **ImageKit Account:** [imagekit.io](https://imagekit.io)

---

## 2. Environment Configuration

### 2.1 Backend Environment (`backend/.env`)

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chatter_db?retryWrites=true&w=majority

# Clerk Authentication & Webhooks
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# ImageKit Media Storage
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...
```

### 2.2 Frontend Environment (`frontend/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

---

## 3. Local Development Workflow

### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Database Seeding (Optional)
To populate sample users for local testing:
```bash
cd backend
npm run db:seed
```

### Step 3: Start Development Servers
Open two terminal windows:

**Terminal 1 (Backend API + Socket Server):**
```bash
cd backend
npm run dev
# Starts server on http://localhost:3001 with nodemon
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Starts Vite client on http://localhost:5173
```

---

## 4. Local Clerk Webhook Testing with Ngrok / Svix

Because Clerk needs a public HTTPS URL to deliver webhook events:

1. Launch Ngrok on the backend port:
   ```bash
   ngrok http 3001
   ```
2. Navigate to [Clerk Dashboard > Webhooks](https://dashboard.clerk.com/)
3. Add Endpoint: `https://<ngrok-id>.ngrok-free.app/api/webhooks/clerk`
4. Subscribe to `user.created`, `user.updated`, and `user.deleted`
5. Copy the **Signing Secret** into `backend/.env` as `CLERK_WEBHOOK_SIGNING_SECRET`.

---

## 5. UI Customization & Sensory Assets

### 5.1 Themes & Wallpapers
Chatter supports **11 curated themes** and **13 custom wallpapers**:
- Theme definitions are located in `frontend/src/constants/themes.js`.
- Wallpaper backgrounds are stored in `frontend/public/wallpapers/`.

### 5.2 Mechanical Keyboard Sounds
- Sound clips (`keystroke.mp3`, `send.mp3`) are placed in `frontend/public/sounds/`.
- Managed via `useSoundStore.js` with local storage persistence.

---

## 6. Docker Build & Container Verification

To build and run the complete monolith container locally:

```bash
# Build Docker image from repo root
docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_... \
  -t chatter:latest .

# Run container
docker run -p 3001:3001 --env-file backend/.env chatter:latest
```
Visit `http://localhost:3001` to test the full production build.
