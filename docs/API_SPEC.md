# API Specification & Integration Contracts — Chatter

> **API Version:** 2.0.0  
> **Product:** Chatter Full-Stack Real-Time Application  
> **Base URL (Development):** `http://localhost:3001`  
> **Base URL (Production):** Current Origin  
> **Protocols:** REST (HTTP/1.1) & WebSocket (Socket.io)

---

## 1. Global Conventions & Authentication

All protected REST routes require a valid Clerk session token passed in the `Authorization` header (`Bearer <token>`) or Clerk session cookies.

### Standard Response Headers
```http
Content-Type: application/json; charset=utf-8
```

### Standard Error JSON Format
```json
{
  "message": "Human readable error description"
}
```

---

## 2. REST API Endpoints

### 2.1 Health & Server Uptime

#### `GET /health`
- **Description:** Verifies server responsiveness (used by internal keep-alive cron and cloud health probes).
- **Auth Required:** No
- **Response `200 OK`:**
```json
{
  "ok": true
}
```

---

### 2.2 Authentication & User Profile (`/api/auth`)

#### `GET /api/auth/check`
- **Description:** Returns the authenticated user's MongoDB record matching the Clerk user identity.
- **Auth Required:** Yes (`protectRoute`)
- **Response `200 OK`:**
```json
{
  "_id": "664b8a1c9e8b1234567890ab",
  "clerkId": "user_2Ne7zY8F9x...",
  "email": "ayush@example.com",
  "fullName": "Ayush Nandi",
  "profilePic": "https://img.clerk.com/...",
  "createdAt": "2026-08-17T04:00:00.000Z",
  "updatedAt": "2026-08-17T04:00:00.000Z"
}
```
- **Response `401 Unauthorized`:** `{ "message": "Unauthorized" }`
- **Response `404 Not Found`:** `{ "message": "User profile is not synced yet!" }`

---

### 2.3 Webhook Synchronization (`/api/webhooks`)

#### `POST /api/webhooks/clerk`
- **Description:** Receives Clerk user lifecycle events and synchronizes them to MongoDB.
- **Auth Required:** Svix Signature Verification (`svix-id`, `svix-timestamp`, `svix-signature`).
- **Supported Events:**
  - `user.created`: Creates/upserts user record.
  - `user.updated`: Synchronizes name, email, or avatar changes.
  - `user.deleted`: Removes user record from database.
- **Response `200 OK`:** `{ "received": true }`
- **Response `400 Bad Request`:** `{ "message": "Webhook verification failed" }`

---

### 2.4 Messaging & Directory (`/api/messages`)

#### `GET /api/messages/users`
- **Description:** Fetches all registered users excluding the currently authenticated user (for contact directory).
- **Auth Required:** Yes (`protectRoute`)
- **Response `200 OK`:**
```json
[
  {
    "_id": "664b8a1c9e8b1234567890ac",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "profilePic": "https://img.clerk.com/jane.jpg",
    "createdAt": "2026-08-17T04:10:00.000Z",
    "updatedAt": "2026-08-17T04:10:00.000Z"
  }
]
```

---

#### `GET /api/messages/conversations`
- **Description:** Fetches all conversation partners aggregated with their latest message snippet and timestamp for the conversation sidebar.
- **Auth Required:** Yes (`protectRoute`)
- **Response `200 OK`:**
```json
[
  {
    "_id": "664b8a1c9e8b1234567890ac",
    "lastMessage": {
      "_id": "664b901a1c9e8b1234567899",
      "senderId": "664b8a1c9e8b1234567890ac",
      "receiverId": "664b8a1c9e8b1234567890ab",
      "text": "Sounds good! See you then.",
      "image": null,
      "video": null,
      "createdAt": "2026-08-17T04:25:00.000Z"
    },
    "partner": {
      "_id": "664b8a1c9e8b1234567890ac",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "profilePic": "https://img.clerk.com/jane.jpg"
    }
  }
]
```

---

#### `GET /api/messages/:id`
- **Description:** Retrieves chronological message history between the authenticated user and user `:id`.
- **Auth Required:** Yes (`protectRoute`)
- **Route Parameters:**
  - `id` (string, required): Partner's MongoDB `_id`.
- **Response `200 OK`:**
```json
[
  {
    "_id": "664b901a1c9e8b1234567890",
    "senderId": "664b8a1c9e8b1234567890ab",
    "receiverId": "664b8a1c9e8b1234567890ac",
    "text": "Check out this screenshot!",
    "image": "https://ik.imagekit.io/chatter/chat/chat-1723867800000-screen.png",
    "video": null,
    "createdAt": "2026-08-17T04:15:30.000Z",
    "updatedAt": "2026-08-17T04:15:30.000Z"
  }
]
```

---

#### `POST /api/messages/send/:id`
- **Description:** Sends a message (text, image, or video) to user `:id` and immediately broadcasts via Socket.io.
- **Auth Required:** Yes (`protectRoute`)
- **Route Parameters:**
  - `id` (string, required): Recipient's MongoDB `_id`.
- **Content-Type:** `multipart/form-data` (if file attached) or `application/json`
- **Form Fields:**
  - `text` (string, optional if file is attached)
  - `file` (binary file, image or video up to 25MB)
- **Response `201 Created`:**
```json
{
  "_id": "664b901a1c9e8b1234567899",
  "senderId": "664b8a1c9e8b1234567890ab",
  "receiverId": "664b8a1c9e8b1234567890ac",
  "text": "Check out this screenshot!",
  "image": "https://ik.imagekit.io/chatter/chat/chat-1723867800000-screen.png",
  "video": null,
  "createdAt": "2026-08-17T04:20:00.000Z",
  "updatedAt": "2026-08-17T04:20:00.000Z"
}
```
- **Error Responses:**
  - `400 Bad Request`: `{ "message": "Text or media file is required" }`
  - `500 Server Error`: `{ "message": "Internal server error" }`

---

## 3. WebSocket Event Catalog (Socket.io)

### 3.1 Handshake & Connection
- **Endpoint:** `ws://localhost:3001` or `wss://<host>`
- **Query Parameter:** `?userId=<mongo_user_id>`

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
    query: { userId: authUser._id },
});
```

---

### 3.2 Server-to-Client Events

| Event Name | Payload Shape | Description |
|---|---|---|
| `getOnlineUsers` | `string[]` (e.g. `["664b8a1c...", "664b8a1d..."]`) | Emitted whenever any user connects or disconnects. Contains all online MongoDB user IDs. |
| `newMessage` | `MessageObject` | Emitted to the receiver's socket when a new message is sent to them. |

---

### 3.3 Message Object Schema (Client & Socket)

```typescript
interface MessageObject {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string | null;
  video?: string | null;
  createdAt: string;
  updatedAt: string;
}
```
