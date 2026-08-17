# System Architecture & Technical Design — Chatter

> **Document Version:** 2.0.0  
> **Product:** Chatter Full-Stack Real-Time Application  
> **Target Audience:** Full-Stack Engineers, DevOps, System Architects

---

## 1. System Topology & High-Level Architecture

**Chatter** couples a React 19 single-page application with a Node.js/Express and Socket.io server, backed by MongoDB Atlas, Clerk Authentication, and ImageKit CDN.

```mermaid
graph TD
    subgraph Client ["Frontend (React 19 + Tailwind CSS + Hero UI)"]
        UI["Chatter UI (Modern Responsive Layout)"]
        ZAuth["useAuthStore (User Profile & State)"]
        ZChat["useChatStore (Messages & Active Chat)"]
        ZSound["useSoundStore (Keyboard Sounds)"]
        CtxTheme["ThemeContext (11 Presets)"]
        CtxWall["WallpaperContext (13 Wallpapers)"]
        SockClient["Socket.io Client"]
    end

    subgraph Managed ["Managed Cloud Services"]
        ClerkAuth["Clerk Identity & Session Service"]
        ImageKitCDN["ImageKit.io Media Engine & CDN"]
        MongoAtlas[("MongoDB Atlas Database")]
    end

    subgraph Backend ["Backend Monolith (Express 5 + Socket.io Server)"]
        HttpServer["Node HTTP Server + Socket.io Engine"]
        ExpressApp["Express API Application"]
        SocketManager["Socket Registry (userSocketMap)"]
        AuthMW["Clerk Express Middleware"]
        MulterMW["Multer Memory Buffer (25MB)"]
        ClerkWebhook["Svix Webhook Verifier"]
        MsgCtrl["Message & Aggregation Controller"]
        CronKeepAlive["Keep-Alive Cron Service"]
    end

    UI --> ZAuth & ZChat & ZSound & CtxTheme & CtxWall
    ZChat -->|REST Requests| ExpressApp
    SockClient <-->|Bi-directional WebSockets| HttpServer
    HttpServer --> SocketManager
    ExpressApp --> AuthMW & MulterMW & ClerkWebhook & MsgCtrl
    AuthMW -->|Validate Session| ClerkAuth
    ClerkAuth -->|Webhooks /api/webhooks/clerk| ClerkWebhook
    MulterMW -->|Stream File Buffers| ImageKitCDN
    MsgCtrl -->|Query & Aggregations| MongoAtlas
    ClerkWebhook -->|Sync User Documents| MongoAtlas
    MsgCtrl -->|Emit newMessage| SocketManager
```

---

## 2. Real-Time WebSocket Architecture (`socket.js`)

```mermaid
sequenceDiagram
    autonumber
    actor ClientA as User A (Sender)
    participant SocketServer as Socket.io Server (socket.js)
    participant DB as MongoDB
    actor ClientB as User B (Receiver)

    Note over ClientA,SocketServer: Connection & Presence Handshake
    ClientA->>SocketServer: io.connect("...", { query: { userId: "userA_id" } })
    SocketServer->>SocketServer: userSocketMap["userA_id"] = socket.id
    SocketServer-->>ClientA: emit("getOnlineUsers", Object.keys(userSocketMap))
    SocketServer-->>ClientB: emit("getOnlineUsers", Object.keys(userSocketMap))

    Note over ClientA,ClientB: Sending Message
    ClientA->>SocketServer: HTTP POST /api/messages/send/userB_id (Text + File)
    SocketServer->>DB: Save Message Document
    SocketServer->>SocketServer: receiverSocketId = userSocketMap["userB_id"]
    alt Receiver is Online
        SocketServer-->>ClientB: emit("newMessage", savedMessage)
    end
    SocketServer-->>ClientA: HTTP 201 Created (savedMessage)

    Note over ClientA,SocketServer: Disconnect & Cleanup
    ClientA->>SocketServer: socket.disconnect()
    SocketServer->>SocketServer: delete userSocketMap["userA_id"]
    SocketServer-->>ClientB: emit("getOnlineUsers", Object.keys(userSocketMap))
```

