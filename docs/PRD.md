# Product Requirements Document (PRD) — Chatter

> **Version:** 3.0.0
> **Product:** Chatter — Private Real-Time Messaging Platform
> **Owner:** Ayush Nandi

---

## 1. Vision

**Chatter** is a full-stack real-time messaging platform with end-to-end encryption, anonymous identity, rich media sharing, and a premium UI. It delivers private 1-on-1 messaging with Discord-style usernames, friend management, block/report controls, and mobile-first responsive design.

---

## 2. Core Value Propositions

1. **End-to-End Encrypted Messaging** — ECDH P-256 + AES-256-GCM. Server never sees plaintext.
2. **Anonymous Identity** — Discord-style usernames. Email, Clerk ID, and full name are never exposed to other users.
3. **Rich Media Sharing** — Photos, videos, voice messages, documents (PDF/DOCX/XLSX/TXT), and any file up to 25MB.
4. **Friend System** — Search by username, send/accept/reject requests, friends-only conversation list.
5. **Block & Report** — Block users to hide conversations and prevent messages. Report with reason categories.
6. **Premium UI** — 11 themes, 13 wallpapers, CSS variable design system, keyboard sound effects.
7. **Mobile First** — Safe-area insets, touch targets, responsive 3-column layout.
8. **Turnkey Deployment** — Docker multi-stage monolith on Render.

---

## 3. Target Personas

| Persona | Goals | Features Used |
|---|---|---|
| **Casual User** | Intuitive chat with friends, share media | 1-on-1 chat, file/photo/video/voice sharing, themes, wallpapers |
| **Privacy-Conscious User** | Secure messaging, anonymous identity | E2EE encryption, username-only identity, block/report |
| **Power User** | Personalization, fast experience | 11 themes, keyboard sounds, responsive design |
| **Developer/DevOps** | Easy deployment, clear contracts | Docker monolith, REST + WebSocket specs, Clerk webhooks |

---

## 4. User Stories & Acceptance Criteria

### 4.1 Authentication & Identity
- **US-1.1:** Sign in via Google, GitHub, or Email/Password through Clerk.
  - Backend webhook syncs user to MongoDB automatically.
  - Profile completion modal for setting username and display name.
- **US-1.2:** Set a unique Discord-style username and display name.
  - Username is unique, lowercase, alphanumeric + underscores.
  - Display name is what other users see in chat.

### 4.2 Privacy Model
- **US-2.1:** My email, Clerk ID, and full name are never visible to other users.
  - API responses use `toPublicUser()` — only `_id`, `username`, `displayName`, `profilePic`, `about` are exposed.
  - Socket.io userId validated against MongoDB on connection.

### 4.3 End-to-End Encryption
- **US-3.1:** My text messages are encrypted so the server cannot read them.
  - ECDH P-256 key exchange generates per-conversation AES-256-GCM session keys.
  - Encrypted payload includes `encryptedText`, `iv`, `clientMessageId`, `sequenceNumber`, `protocolVersion`.
  - Decrypt failure shows "[Encrypted]" fallback, never crashes the UI.

### 4.4 Messaging
- **US-4.1:** Send text messages in real-time via Socket.io.
  - Messages appear instantly for sender and receiver.
  - Auto-scroll to bottom on new messages.
- **US-4.2:** Send photos and videos up to 25MB.
  - Inline preview before sending.
  - Image lightbox viewer on click.
  - Video with HTML5 controls.
- **US-4.3:** Send voice messages.
  - Record via MediaRecorder API with duration indicator.
  - Playback inline with audio controls.
- **US-4.4:** Send documents and files (PDF, DOCX, XLSX, TXT, ZIP, CSV).
  - File icon, name, and size displayed.
  - Download link on click.
  - Auto-detected by MIME type (image, video, audio, or generic file).

### 4.5 Friend System
- **US-5.1:** Search for users by username.
- **US-5.2:** Send friend requests.
- **US-5.3:** Accept or reject incoming requests.
- **US-5.4:** Only friends appear in the conversation sidebar.

### 4.6 Block & Report
- **US-6.1:** Block a user from the chat header menu.
  - Blocked user is hidden from sidebar.
  - Messages from blocked user are not delivered.
- **US-6.2:** Unblock a user.
- **US-6.3:** Report a user with reason (spam, harassment, inappropriate content, other).

### 4.7 Personalization
- **US-7.1:** Switch between 11 themes (Dark, Light, Cupcake, Synthwave, Retro, Cyberpunk, Valentine, Halloween, Forest, Aqua, Luxury).
- **US-7.2:** Choose from 13 custom chat wallpapers.
- **US-7.3:** Toggle mechanical keyboard sound effects.

