# API Specification & Integration Contracts — Chatter

> **Version:** 3.0.0
> **Base URL (Dev):** `http://localhost:3001`
> **Base URL (Prod):** `https://chatter-lrig.onrender.com`
> **Protocols:** REST + WebSocket (Socket.io)

---

## 1. Global Conventions

**Authentication:** All protected routes require a valid Clerk session token in the `Authorization: Bearer <token>` header or Clerk session cookies.

**Privacy:** All user responses use `toPublicUser()` — only `_id`, `username`, `displayName`, `profilePic`, `about` are exposed. Fields `email`, `clerkId`, `fullName` are never sent to other users.

### Error Format
```json
{ "message": "Human readable error" }
```

---

## 2. REST API Endpoints

### 2.1 Health

#### `GET /health`
- **Auth:** No
- **Response:** `{ "ok": true }`

---

### 2.2 Authentication (`/api/auth`)

#### `GET /api/auth/check`
- **Auth:** Yes
- **Description:** Returns current user's full profile (including `username`, `displayName`).
- **Response 200:**
```json
{
  "_id": "...",
  "clerkId": "user_...",
  "email": "...",
  "fullName": "...",
  "username": "ayush_nandi",
  "displayName": "Ayush N",
  "profilePic": "https://...",
  "about": "Hey there!",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### `POST /api/auth/complete-profile`
- **Auth:** Yes
- **Body:** `{ "username": "ayush_nandi", "displayName": "Ayush N" }`
- **Response 200:** Updated user object.
- **Error 409:** `{ "message": "Username already taken" }`

#### `DELETE /api/auth/delete-account`
- **Auth:** Yes
- **Description:** Deletes user and all associated data (messages, friendships, blocks, reports).

---

### 2.3 User Search (`/api/users`)

#### `GET /api/users/search?username=...`
- **Auth:** Yes
- **Description:** Search users by username (partial match, ReDoS-safe regex).
- **Response 200:**
```json
[
  {
    "_id": "...",
    "username": "ayush_nandi",
    "displayName": "Ayush N",
    "profilePic": "https://...",
    "about": "Hey there!"
  }
]
```

---

### 2.4 Friend System (`/api/friends`)

#### `GET /api/friends`
- **Auth:** Yes
- **Description:** List all accepted friends.
- **Response 200:** Array of public user objects.

#### `POST /api/friends/request/:userId`
- **Auth:** Yes
- **Description:** Send friend request.
- **Response 201:** Friendship object.
- **Error 400:** Already friends or request pending.
- **Error 404:** User not found.

#### `GET /api/friends/requests`
- **Auth:** Yes
- **Description:** List pending incoming friend requests.

#### `PUT /api/friends/accept/:requestId`
- **Auth:** Yes
- **Description:** Accept a pending friend request.

#### `PUT /api/friends/reject/:requestId`
- **Auth:** Yes
- **Description:** Reject a pending friend request.

#### `DELETE /api/friends/:friendId`
- **Auth:** Yes
- **Description:** Remove an existing friend.

---

### 2.5 Block System (`/api/blocks`)

#### `GET /api/blocks`
- **Auth:** Yes
- **Description:** List all blocked user IDs.
- **Response 200:** `{ "blockedUserIds": ["...", "..."] }`

#### `POST /api/blocks/:userId`
- **Auth:** Yes
- **Description:** Block a user. Hides conversations and prevents message delivery.
- **Response 201:** `{ "message": "User blocked" }`

#### `DELETE /api/blocks/:userId`
- **Auth:** Yes
- **Description:** Unblock a user.
- **Response 200:** `{ "message": "User unblocked" }`

---

### 2.6 Reports (`/api/blocks/report`)

#### `POST /api/blocks/report/:userId`
- **Auth:** Yes
- **Body:**
```json
{
  "reason": "spam | harassment | inappropriate | other",
  "description": "Optional details",
  "messageId": "optional message ID"
}
```
- **Response 201:** `{ "message": "Report submitted" }`

---

### 2.7 Messaging (`/api/messages`)

#### `GET /api/messages/users`
- **Auth:** Yes
- **Description:** All users except current (for directory). Only public fields returned.

#### `GET /api/messages/conversations`
- **Auth:** Yes
- **Description:** Aggregated conversation list with last message and partner profile. Only includes users who are mutual friends.
- **Response 200:**
```json
[
  {
    "_id": "partner_user_id",
    "lastMessage": {
      "_id": "...",
      "senderId": "...",
      "receiverId": "...",
      "text": "Hello!",
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

#### `GET /api/messages/:id`
- **Auth:** Yes
- **Description:** Chronological message history with user `:id`.
- **Response 200:** Array of message objects (includes E2EE fields + media fields).

#### `POST /api/messages/send/:id`
- **Auth:** Yes
- **Content-Type:** `multipart/form-data` (with file) or `application/json`
- **Form Fields:**
  - `text` (string, optional)
  - `file` (binary, optional — any type up to 25MB)
  - `encryptedText` (string, optional — E2EE ciphertext)
  - `iv` (string, optional — AES-GCM IV)
  - `clientMessageId` (string, optional — client-generated ID)
  - `sequenceNumber` (number, optional)
  - `protocolVersion` (number, optional)
- **File Handling:** Images go to `image` field, video to `video`, audio to `audio`, everything else to `file`. `fileName`, `fileType`, `fileSize` are stored.
- **Response 201:** Created message object.
- **Socket.io:** Emits `newMessage` to receiver if online.

---

## 3. WebSocket Events (Socket.io)

### Connection
```javascript
const socket = io(SERVER_URL, { query: { userId: authUser._id } });
```

### Events

| Direction | Event | Payload | Description |
|---|---|---|---|
| S→C | `getOnlineUsers` | `string[]` | All online user IDs |
| C→S | `typing` | `{ receiverId }` | User started typing |
| C→S | `stopTyping` | `{ receiverId }` | User stopped typing |
| S→C | `typing` | `{ senderId }` | Partner is typing |
| S→C | `stopTyping` | `{ senderId }` | Partner stopped typing |
| S→C | `newMessage` | `MessageObject` | New incoming message |

### Message Object Schema
```typescript
interface MessageObject {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  encryptedText?: string;
  iv?: string;
  clientMessageId?: string;
  sequenceNumber?: number;
  protocolVersion?: number;
  image?: string | null;
  video?: string | null;
  audio?: string | null;
  file?: string | null;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  readAt?: string | null;
  createdAt: string;
}
```

---

## 4. Clerk Webhook (`POST /api/webhooks/clerk`)

- **Auth:** Svix signature verification
- **Events:** `user.created`, `user.updated`, `user.deleted`
- **Response:** `{ "received": true }`