### 2.1 Online User Registry Pattern
```javascript
// backend/src/lib/socket.js
const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    // Broadcast online users to everyone connected
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        if (userId) delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});
```

---

## 3. Database Schema & Aggregation Pipeline

```mermaid
erDiagram
    USER ||--o{ MESSAGE : "sends (senderId)"
    USER ||--o{ MESSAGE : "receives (receiverId)"

    USER {
        ObjectId _id PK
        string clerkId UK "Unique Clerk Identifier"
        string email UK "Unique Email Address"
        string fullName "User's Full Display Name"
        string profilePic "User Avatar URL from Clerk/CDN"
        Date createdAt "Timestamp"
        Date updatedAt "Timestamp"
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId senderId FK "References USER._id"
        ObjectId receiverId FK "References USER._id"
        string text "Optional Message Text Body"
        string image "Optional Image CDN URL"
        string video "Optional Video CDN URL"
        Date createdAt "Message Timestamp (Indexed)"
        Date updatedAt "Timestamp"
    }
```

### 3.1 Aggregated Conversations Query
To render the sidebar with the last message and contact details:
```javascript
export async function getConversationsForSidebar(req, res) {
    const loggedInUserId = req.user._id;

    const conversations = await Message.aggregate([
        // 1. Match messages where user is sender or receiver
        { $match: { $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }] } },
        // 2. Sort by latest message first
        { $sort: { createdAt: -1 } },
        // 3. Group by the conversation partner
        {
            $group: {
                _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
                lastMessage: { $first: "$$ROOT" },
            },
        },
        // 4. Lookup partner profile details
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "partner",
            },
        },
        { $unwind: "$partner" },
        { $project: { "partner.clerkId": 0 } },
    ]);

    res.status(200).json(conversations);
}
```

---

## 4. Frontend Architecture & State Management

```mermaid
graph TD
    App[App.jsx] --> WallpaperProvider[WallpaperContext (13 Wallpapers)]
    WallpaperProvider --> ThemeProvider[ThemeContext (11 Themes)]
    ThemeProvider --> Router[React Router]
    Router --> AuthPage[AuthPage (/login)]
    Router --> ChatPage[ChatPage (/)]
    
    subgraph Stores ["Zustand Reactive State Stores"]
        useAuthStore["useAuthStore (authUser, isCheckingAuth, checkAuth)"]
        useChatStore["useChatStore (messages, users, selectedUser, isMessagesLoading)"]
        useSoundStore["useSoundStore (isSoundEnabled, playKeyStroke, playSentSound)"]
    end

    ChatPage --> Sidebar[Sidebar (User List, Search, Online Indicators)]
    ChatPage --> ChatContainer[Chat Window (Header, Messages, Input)]
    ChatPage --> NoChatSelected[Empty State Placeholder]
    ChatContainer --> MessageList[Message Feed (Bubbles, Lightbox, Videos)]
    ChatContainer --> MessageInput[Input Bar (Emoji, Media Attachment, Send)]
```

---

## 5. Security & Container Deployment

### 5.1 Defense-in-Depth Security
1. **Clerk Token Verification:** All REST endpoints verify session claims via `@clerk/express` and map them to MongoDB `_id`.
2. **Svix Cryptographic Webhook Check:** Webhook secret verifies payload authenticity before altering MongoDB.
3. **In-Memory Multer Processing:** Zero disk writes prevent temporary file vulnerabilities and disk exhaustion attacks.
4. **Least-Privilege Docker Image:** The runtime image uses `USER node` and non-root execution.

### 5.2 Multi-Stage Dockerfile Execution
- **Stage 1 (Frontend Build):** Pre-compiles Vite SPA into static assets.
- **Stage 2 (Backend Build):** Copies backend ESM source code to `dist/`.
- **Stage 3 (Runner):** Integrates static frontend into `/app/public`, installs production-only dependencies, and launches the Express + Socket.io server on port `3001`.
