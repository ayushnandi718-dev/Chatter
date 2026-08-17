# Chatter Frontend

React 19 + Vite 8 single-page application for the Chatter real-time messaging platform.

## Stack

- **React 19** with React Compiler (babel-plugin-react-compiler for automatic memoization)
- **Vite 8** with Rolldown + Babel plugin (`@rolldown/plugin-babel`)
- **Tailwind CSS 4** with Vite plugin (`@tailwindcss/vite`)
- **Zustand 5** for state management (7 stores)
- **Socket.io Client** for real-time WebSocket communication
- **Lucide React** for icons
- **React Router 8** for client-side routing
- **React Hot Toast** for notifications
- **Axios** for HTTP requests
- **Clerk** (`@clerk/react`) for authentication UI

## Architecture

### Entry Flow

1. `App.jsx` initializes `ThemeContext` and `WallpaperContext` providers
2. React Router renders `AuthPage` or `ChatPage` based on auth state
3. On auth check, `useAuthStore.checkAuth()` fetches the user profile, connects the Socket.io socket, and triggers `useCryptoStore.ensureIdentityKey()` to set up E2EE

### Component Tree

```
App
├── ThemeProvider (ThemeContext — dynamic theme switching)
│   └── WallpaperProvider (WallpaperContext — chat wallpapers)
│       ├── Router
│       │   ├── AuthPage (/login) — Clerk UI + UsernameModal
│       │   └── ChatPage (/) — 3-column responsive layout
│       │       ├── Sidebar (conversation list + friends tab + search)
│       │       │   └── FriendRequests (pending incoming/outgoing)
│       │       ├── ChatHeader (partner name, online status, E2EE badge, menu)
│       │       │   └── WallpaperModal (per-conversation wallpaper picker)
│       │       ├── MessageList (date separators, E2EE badge, media, reactions)
│       │       │   └── MediaModal (image lightbox / video player)
│       │       ├── ChatComposer (text input, attach menu, voice recorder, drag-drop)
│       │       └── NoChatSelected (empty state)
│       ├── PageLoader
│       └── UsernameModal
```

### State Management (Zustand Stores)

| Store | File | Responsibility |
|---|---|---|
| `useAuthStore` | `store/useAuthStore.js` | Current user profile (`authUser`), auth state, Socket.io connection, online users list |
| `useChatStore` | `store/useChatStore.js` | Conversations list, active messages, selected user, send/receive/retry/delete, typing indicators, delivery states (SENDING/SENT/DELIVERED/READ/FAILED) with server-persisted `deliveredAt`, block/unblock/report, reconnect requests, pinned messages, decrypted previews, browser notifications |
| `useCryptoStore` | `store/useCryptoStore.js` | Identity key pair generation and loading, friend public key fetching and caching, session key derivation and caching, message encryption/decryption, crypto state machine (KEY_SETUP/ENCRYPTED/KEY_CHANGED/DECRYPTION_FAILED/ENCRYPTION_FAILED/SESSION_REQUIRED/KEY_REVOKED) |
| `useFriendStore` | `store/useFriendStore.js` | Friends list, incoming/outgoing requests, user search, send/accept/reject/cancel requests, real-time friend event subscriptions |
| `useSoundStore` | `store/useSoundStore.js` | Sound toggle (persisted in localStorage), Web Audio API synthesizer for keystroke clicks, send chirps, receive chimes |
| `useWallpaperStore` | `store/useWallpaperStore.js` | Global wallpaper, per-conversation wallpaper overrides, brightness control, custom wallpaper upload (up to 5), all persisted in localStorage |
| `usePreferencesStore` | `store/usePreferencesStore.js` | User preferences (readReceipts, showOnlineStatus, showProfilePhoto, messageSounds, typingSounds), per-conversation preferences (muted, pinned, archived) |

### Library Files

| File | Purpose |
|---|---|
| `lib/axios.js` | Axios instance with base URL and credential configuration |
| `lib/crypto.js` | ECDH P-256 key generation, HKDF-SHA256 derivation, AES-256-GCM encrypt/decrypt, AAD creation, key fingerprinting, session key storage, crypto self-test |
| `lib/crypto-states.js` | `CryptoState` enum and protocol constants (`PROTOCOL_VERSION`, `HKDF_SALT`) |
| `lib/wallpapers.js` | 25 built-in wallpapers across 4 categories (solid, gradient, pattern, abstract), category helpers, default wallpaper |

### Context Providers

| Context | Purpose |
|---|---|
| `ThemeContext` | Dynamic theme switching across 11 themes via CSS custom properties |
| `WallpaperContext` | Chat wallpaper management and application |

## E2EE Client-Side Implementation

The crypto layer (`lib/crypto.js`) implements:

1. **Identity Key Generation** — ECDH P-256 key pair generated via Web Crypto API on first login. Private key stored in IndexedDB (`chatter-e2ee` database, `keys` store). Public key (JWK format) uploaded to the server.

2. **Session Key Derivation** — For each conversation, a session key is derived:
   - Fetch the friend's public key from the server
   - Perform ECDH key agreement to get a 256-bit shared secret
   - Derive an AES-256-GCM key using HKDF-SHA256 with the conversation ID as info and a fixed salt
   - Session key cached in memory and persisted to IndexedDB (`sessions` store)

3. **Message Encryption** — Plaintext encrypted with AES-256-GCM:
   - Random 12-byte IV generated per message
   - AAD constructed from: protocol version, conversation ID, message ID, sender ID, recipient ID, sequence number
   - Output: base64-encoded ciphertext and IV

4. **Crypto Self-Test** — On startup, `cryptoSelfTest()` verifies the entire pipeline: ECDH agreement between two ephemeral keys, HKDF derivation, AES-GCM encrypt/decrypt roundtrip, and AAD tamper detection.

5. **IndexedDB Persistence** — Two object stores in the `chatter-e2ee` database:
   - `keys` — Identity private key and public JWK
   - `sessions` — Per-conversation AES-256-GCM session keys

## Scripts

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

## Environment Variables

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

`VITE_API_URL` should be empty in production (same-origin) or point to the backend in development.
