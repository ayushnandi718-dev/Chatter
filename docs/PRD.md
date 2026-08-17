# Product Requirements Document (PRD) — Chatter

> **Version:** 4.0.0
> **Product:** Chatter — Private Real-Time Messaging Platform
> **Owner:** Ayush Nandi
> **Last Updated:** August 17, 2026

---

## 1. Vision

Chatter is a full-stack real-time messaging platform that combines WhatsApp's simplicity, Telegram's customization, Discord's identity model, and a privacy-first end-to-end encryption layer. It delivers private 1-on-1 messaging with anonymous usernames, friend management, rich media sharing, and a premium customizable UI — all without compromising user privacy.

**Core principles:**
- The server never sees plaintext message content
- User identity is decoupled from personal information (email, full name)
- Rich features without feature bloat
- Mobile-first responsive design

---

## 2. Target Personas

| Persona | Goals | Features Used |
|---|---|---|
| **Casual User** | Intuitive chat with friends, share media | 1-on-1 chat, file/photo/video/voice sharing, themes, wallpapers |
| **Privacy-Conscious User** | Secure messaging, anonymous identity | E2EE encryption, username-only identity, block/report, privacy settings |
| **Power User** | Personalization, fast experience | 25 wallpapers, 11 themes, keyboard sounds, per-conversation settings |
| **Developer/DevOps** | Easy deployment, clear contracts | Docker monolith, REST + WebSocket specs, Clerk webhooks |

---

## 3. Core Features

### 3.1 Authentication & Identity

| Feature | Description |
|---|---|
| Social Login | Google, GitHub, Email/Password via Clerk |
| Webhook Sync | Automatic MongoDB user record creation/update/deletion via Clerk webhooks |
| Anonymous Identity | Discord-style unique usernames (`/^[a-z0-9._]+$/`, 3-32 chars) and display names (up to 50 chars) |
| Profile Fields | Username, displayName, about (120 char bio), profilePic |
| Sensitive Field Stripping | Email, clerkId, fullName never exposed to other users |

### 3.2 End-to-End Encryption

| Feature | Description |
|---|---|
| Key Agreement | ECDH P-256 elliptic curve Diffie-Hellman |
| Key Derivation | HKDF-SHA256 with per-conversation info and fixed salt |
| Symmetric Encryption | AES-256-GCM with 12-byte IV and 128-bit authentication tag |
| AAD Binding | Protocol version, conversation ID, message ID, sender ID, recipient ID, sequence number |
| Key Persistence | Identity keys and session keys stored in IndexedDB |
| Self-Test | Automated crypto pipeline verification on application startup |
| Key Fingerprints | SHA-256 hash of public key JWK, formatted in 4-character hex groups |
| Fallback | Graceful handling of legacy unencrypted messages |

### 3.3 Messaging

| Feature | Description |
|---|---|
| Text Messages | Real-time via Socket.io with optimistic UI updates |
| Delivery States | SENDING -> SENT -> DELIVERED -> READ (FAILED on error) |
| Retry | One-click retry for failed messages |
| Reply | Reply to any specific message in the conversation |
| Reactions | Emoji reactions on messages |
| Edit | Edit sent messages with timestamp |
| Delete | Delete for self or delete for everyone |
| Pin | Pin important messages (visible in pinned messages list) |
| Deduplication | clientMessageId prevents duplicate messages from Socket.io retransmission |

### 3.4 Media Sharing

| Feature | Description |
|---|---|
| Photos | Upload with inline preview, lightbox viewer on click |
| Videos | HTML5 video player with controls |
| Voice Messages | MediaRecorder API with duration indicator, inline playback |
| Documents | PDF, DOCX, XLSX, TXT, CSV, ZIP — file icon, name, size, download |
| Drag & Drop | Drag files onto the chat area to upload |
| File Size Limit | 25MB maximum via Multer in-memory processing |
| CDN | All media served via ImageKit global CDN |

### 3.5 Friend System

| Feature | Description |
|---|---|
| Search | Search users by username or display name |
| Send Request | Send friend request to any user |
| Accept/Reject | Accept or decline incoming requests |
| Cancel | Cancel outgoing pending requests |
| Remove | Remove an existing friend |
| Real-time Events | Friend request, accepted, and removed events via Socket.io |
| Sidebar | Only friends appear in the conversation sidebar |

### 3.6 Block & Report

| Feature | Description |
|---|---|
| Block | Hide conversations and prevent message delivery from blocked users |
| Unblock | Restore communication with previously blocked users |
| Report | Submit reports with reason categories: spam, harassment, scam, impersonation, illegal, other |
| Report Description | Optional 500-character description for additional context |

### 3.7 Customization

| Feature | Description |
|---|---|
| Themes | 11 dynamic themes (Dark, Light, Cupcake, Synthwave, Retro, Cyberpunk, Valentine, Halloween, Forest, Aqua, Luxury) via CSS custom properties |
| Wallpapers | 25 built-in wallpapers in 4 categories: solid (6), gradient (7), pattern (7), abstract (5) |
| Custom Wallpapers | Upload up to 5 custom wallpapers (stored in localStorage as data URLs) |
| Per-Conversation Wallpaper | Override the global wallpaper for individual conversations |
| Brightness Control | Adjustable wallpaper overlay opacity |
| Keyboard Sounds | Web Audio API synthesized sounds: mechanical keystroke, send chirp, receive chime |

