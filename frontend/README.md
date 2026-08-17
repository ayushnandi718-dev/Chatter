# Chatter Frontend

React 19 + Vite 8 single-page application for the Chatter real-time messaging platform.

## Stack

- **React 19** with React Compiler (automatic memoization)
- **Vite 8** with Rolldown + Babel plugin
- **Tailwind CSS 4** with Vite plugin
- **Zustand 5** for state management (5 stores)
- **Socket.io Client** for real-time WebSocket communication
- **Lucide React** for icons
- **React Router 8** for client-side routing
- **React Hot Toast** for notifications
- **Axios** for HTTP requests
- **Clerk** (`@clerk/react`) for authentication UI

## State Stores

| Store | Purpose |
|---|---|
| `useAuthStore` | Current user profile, auth state, sign-out |
| `useChatStore` | Active chat, messages, user list, send/decrypt, typing indicators |
| `useCryptoStore` | ECDH key pair generation, session key exchange, encrypt/decrypt |
| `useFriendStore` | Friend requests, friend list, search users |
| `useSoundStore` | Keyboard sound effects toggle |

## Crypto Layer

- `lib/crypto.js` — ECDH P-256 key generation, HKDF-SHA256 key derivation, AES-256-GCM encrypt/decrypt
- `lib/crypto-states.js` — CryptoState constants (UNINITIALIZED, GENERATING_KEYS, READY, ERROR)

## Scripts

```bash
npm run dev      # Vite dev server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Environment

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```
