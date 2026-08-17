# API Specification & Integration Contracts — Chatter

> **Version:** 4.0.0
> **Base URL (Dev):** `http://localhost:3001`
> **Base URL (Prod):** `https://chatter-lrig.onrender.com`
> **Protocols:** REST + WebSocket (Socket.io)

---

## 1. Global Conventions

**Authentication:** All protected routes require a valid Clerk session token in the `Authorization: Bearer <token>` header or Clerk session cookies.

**Privacy:** All user responses use `toPublicUser()` — only `_id`, `username`, `displayName`, `profilePic`, `about` are exposed. Fields `email`, `clerkId`, `fullName` are never sent to other users.

**Content Types:**
- JSON routes: `Content-Type: application/json`
- File upload routes: `Content-Type: multipart/form-data`

### Error Format
```json
{ "message": "Human readable error description" }
```

---

## 2. REST API Endpoints

### 2.1 Health

#### `GET /health`
- **Auth:** No
- **Response 200:** `{ "ok": true }`

---

### 2.2 Authentication (`/api/auth`)

#### `GET /api/auth/check`
- **Auth:** Yes
- **Description:** Returns the current authenticated user's full profile including identity key fields.
- **Response 200:**
```json
{
  "_id": "...",
  "clerkId": "user_...",
  "email": "user@example.com",
  "fullName": "Jane Doe",
  "username": "jane_doe",
  "displayName": "Jane D",
  "profilePic": "https://...",
  "about": "Hey there!",
  "identityPublicKey": "...",
  "identityKeyFingerprint": "...",
  "identityKeyVersion": 1,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### 2.3 Users (`/api/users`)

#### `GET /api/users/search?q=...`
- **Auth:** Yes
- **Description:** Search users by username or display name (full-text search with ReDoS-safe regex).
- **Response 200:**
```json
[
  {
    "_id": "...",
    "username": "jane_doe",
    "displayName": "Jane D",
    "profilePic": "https://...",
    "about": "Hey there!"
  }
]
```

#### `GET /api/users/username/:username`
- **Auth:** Yes
- **Description:** Check if a username is available.
- **Response 200:** `{ "available": true }` or `{ "available": false }`

#### `GET /api/users/profile/:userId`
- **Auth:** Yes
- **Description:** Get a user's public profile.
- **Response 200:** Public user object.

#### `GET /api/users/:userId/public-key`
- **Auth:** Yes
- **Description:** Get a user's E2EE public key for session key derivation.
- **Response 200:**
```json
{
  "publicKey": "{ \"kty\": \"EC\", \"crv\": \"P-256\", ... }",
  "fingerprint": "A1B2 C3D4 E5F6 ..."
}
```
- **Error 404:** `{ "message": "Public key not found" }`

#### `PUT /api/users/username`
- **Auth:** Yes
- **Body:** `{ "username": "new_username" }`
- **Response 200:** Updated user object.
- **Error 409:** `{ "message": "Username already taken" }`
- **Error 400:** `{ "message": "Invalid username format" }`

#### `PUT /api/users/display-name`
- **Auth:** Yes
- **Body:** `{ "displayName": "New Name" }`
- **Response 200:** Updated user object.

#### `PUT /api/users/about`
- **Auth:** Yes
- **Body:** `{ "about": "New bio" }`
- **Response 200:** Updated user object.

#### `POST /api/users/upload-public-key`
- **Auth:** Yes
- **Body:**
```json
{
  "publicKey": "{ \"kty\": \"EC\", \"crv\": \"P-256\", ... }",
  "fingerprint": "A1B2 C3D4 E5F6 ..."
}
```
- **Response 200:** `{ "message": "Public key uploaded" }`
- **Description:** Stores the user's ECDH P-256 public key JWK and fingerprint. Called on login when identity key is generated or loaded from IndexedDB.

---

### 2.4 Friends (`/api/friends`)

#### `GET /api/friends`
- **Auth:** Yes
- **Description:** List all accepted friends.
- **Response 200:** Array of public user objects.

#### `GET /api/friends/requests`
- **Auth:** Yes
- **Description:** List pending incoming and outgoing friend requests.
- **Response 200:**
```json
{
  "incoming": [
    { "_id": "...", "user": { /* public user */ }, "createdAt": "..." }
  ],
  "outgoing": [
    { "_id": "...", "user": { /* public user */ }, "createdAt": "..." }
  ]
}
```

#### `POST /api/friends/request/:userId`
- **Auth:** Yes
- **Description:** Send a friend request to the specified user.
- **Response 201:** Friendship object.
- **Error 400:** Already friends or request pending.
- **Error 404:** User not found.

#### `POST /api/friends/accept/:requestId`
- **Auth:** Yes
- **Description:** Accept a pending incoming friend request.
- **Response 200:** `{ "message": "Friend request accepted" }`

#### `POST /api/friends/reject/:requestId`
- **Auth:** Yes
- **Description:** Reject a pending incoming friend request.
- **Response 200:** `{ "message": "Friend request rejected" }`

#### `POST /api/friends/cancel/:requestId`
- **Auth:** Yes
- **Description:** Cancel an outgoing pending friend request.
- **Response 200:** `{ "message": "Request cancelled" }`

#### `DELETE /api/friends/:friendId`
- **Auth:** Yes
- **Description:** Remove an existing friend.
- **Response 200:** `{ "message": "Friend removed" }`

---

### 2.5 Blocks (`/api/blocks`)

#### `GET /api/blocks`
- **Auth:** Yes
- **Description:** List all blocked user IDs.
- **Response 200:**
```json
{ "blockedUserIds": ["userId1", "userId2"] }
```

#### `POST /api/blocks/:userId`
- **Auth:** Yes
- **Description:** Block a user. Hides conversations and prevents message delivery.
- **Response 201:** `{ "message": "User blocked" }`

#### `DELETE /api/blocks/:userId`
- **Auth:** Yes
- **Description:** Unblock a user.
- **Response 200:** `{ "message": "User unblocked" }`

#### `POST /api/blocks/report/:userId`
- **Auth:** Yes
- **Description:** Submit a report against a user.
- **Body:**
```json
{
  "reason": "spam | harassment | scam | impersonation | illegal | other",
  "description": "Optional details about the issue (max 500 chars)"
}
```
- **Response 201:** `{ "message": "Report submitted" }`

---

### 2.6 Messages (`/api/messages`)

#### `GET /api/messages/conversations`
- **Auth:** Yes
- **Description:** Aggregated conversation list for the sidebar. Only includes mutual friends. Sorted by most recent message.
- **Response 200:**
```json
[
  {
    "_id": "partner_user_id",
    "lastMessage": {
      "_id": "...",
      "senderId": "...",
      "receiverId": "...",
      "text": "",
      "encryptedText": "...",
      "iv": "...",
      "clientMessageId": "...",
      "sequenceNumber": 1,
      "protocolVersion": 1,
      "image": null,
      "video": null,
      "audio": null,
      "file": null,
      "fileName": "",
      "fileType": "",
      "fileSize": 0,
      "readAt": null,
      "createdAt": "2026-08-17T..."
    },
    "partner": {
      "_id": "...",
      "username": "jane_doe",
      "displayName": "Jane D",
      "profilePic": "https://..."
    }
  }
]
```

#### `GET /api/messages/unread-count`
- **Auth:** Yes
- **Description:** Total count of unread messages for the current user.
- **Response 200:** `{ "count": 5 }`

#### `GET /api/messages/pinned/:userId`
- **Auth:** Yes
- **Description:** Get all pinned messages for a specific conversation.
- **Response 200:** Array of pinned message objects.

#### `GET /api/messages/:id`
- **Auth:** Yes
- **Description:** Chronological message history with user `:id`.
- **Response 200:** Array of message objects (includes E2EE fields, media fields, reactions, replyTo, editedAt, deletedAt, isDeletedForEveryone, isPinned, pinnedAt).

#### `POST /api/messages/send/:id`
- **Auth:** Yes
- **Content-Type:** `multipart/form-data` (with file) or `application/json`
- **Form/JSON Fields:**
  - `text` (string, optional — plaintext for unencrypted or legacy messages)
  - `file` (binary, optional — any file type up to 25MB)
  - `encryptedText` (string, optional — E2EE ciphertext, base64)
  - `iv` (string, optional — AES-GCM initialization vector, base64)
  - `clientMessageId` (string, optional — client-generated hex ID for dedup and AAD)
  - `sequenceNumber` (number, optional — message ordering within conversation)
  - `protocolVersion` (number, optional — E2EE protocol version)
  - `replyTo` (string, optional — ObjectId of message being replied to)
- **File Handling:** Images go to `image` field, video to `video`, audio to `audio`, everything else to `file`. `fileName`, `fileType`, `fileSize` are stored automatically.
- **Response 201:** Created message object.
- **Socket.io:** Emits `newMessage` to receiver if online.

#### `POST /api/messages/read/:id`
- **Auth:** Yes
- **Description:** Mark all messages from user `:id` to the current user as read (sets `readAt` timestamp).
- **Response 200:** `{ "message": "Messages marked as read" }`
- **Socket.io:** Emits `messagesRead` to the other user.

#### `POST /api/messages/:id/reaction`
- **Auth:** Yes
- **Body:** `{ "emoji": "thumbsup" }`
- **Description:** Add or toggle an emoji reaction on a message. If the user already reacted with the same emoji, it is removed. Otherwise, the reaction is added or replaced.
- **Response 200:** Updated reactions array.
- **Socket.io:** Emits `messageReaction` to the other user.

#### `POST /api/messages/:id/pin`
- **Auth:** Yes
- **Description:** Toggle pin status on a message.
- **Response 200:** `{ "isPinned": true }` or `{ "isPinned": false }`

#### `PATCH /api/messages/:id`
- **Auth:** Yes (sender only)
- **Body:** `{ "text": "Updated message text" }`
- **Description:** Edit a previously sent message. Sets `editedAt` timestamp.
- **Response 200:** Updated message object.
- **Socket.io:** Emits `messageEdited` to the other user.

#### `DELETE /api/messages/:id`
- **Auth:** Yes
- **Body:** `{ "deleteForEveryone": true }` (optional, default false)
- **Description:** Soft-delete a message. If `deleteForEveryone` is true, sets `isDeletedForEveryone` and `deletedAt` for all parties. Otherwise, only marks for the requesting user.
- **Response 200:** `{ "message": "Message deleted" }`
- **Socket.io:** Emits `messageDeleted` to the other user (if delete for everyone).

---

### 2.7 Preferences (`/api/preferences`)

#### `GET /api/preferences/user`
- **Auth:** Yes
- **Description:** Get current user's preference settings.
- **Response 200:**
```json
{
  "readReceipts": true,
  "showOnlineStatus": true,
  "showProfilePhoto": true,
  "messageSounds": true,
  "typingSounds": true
}
```

#### `PUT /api/preferences/user`
- **Auth:** Yes
- **Body:** Partial or full preferences object.
```json
{
  "readReceipts": false,
  "showOnlineStatus": true
}
```
- **Response 200:** Updated preferences object.

#### `GET /api/preferences`
- **Auth:** Yes
- **Description:** Get all conversation preferences for the current user.
- **Response 200:**
```json
{
  "partnerUserId1": { "muted": false, "mutedUntil": null, "pinned": true, "archived": false },
  "partnerUserId2": { "muted": true, "mutedUntil": "2026-08-20T...", "pinned": false, "archived": false }
}
```

#### `PUT /api/preferences/:partnerId`
- **Auth:** Yes
- **Body:** Partial or full conversation preference updates.
```json
{
  "muted": true,
  "mutedUntil": "2026-08-20T12:00:00Z",
  "pinned": false,
  "archived": true
}
```
- **Response 200:** Updated conversation preference object.

---

### 2.8 Clerk Webhook

#### `POST /api/webhooks/clerk`
- **Auth:** Svix cryptographic signature verification (raw body)
- **Content-Type:** `application/json`
- **Events handled:** `user.created`, `user.updated`, `user.deleted`
- **Response:** `{ "received": true }`
- **Description:** Syncs Clerk user events to MongoDB. Creates/updates/deletes User documents and associated UserPreferences.

---

## 3. WebSocket Events (Socket.io)

### Connection

```javascript
const socket = io(SERVER_URL, {
    query: { userId: authUser._id },
    withCredentials: true,
});
```

The server validates `userId` against MongoDB on connection and registers the socket in `userSocketMap`.

### Events Catalog

| Direction | Event | Payload | Description |
|---|---|---|---|
| S->C | `getOnlineUsers` | `string[]` | All currently online user IDs |
| C->S | `typing` | `{ to }` | User started typing in a conversation |
| C->S | `stopTyping` | `{ to }` | User stopped typing |
| S->C | `typing` | `{ from }` | Partner started typing |
| S->C | `stopTyping` | `{ from }` | Partner stopped typing |
| S->C | `newMessage` | `Message` | New incoming message (full object with E2EE fields) |
| S->C | `messagesRead` | `{ by }` | Partner marked messages as read |
| S->C | `messageDeleted` | `{ messageId, deletedBy }` | Message deleted by the other party |
| S->C | `messageEdited` | `{ messageId, text, editedAt }` | Message text was edited |
| S->C | `messageReaction` | `{ messageId, reactions }` | Reactions updated on a message |
| S->C | `friendRequest` | `{ requestId, from }` | New incoming friend request |
| S->C | `friendAccepted` | `{ by }` | Your friend request was accepted |
| S->C | `friendRemoved` | `{}` | A friend removed you from their list |

### Message Object Schema

```typescript
interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  encryptedText: string;
  iv: string;
  sequenceNumber: number;
  protocolVersion: number;
  clientMessageId: string;
  image: string | null;
  video: string | null;
  audio: string | null;
  file: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  replyTo: string | null;
  reactions: Reaction[];
  editedAt: string | null;
  deletedAt: string | null;
  isDeletedForEveryone: boolean;
  readAt: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Reaction {
  userId: string;
  emoji: string;
}
```

### Delivery State Machine (Client-Side)

```
SENDING -> SENT -> DELIVERED -> READ
    |                          |
    v                          v
  FAILED                  (terminal)
```

- **SENDING:** Optimistic UI insertion, request in flight
- **SENT:** Server acknowledged, message stored in MongoDB
- **DELIVERED:** Socket.io `newMessage` received by recipient
- **READ:** Socket.io `messagesRead` received, `readAt` timestamp set
- **FAILED:** Request failed, retry available
