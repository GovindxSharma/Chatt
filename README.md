# Chatt - Scalable Real-Time Communications Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Chakra UI](https://img.shields.io/badge/Chakra%20UI-2.x-319795?logo=chakraui&logoColor=white)](https://chakra-ui.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

Chatt is a full-stack, enterprise-grade real-time messaging application engineered with the MERN stack (MongoDB, Express, React, Node.js) and bidirectional WebSockets via Socket.IO. The platform features persistent group and direct messaging, real-time presence tracking, message lifecycle management (reactions, pins, edits, deletions), synthetic audio chime signaling via Web Audio API, comprehensive theme customization, and an automated health monitoring subsystem designed for continuous uptime tracking.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Monorepo Structure](#monorepo-structure)
3. [Technology Stack: Rationale and Implementation](#technology-stack-rationale-and-implementation)
   - [Frontend Architecture](#frontend-architecture)
   - [Backend Architecture](#backend-architecture)
   - [Database and Storage](#database-and-storage)
4. [Key Platform Features](#key-platform-features)
5. [Real-Time WebSocket Protocol](#real-time-websocket-protocol)
6. [Data Models and Schemas](#data-models-and-schemas)
7. [REST API Specification](#rest-api-specification)
8. [Environment Variables and Configuration](#environment-variables-and-configuration)
9. [Installation and Local Development](#installation-and-local-development)
10. [Production Build and Deployment](#production-build-and-deployment)
11. [Health Monitoring and Uptime Integration](#health-monitoring-and-uptime-integration)
12. [Troubleshooting and Common Port Conflicts](#troubleshooting-and-common-port-conflicts)

---

## System Architecture

The application adopts a decoupled client-server architecture hosted within a unified monorepo repository. The frontend communicates with the backend via two distinct communication channels:

1. **HTTP/REST Channel**: Handles stateless operations such as user authentication, profile updates, chat initialization, message pagination, and system health checks.
2. **WebSocket (Socket.IO) Channel**: Maintains a persistent, low-latency, full-duplex connection for instant message delivery, live typing states, active presence synchronization, and message event broadcasts.

```
+-------------------------------------------------------------------------+
|                              Client (React)                             |
|  +-------------------+  +--------------------+  +--------------------+  |
|  |  Chakra UI / CSS  |  |  ChatContext State |  |  Web Audio Engine  |  |
|  +-------------------+  +--------------------+  +--------------------+  |
+--------------------^------------------------------^---------------------+
                     |                              |
         HTTP REST (Axios / JSON)       WebSocket (Socket.IO Client)
                     |                              |
+--------------------v------------------------------v---------------------+
|                            Server (Node/Express)                        |
|  +-------------------------------------------------------------------+  |
|  | Middlewares: CORS | Auth (JWT) | ErrorHandler | Request Parsers   |  |
|  +-------------------------------------------------------------------+  |
|  | Controllers: Auth | Chat | Message | Health Check                 |  |
|  +-------------------------------------------------------------------+  |
|  | Socket.IO Gateway: Rooms | Presence Map | Event Dispatcher        |  |
|  +-------------------------------------------------------------------+  |
+------------------------------------^------------------------------------+
                                     |
                         Mongoose ODM Connection
                                     |
+------------------------------------v------------------------------------+
|                         Database (MongoDB Atlas)                        |
|             Collections: Users | Chats | Messages                       |
+-------------------------------------------------------------------------+
```

---

## Monorepo Structure

The repository maintains both the client single-page application (SPA) and backend server within a single root context, allowing synchronized versioning, coordinated build scripts, and unified deployment pipelines.

```
Chatt/
├── .env                              # Root environment variables
├── .gitignore                        # Git exclusion configuration
├── package.json                      # Root build and orchestration scripts
├── package-lock.json                 # Dependency lockfile
├── README.md                         # Project documentation
├── client/                           # Frontend React Application
│   ├── package.json                  # Frontend dependencies and scripts
│   ├── public/                       # Static public assets and HTML template
│   │   ├── index.html
│   │   └── manifest.json
│   └── src/
│       ├── App.css                   # Global animations and glassmorphic styling
│       ├── App.js                    # Core routing configuration
│       ├── index.js                  # React DOM entry point with ChakraProvider
│       ├── animations/               # Lottie animation assets (e.g. typing indicators)
│       ├── Components/
│       │   ├── Authentication/       # Login and Registration components
│       │   │   ├── Login.js
│       │   │   └── Register.js
│       │   ├── Chat/                 # Main chat rendering and input components
│       │   │   ├── ChatBox.js        # Responsive chat container
│       │   │   ├── ChatLoading.js    # Skeleton loader components
│       │   │   ├── MessageLoading.js # Message loading skeleton
│       │   │   ├── MyChats.js        # Conversation list sidebar
│       │   │   ├── ScrollableChat.js # Virtualized/Auto-scroll message thread
│       │   │   └── SingleChat.js     # Active conversation manager and input
│       │   ├── Miscellaneous/        # Modals, navigation, and top bar
│       │   │   ├── GroupChatModal.js # Group conversation creator
│       │   │   ├── ProfileModal.js   # User profile viewer and editor
│       │   │   ├── SideDrawer.js     # User search, navigation, and settings drawer
│       │   │   └── UpdateGroupChatModal.js # Group administration modal
│       │   └── UserAvatar/           # User badge and avatar components
│       │       ├── UserBadgeItem.js  # Removable tag for group creation
│       │       └── UserListItem.js   # Search result user item
│       ├── Context/
│       │   └── ChatProvider.js       # Central React Context provider
│       ├── Pages/
│       │   ├── Chatpage.js           # Primary dashboard layout
│       │   └── Homepage.js           # Authentication gateway page
│       └── utils/
│           └── cacheUtils.js         # Client-side cache and storage helpers
└── server/                           # Backend Node.js / Express Application
    ├── index.js                      # HTTP server initialization and Socket.IO gateway
    ├── config/
    │   └── db.js                     # MongoDB connection with retry strategy
    ├── controllers/
    │   ├── chatController.js         # Chat CRUD and group membership logic
    │   ├── messageController.js      # Message dispatch, reactions, edits, deletes
    │   └── userController.js         # Authentication, search, and profile updates
    ├── middlewares/
    │   ├── authMiddleware.js         # JWT verification and route protection
    │   └── errorMiddleware.js        # 404 handler and central error processor
    ├── models/
    │   ├── chatModel.js              # Chat document schema
    │   ├── messageModel.js           # Message document schema with reactions
    │   └── userModel.js              # User schema with bcrypt pre-save hooks
    └── routes/
        ├── chatRoutes.js             # /api/chat endpoints
        ├── healthRoutes.js           # /health and /api/health monitoring endpoints
        ├── messageRoutes.js          # /api/message endpoints
        └── userRoutes.js             # /api/user endpoints
```

---

## Technology Stack: Rationale and Implementation

### Frontend Architecture

#### React.js (v18.x)
- **Why We Use It**: React offers a component-driven architecture, a virtual DOM for optimal UI reconciliations during high-frequency chat updates, and robust state orchestration via modern Hooks (`useState`, `useEffect`, `useCallback`, `useContext`, `useRef`).
- **How We Used It**: Powers the entire single-page application. Handles routing via `react-router-dom` (v6), renders dynamic chat trees, and drives responsive UI adaptations between mobile and desktop viewports.

#### Chakra UI (v2.x) & Emotion
- **Why We Use It**: Chakra UI provides an accessible, theme-driven component library with built-in dark/light mode foundations, layout primitives (`Box`, `Flex`, `Stack`), and accessible overlay systems (`Modal`, `Drawer`, `Menu`, `Toast`).
- **How We Used It**: Forms the design system of the entire platform. Customized with glassmorphic styling, semi-transparent background overlays, glowing status badges, and theme-adaptive palettes for both dark and light modes.

#### Framer Motion (v11.x)
- **Why We Use It**: Provides declarative, hardware-accelerated animations for fluid transitions without degrading rendering performance.
- **How We Used It**: Animates layout transitions, drawer entries, message action menus, and modal dialog openings to deliver a native-app feel.

#### Socket.IO Client (v4.x)
- **Why We Use It**: Handles transport negotiation (WebSocket with HTTP long-polling fallback), automatic reconnection, event-based messaging, and room subscriptions.
- **How We Used It**: Establishes a persistent connection to the server upon user login. Dispatches and listens for message events, typing states, reaction toggles, deletions, and presence synchronizations.

#### Web Audio API (Native Browser Synthesis)
- **Why We Use It**: Eliminates external MP3/WAV asset dependencies, reduces network payload, guarantees zero latency audio execution, and prevents asset loading 404 errors.
- **How We Used It**: Directly synthesizes dual-tone harmonic sine waves (F5 698.46 Hz and A5 880.00 Hz) for incoming message notifications, and descending tone sweeps for outgoing messages. Includes an exponential gain ramp to prevent audio clipping.

#### Axios (v1.x)
- **Why We Use It**: Provides an intuitive promise-based HTTP client with automatic JSON parsing, request/response headers configuration, and streamlined token injection.
- **How We Used It**: Executes all REST API operations against backend endpoints with JWT Bearer authentication headers.

#### React Lottie
- **Why We Use It**: Renders lightweight, vector-based vector animations with high performance and scalable resolution.
- **How We Used It**: Renders smooth, dynamic 3-dot typing indicator animations when interlocutors are composing messages.

---

### Backend Architecture

#### Node.js & Express.js (v4.x)
- **Why We Use It**: Node.js provides non-blocking, event-driven asynchronous I/O ideal for handling concurrent WebSocket connections and I/O-intensive database operations. Express provides a minimalist, robust routing pipeline.
- **How We Used It**: Serves as the core HTTP application server, mounts modular route handlers, integrates JSON/URL-encoded body parsers with 50MB limits for file payloads, and serves static frontend production builds.

#### Socket.IO Server (v4.x)
- **Why We Use It**: Provides a scalable WebSocket abstraction with connection heartbeat monitoring, dynamic room management, and targeted message broadcasting.
- **How We Used It**: Attached directly to the HTTP server instance. Manages user-specific and chat-specific rooms, maintains an in-memory presence registry using a `Map<userId, Set<socketId>>` structure, and broadcasts live events across connected clients.

#### JSON Web Token (JWT - jsonwebtoken) & Bcrypt.js
- **Why We Use It**: JWT enables stateless, secure, token-based session verification without requiring server-side session stores. Bcrypt.js provides cryptographic password hashing using automated salting.
- **How We Used It**: Signs 30-day expiring tokens upon user authentication. Passwords are automatically hashed with 10 salt rounds via Mongoose pre-save middleware before document persistence. Tokens are decoded and verified on protected endpoints via `authMiddleware.js`.

#### Express Async Handler
- **Why We Use It**: Eliminates repetitive `try-catch` boilerplate across controller methods and automatically passes unhandled asynchronous rejections to the central error middleware.
- **How We Used It**: Wraps all asynchronous database operations in controllers to guarantee structured error logging and uniform HTTP error responses.

#### CORS Middleware
- **Why We Use It**: Enforces Cross-Origin Resource Sharing security policies while allowing cross-domain communication between decoupled frontend clients and backend APIs during development.
- **How We Used It**: Configured with allowed methods (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`) and credentials support.

---

### Database and Storage

#### MongoDB & Mongoose ODM (v8.x)
- **Why We Use It**: MongoDB's document-oriented model allows flexible representation of complex chat structures (nested arrays of users, messages, reaction maps). Mongoose provides schema validation, type casting, middleware hooks, and relational referencing via `populate()`.
- **How We Used It**: Manages collections for Users, Chats, and Messages. Uses Mongoose population pipelines to deeply resolve nested references (`users`, `latestMessage`, `groupAdmin`, `sender`, `reactions.user`, `replyTo`).

---

## Key Platform Features

### Authentication and Identity Management
- **Registration and Login**: User onboarding with email validation, unique constraint enforcement, and password encryption.
- **One-Click Guest Access**: Instant authentication for demo testing with pre-populated credentials.
- **Profile Customization**: Live updating of user avatar URLs, status statements, and descriptive biography fields.

### Real-Time Messaging and Conversations
- **Direct (1-on-1) and Group Chats**: Dynamic creation and real-time synchronization of private direct messages and multi-user group discussions.
- **Message Lifecycle Controls**:
  - **Reactions**: Interactive emoji reactions linked to user profiles with instant multi-client reflection.
  - **Editing**: Message modification by original authors with an `isEdited` audit indicator.
  - **Deletion**: Soft deletion of messages with conversation-wide updates.
  - **Pinning**: Persistent message pinning allowing critical messages to be highlighted at the top of the chat view.
  - **Clear Chat**: Ability to purge message history within a specific conversation.
- **Media and File Sharing**: Support for uploading and sharing images, attachments, and file URLs with built-in modal lightbox previews.
- **In-Chat Search**: Instant client-side text filtering across conversation histories.

### Presence and Audio Signaling
- **Active Presence Tracking**: Server-side tracking of active user sockets with live visual presence indicators.
- **Typing Indicators**: Lottie-powered indicators triggered with debounce controls during text composition.
- **Zero-Dependency Audio Chimes**: Web Audio API sine synthesis for incoming notifications and outgoing confirmations, complete with persistent mute toggles.

### Accessibility and UX
- **Theme Engine**: Comprehensive Dark and Light modes persisted in `localStorage` and synchronized across Chakra UI tokens.
- **Responsive Layout**: Dual-mode master-detail layout switching between conversation list and active chat view on mobile screens.

---

## Real-Time WebSocket Protocol

The platform utilizes Socket.IO for duplex communication. Below is the event contract implemented across the client and server:

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `setup` | Client to Server | `userData: { _id: string }` | Registers user socket, joins user-specific room, adds socket to presence registry, and broadcasts online list. |
| `connected` | Server to Client | None | Confirms successful socket initialization and room assignment. |
| `get-online-users` | Client to Server | None | Requests the current array of active user IDs. |
| `online-users-list` | Server to Client | `userIds: string[]` | Broadcasts the updated list of online user IDs to all connected clients. |
| `join chat` | Client to Server | `room: string (chatId)` | Subscribes socket to a specific conversation room. |
| `typing` | Client to Server | `room: string (chatId)` | Broadcasts typing status to all users in the specified room. |
| `stop typing` | Client to Server | `room: string (chatId)` | Broadcasts cessation of typing in the specified room. |
| `new message` | Client to Server | `message: MessageDocument` | Relays incoming message to recipient user rooms. |
| `message received` | Server to Client | `message: MessageDocument` | Delivers incoming message to target client for state update and audio notification. |
| `message reaction` | Client to Server | `{ chatId, messageId, reaction }` | Emits reaction update event to conversation room. |
| `message reaction updated` | Server to Client | `{ chatId, messageId, reactions }` | Broadcasts updated reaction collection to room members. |
| `message deleted` | Client to Server | `{ chatId, messageId }` | Emits message deletion notice to conversation room. |
| `message deleted updated` | Server to Client | `{ chatId, messageId }` | Broadcasts deletion update to remove or mark message in room view. |
| `message edited` | Client to Server | `{ chatId, message }` | Emits edited message payload to conversation room. |
| `message edited updated` | Server to Client | `{ chatId, message }` | Broadcasts edited message payload to replace existing message in client stores. |
| `message pinned` | Client to Server | `{ chatId, message }` | Emits pin toggle event to conversation room. |
| `message pinned updated` | Server to Client | `{ chatId, message }` | Broadcasts pin status to update pinned message banners. |
| `chat cleared` | Client to Server | `{ chatId }` | Emits chat clearance signal. |
| `chat cleared updated` | Server to Client | `{ chatId }` | Broadcasts chat clearance to purge message store on active clients. |
| `disconnect` | Client to Server | None | Cleans up socket reference from presence map and broadcasts updated online list if all sockets for the user terminate. |

---

## Data Models and Schemas

### User Schema (`server/models/userModel.js`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | `required: true` | User display name. |
| `email` | String | `required: true, unique: true` | User email address used for authentication. |
| `password` | String | `required: true` | Bcrypt-hashed password string. |
| `pic` | String | `default: "..."` | Avatar image URL. |
| `bio` | String | `default: "Hey there! I am using Chatt.", maxLength: 150` | User biography description. |
| `status` | String | `default: "Available", maxLength: 50` | User custom status statement. |
| `timestamps` | Boolean | `true` | Automatically generates `createdAt` and `updatedAt`. |

### Chat Schema (`server/models/chatModel.js`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `chatName` | String | `trim: true` | Display title for group conversations. |
| `isGroupChat` | Boolean | `default: false` | Identifies 1-on-1 vs group conversation. |
| `users` | Array of ObjectId | `ref: "User"` | Array of participating user identifiers. |
| `latestMessage` | ObjectId | `ref: "Message"` | Reference to the most recently dispatched message. |
| `groupAdmin` | ObjectId | `ref: "User"` | User identifier of the group administrator. |
| `timestamps` | Boolean | `true` | Automatically generates `createdAt` and `updatedAt`. |

### Message Schema (`server/models/messageModel.js`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `sender` | ObjectId | `ref: "User", required: true` | User reference of the message author. |
| `content` | String | `trim: true, default: ""` | Text body of the message. |
| `fileUrl` | String | `default: ""` | URL of attached media/file. |
| `fileType` | String | `default: ""` | Attachment classification (`image`, `audio`, `file`, `video`). |
| `fileName` | String | `default: ""` | Original filename of the attachment. |
| `replyTo` | ObjectId | `ref: "Message"` | Reference to parent message for threaded replies. |
| `isEdited` | Boolean | `default: false` | Flag set when message content has been updated. |
| `isPinned` | Boolean | `default: false` | Flag indicating if message is pinned to chat header. |
| `chat` | ObjectId | `ref: "Chat", required: true` | Associated chat conversation identifier. |
| `reactions` | Array of Objects | `[{ user: ObjectId, emoji: String }]` | User reactions associated with this message. |
| `isDeleted` | Boolean | `default: false` | Soft-deletion flag. |
| `readBy` | Array of ObjectId | `ref: "User"` | Identifiers of users who have read the message. |
| `timestamps` | Boolean | `true` | Automatically generates `createdAt` and `updatedAt`. |

---

## REST API Specification

### Authentication and User Endpoints (`/api/user`)

| Method | Endpoint | Protection | Request Payload | Response / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/user` | Public | `{ name, email, password, pic }` | Creates user, generates JWT token, returns user profile. |
| `POST` | `/api/user/login` | Public | `{ email, password }` | Authenticates credentials, returns user profile with JWT token. |
| `GET` | `/api/user?search=keyword` | Protected (JWT) | None (Query Param: `search`) | Returns list of users matching name or email regex query. |
| `PUT` | `/api/user/profile` | Protected (JWT) | `{ name, pic, bio, status }` | Updates profile metadata for authenticated user. |

### Chat Management Endpoints (`/api/chat`)

| Method | Endpoint | Protection | Request Payload | Response / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/chat` | Protected (JWT) | `{ userId }` | Creates or returns existing 1-on-1 chat with target user. |
| `GET` | `/api/chat` | Protected (JWT) | None | Returns all chats associated with the authenticated user. |
| `POST` | `/api/chat/group` | Protected (JWT) | `{ name, users: JSON.stringify([]) }` | Creates a new group chat with minimum 2 members. |
| `PUT` | `/api/chat/rename` | Protected (JWT) | `{ chatId, chatName }` | Renames an existing group chat. |
| `PUT` | `/api/chat/groupadd` | Protected (JWT) | `{ chatId, userId }` | Adds a user to an existing group chat. |
| `PUT` | `/api/chat/groupremove` | Protected (JWT) | `{ chatId, userId }` | Removes a user from a group chat or facilitates leaving. |

### Message Management Endpoints (`/api/message`)

| Method | Endpoint | Protection | Request Payload | Response / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/message` | Protected (JWT) | `{ content, chatId, fileUrl, fileType, fileName, replyTo }` | Creates message, updates chat's `latestMessage`, returns populated message. |
| `GET` | `/api/message/:chatId` | Protected (JWT) | None | Fetches all messages belonging to the given chat ID. |
| `DELETE` | `/api/message/:id` | Protected (JWT) | None | Deletes specified message (authorized for sender or group admin). |
| `PUT` | `/api/message/:id/edit` | Protected (JWT) | `{ content }` | Updates message content and sets `isEdited: true`. |
| `PUT` | `/api/message/:id/pin` | Protected (JWT) | None | Toggles message pinned state. |
| `PUT` | `/api/message/:id/react` | Protected (JWT) | `{ emoji }` | Adds, updates, or removes user emoji reaction on the message. |
| `DELETE` | `/api/message/clear/:chatId` | Protected (JWT) | None | Purges all messages within the specified chat. |

### System Health Endpoints (`/health` & `/api/health`)

| Method | Endpoint | Protection | Response / Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` / `/api/health` | Public | Returns detailed JSON health metrics (uptime, database connection, memory usage). |
| `HEAD` | `/health` / `/api/health` | Public | Returns `200 OK` with zero payload body for low-overhead ping monitors. |

---

## Environment Variables and Configuration

Create a `.env` file in the project root directory or within `server/`:

```env
# Server Port Configuration
PORT=5001

# MongoDB Connection String (Supports MONGO_URI, MONGODB_URI, or DB_URI)
DB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JSON Web Token Secret Key
JWT_SECRET=your_jwt_strong_secret_key_here

# Runtime Environment (development | production)
NODE_ENV=development

# Socket.IO CORS Allowed Client Origin (Set * or specific client URL)
URL=http://localhost:3000
```

### Variable Reference

| Key | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `5000` | Port on which the Express server listens. Use `5001` on macOS to avoid AirPlay conflict. |
| `DB_URI` / `MONGO_URI` | Required | None | MongoDB connection string URI for Atlas or local instance. |
| `JWT_SECRET` | Required | None | Cryptographic secret used for signing and verifying JSON Web Tokens. |
| `NODE_ENV` | Optional | `development` | Environment mode. When set to `production`, server serves `/client/build`. |
| `URL` | Optional | `*` | Allowed client origin for Socket.IO Cross-Origin Resource Sharing. |

---

## Installation and Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Active MongoDB Atlas cluster or local MongoDB instance

### Step 1: Clone the Repository
```bash
git clone https://github.com/GovindxSharma/Chatt.git
cd Chatt
```

### Step 2: Install Dependencies
Install root and server dependencies, followed by client dependencies:
```bash
# Install root/server dependencies
npm install

# Install client dependencies
cd client
npm install --legacy-peer-deps
cd ..
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
# Edit .env and populate DB_URI and JWT_SECRET
```

### Step 4: Run the Application

#### Option A: Running Backend and Frontend Simultaneously (Two Terminals)

Terminal 1 (Backend Server with Hot-Reload):
```bash
npm run server
```

Terminal 2 (Frontend React Development Server):
```bash
cd client
npm start
```
The client will start at `http://localhost:3000` and automatically proxy API calls to the server port specified in `client/package.json` (`proxy: "http://127.0.0.1:5001"`).

#### Option B: Full Monorepo Build and Run (Production Simulation)
```bash
# Build client and install all dependencies
npm run build

# Start the unified Node.js server
npm start
```
Access the application at `http://localhost:5001`.

---

## Production Build and Deployment

### Unified Build Command
The root `package.json` contains a specialized build pipeline for platforms like Render, Railway, or Heroku:

```bash
npm run build
```
This script executes:
1. `npm install --legacy-peer-deps` (Root and Server dependencies)
2. `npm install --legacy-peer-deps --prefix client` (Client dependencies)
3. `npm run build --prefix client` (Compiles React into optimized static assets in `client/build`)

### Start Command
```bash
npm start
```
When `NODE_ENV=production`, the Express server automatically binds static middleware to `/client/build` and serves `index.html` for all non-API routes.

---

## Health Monitoring and Uptime Integration

To prevent cloud hosts (such as Render free tiers) from spinning down due to inactivity, Chatt includes dedicated, high-performance health monitoring endpoints.

### Monitoring Configuration (e.g. UptimeRobot)
- **Target URL**: `https://<your-domain>/health` or `https://<your-domain>/api/health`
- **Monitoring Type**: `HTTP(s)` or `HEAD`
- **Check Interval**: Every 5 or 10 minutes
- **Expected Status**: `200 OK`

### Sample Health Check Response (`GET /health`)
```json
{
  "status": "ok",
  "message": "Chatt Server is fully operational",
  "timestamp": "2026-09-18T06:50:00.000Z",
  "uptime": {
    "seconds": 86400,
    "formatted": "1d 0h 0m 0s",
    "startedAt": "2026-09-17T06:50:00.000Z"
  },
  "database": {
    "status": "connected",
    "readyState": 1,
    "name": "chat-app"
  },
  "system": {
    "nodeVersion": "v18.20.0",
    "memory": {
      "rssMb": "45.12",
      "heapUsedMb": "26.80",
      "heapTotalMb": "34.50"
    },
    "environment": "production"
  }
}
```

---

## Troubleshooting and Common Port Conflicts

### Port 5000 `EADDRINUSE` Error on macOS
On macOS Monterey and later, Apple runs the **AirPlay Receiver** service bound to port `5000` by default.

**Resolution**:
1. Configure `PORT=5001` in your `.env` file (already configured by default in this repository).
2. Alternatively, disable AirPlay Receiver:
   - Navigate to: **System Settings** > **General** > **AirDrop & AirPlay**.
   - Toggle **AirPlay Receiver** to **OFF**.

### MongoDB Connection Failures
- Ensure your IP address is whitelisted in your MongoDB Atlas Network Access rules (`0.0.0.0/0` for cloud deployment).
- Verify that your connection string includes the correct database name and credentials without unencoded special characters.

---

## License

This project is licensed under the ISC License.