### 3.8 Privacy & Settings

| Feature | Description |
|---|---|
| Read Receipts | Toggle to control whether others see when you read messages |
| Online Status | Toggle to show or hide your online presence |
| Profile Photo | Toggle to control profile photo visibility |
| Message Sounds | Toggle notification sounds for incoming messages |
| Typing Sounds | Toggle sound effects while typing |
| Mute Conversations | Mute individual conversations with optional duration |
| Pin Conversations | Pin conversations to the top of the sidebar |
| Archive Conversations | Archive conversations to hide from the main list |

### 3.9 Real-Time Features

| Feature | Description |
|---|---|
| Typing Indicators | See when the other user is typing |
| Online Presence | Real-time online user tracking |
| Read Receipts | See when messages have been read |
| Browser Notifications | Push notifications for messages when the tab is in the background |

---

## 4. Message Types

| Type | Fields | Description |
|---|---|---|
| Text | `encryptedText`, `iv`, `text` | Encrypted or plaintext text content |
| Image | `image`, `fileName`, `fileType`, `fileSize` | Photo with ImageKit URL |
| Video | `video`, `fileName`, `fileType`, `fileSize` | Video with ImageKit URL |
| Audio | `audio`, `fileName`, `fileType`, `fileSize` | Voice message or audio file |
| Document | `file`, `fileName`, `fileType`, `fileSize` | Any non-media file type |

---

## 5. Message Lifecycle

```
User types message
  -> Client encrypts (AES-256-GCM) with session key and AAD
  -> Optimistic UI insertion (status: SENDING)
  -> POST /api/messages/send/:id with ciphertext
  -> Server stores ciphertext in MongoDB
  -> Socket.io emits "newMessage" to recipient
  -> Server responds with created message
  -> Client status updates: SENDING -> SENT
  -> Recipient decrypts with session key and AAD
  -> Recipient opens chat -> POST /api/messages/read/:id
  -> Server updates readAt timestamp
  -> Socket.io emits "messagesRead" to sender
  -> Sender status updates: SENT -> DELIVERED -> READ
```

---

## 6. Message Actions

| Action | Method | Description |
|---|---|---|
| Reply | `replyTo` field | Reference another message by ObjectId |
| React | POST `/:id/reaction` | Add or toggle emoji reaction |
| Edit | PATCH `/:id` | Update message text, sets `editedAt` timestamp |
| Delete | DELETE `/:id` | Soft-delete with `deletedAt` and `isDeletedForEveryone` |
| Pin | POST `/:id/pin` | Toggle pin status, sets `pinnedAt` timestamp |
| Forward | Not implemented | Planned for future release |

---

## 7. Privacy Model

### Data Visibility

| Field | Visible to Owner | Visible to Others |
|---|---|---|
| `_id` | Yes | Yes |
| `username` | Yes | Yes |
| `displayName` | Yes | Yes |
| `profilePic` | Yes | Yes (if `showProfilePhoto` enabled) |
| `about` | Yes | Yes |
| `email` | Yes | **Never** |
| `clerkId` | Yes | **Never** |
| `fullName` | Yes | **Never** |
| `identityPublicKey` | Yes | Via `/users/:id/public-key` (friends only) |

### Encryption Model

- All text messages are encrypted client-side before transmission
- The server stores only ciphertext (`encryptedText` + `iv`)
- Media files (images, videos, audio, documents) are **not** end-to-end encrypted (served via ImageKit CDN)
- Session keys are derived per-conversation and stored only in the client's IndexedDB
- AAD binding prevents ciphertext from being decrypted with a different conversation's key

---

## 8. Explicit Scope Exclusions

The following features are **not** in scope for Chatter:

- **Voice/video calling** — No WebRTC or VoIP functionality
- **Group messaging** — 1-on-1 conversations only
- **Message forwarding** — Planned but not implemented
- **End-to-end encrypted media** — Media files are stored on ImageKit without encryption
- **Multi-device sync** — Each browser has its own key pair and session keys
- **Disappearing messages** — No auto-delete or timer functionality

---

## 9. Non-Functional Requirements

### Performance
- WebSocket message latency < 100ms under normal conditions
- MongoDB compound indexes on `{ senderId, receiverId, createdAt }` and reverse
- Media served via ImageKit global CDN with caching headers
- Optimistic UI updates for instant perceived responsiveness

### Security
- Clerk session verification on every protected route
- Svix cryptographic webhook signature verification
- In-memory Multer processing (zero disk writes)
- CORS restricts to `FRONTEND_URL` in production
- Socket.io validates userId against MongoDB on connection
- Non-root Docker execution

### Mobile
- `viewport-fit=cover` for notch devices
- `safe-area-inset-*` CSS variables
- `overscroll-behavior: none`
- Minimum 36px touch targets
- Responsive 3-column layout

---

## 10. Success Metrics

| Metric | Target |
|---|---|
| Message delivery latency | < 100ms (p95) |
| Delivery success rate | 99.9% |
| Identity sync rate | 100% (Clerk to MongoDB) |
| E2EE encryption success | 99.9% |
| Crypto self-test pass rate | 100% on supported browsers |
| Mobile usability | All touch targets >= 36px |
| Mobile layout | Functional at 320px viewport width |