### 4.8 Mobile Experience
- **US-8.1:** Responsive 3-column layout (sidebar | chat | details).
- **US-8.2:** Safe-area insets for notch/toolbar devices.
- **US-8.3:** 36px minimum touch targets.
- **US-8.4:** Overscroll prevention and tap-highlight removal.

---

## 5. Functional Requirements Matrix

| Module | ID | Feature | Priority | Status |
|---|---|---|---|---|
| Auth | AUTH-01 | Clerk authentication (social + email) | P0 | Done |
| Auth | AUTH-02 | Webhook auto-sync to MongoDB | P0 | Done |
| Auth | AUTH-03 | Username/display name setup modal | P0 | Done |
| Privacy | PRV-01 | `toPublicUser()` field stripping | P0 | Done |
| Privacy | PRV-02 | Socket.io userId validation | P0 | Done |
| Privacy | PRV-03 | ReDoS-safe search regex | P1 | Done |
| E2EE | E2E-01 | ECDH P-256 key pair generation | P0 | Done |
| E2EE | E2E-02 | Per-conversation session key exchange | P0 | Done |
| E2EE | E2E-03 | AES-256-GCM encrypt/decrypt | P0 | Done |
| E2EE | E2E-04 | AAD binding (senderId + receiverId) | P0 | Done |
| E2EE | E2E-05 | Key fingerprint verification | P1 | Done |
| E2EE | E2E-06 | clientMessageId for AAD consistency | P0 | Done |
| Chat | MSG-01 | Real-time text messaging (Socket.io) | P0 | Done |
| Chat | MSG-02 | Conversation sidebar (aggregated) | P0 | Done |
| Chat | MSG-03 | Typing indicators | P1 | Done |
| Media | MED-01 | Photo upload (Multer + ImageKit) | P0 | Done |
| Media | MED-02 | Video upload | P0 | Done |
| Media | MED-03 | Voice message recording + upload | P1 | Done |
| Media | MED-04 | Document/file upload (PDF, DOCX, etc.) | P1 | Done |
| Media | MED-05 | Image lightbox viewer | P1 | Done |
| Friends | FRD-01 | Search users by username | P0 | Done |
| Friends | FRD-02 | Send/accept/reject friend requests | P0 | Done |
| Friends | FRD-03 | Friends-only conversation sidebar | P0 | Done |
| Safety | BLK-01 | Block user | P1 | Backend done |
| Safety | BLK-02 | Unblock user | P1 | Backend done |
| Safety | BLK-03 | Report user with reason | P1 | Backend done |
| Safety | BLK-04 | Block/unblock UI in chat header | P1 | Pending |
| UI | THM-01 | 11 dynamic themes (CSS variables) | P1 | Done |
| UI | THM-02 | 13 chat wallpapers | P1 | Done |
| UI | THM-03 | Keyboard sound effects | P2 | Done |
| Mobile | MOB-01 | Responsive 3-column layout | P0 | Done |
| Mobile | MOB-02 | Safe-area insets | P1 | Done |
| Mobile | MOB-03 | Touch targets (36px) | P1 | Done |
| Infra | INF-01 | Docker multi-stage monolith | P0 | Done |
| Infra | INF-02 | Keep-alive cron (14min) | P1 | Done |
| Infra | INF-03 | Render deployment | P0 | Done |

---

## 6. Non-Functional Requirements

### 6.1 Performance
- WebSocket message latency < 100ms.
- MongoDB compound indexes on `{ senderId, receiverId, createdAt }`.
- Media served via ImageKit global CDN with caching headers.

### 6.2 Security
- Clerk session verification on every protected route.
- Svix cryptographic webhook verification.
- In-memory Multer processing (zero disk writes).
- `toPublicUser()` strips sensitive fields at API layer.
- Socket.io userId validated against MongoDB.
- CORS localhost excluded in production.
- Non-root Docker execution.

### 6.3 Encryption
- ECDH P-256 for key agreement (no RSA).
- HKDF-SHA256 for key derivation.
- AES-256-GCM for authenticated encryption.
- Per-conversation session keys.
- AAD binding prevents cross-conversation decryption.
- Key fingerprints for verification.

### 6.4 Mobile
- `viewport-fit=cover` for notch devices.
- `safe-area-inset-*` CSS variables.
- `overscroll-behavior: none`.
- Minimum 36px touch targets.

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Message delivery latency | < 100ms |
| Delivery success rate | 99.9% |
| Identity sync rate | 100% (Clerk <-> MongoDB) |
| E2EE encryption success | 99.9% |
| Mobile usability | All touch targets >= 36px |
