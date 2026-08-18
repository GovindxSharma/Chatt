## 💬 Chatt – Modern Real-time Chat Platform

**Chatt** is a full-stack, real-time messaging application built with the **MERN stack** (MongoDB, Express, React, Node.js) and powered by **Socket.IO** for instantaneous communication. Designed with a sleek glassmorphic interface, state-of-the-art chat features, and 24/7 uptime monitoring support.

> 🔗 **Live Demo:** [Chatt on Render](https://chat-to-talk.onrender.com)  
> 🩺 **Health Check:** `https://chat-to-talk.onrender.com/health`

---

### 🚀 Tech Stack

**Frontend**
* React.js 18
* Chakra UI & Emotion
* Framer Motion
* Socket.IO Client
* Web Audio API (Chimes & Notifications)
* Axios

**Backend**
* Node.js & Express.js
* MongoDB & Mongoose
* Socket.IO (Real-time WebSockets)
* JWT Authentication & Bcrypt.js
* CORS & Dotenv

---

### ✨ Features

* 🔐 **Secure Authentication**: Register, Login, and 1-Click Guest Login.
* 💬 **Real-time Messaging**: 1-on-1 direct chats and group conversations with live delivery.
* 🟢 **Real-time Online Presence**: Glowing live status indicators for connected users.
* 🔔 **Typing Indicators & Web Audio Chimes**: Live typing animations with pleasant audio notifications (and mute toggle).
* ❤️ **Interactive Emoji Reactions**: React to messages in real-time with instant sync.
* 📷 **Image & Media Sharing**: Send images and attachments with full-screen lightbox modal previews.
* 🔍 **In-Chat Message Search**: Instant keyword filtering within any conversation.
* 🗑️ **Message Management**: Senders and admins can delete messages; copy text to clipboard on hover.
* 👤 **User Profiles & Status**: Customizable user bios, status messages, and avatar uploads.
* 👥 **Group Chat Management**: Create groups, add/remove members, and rename chats.
* 🩺 **24/7 UptimeRobot Health Route**: `/health` & `/api/health` endpoints returning server uptime, database status, and memory metrics with `GET` and `HEAD` support.
* 📱 **Modern Glassmorphic UI**: Ultra-responsive layout with custom scrollbars, subtle gradients, and dark/light contrast.

---

### 🩺 Health Monitoring (UptimeRobot / Render)

Configure UptimeRobot or your preferred uptime monitor to ping:
* **URL:** `https://<your-domain>/health` or `https://<your-domain>/api/health`
* **Monitoring Type:** `HTTP(s)` or `HEAD`
* **Expected Response Code:** `200 OK`
* **Response Payload Example:**
```json
{
  "status": "ok",
  "message": "Chatt Server is fully operational",
  "timestamp": "2026-08-18T06:10:00.000Z",
  "uptime": {
    "seconds": 86400,
    "formatted": "1d 0h 0m 0s",
    "startedAt": "2026-08-17T06:10:00.000Z"
  },
  "database": {
    "status": "connected",
    "readyState": 1,
    "name": "chat-app"
  },
  "system": {
    "nodeVersion": "v18.x.x",
    "memory": {
      "rssMb": "42.10",
      "heapUsedMb": "25.30",
      "heapTotalMb": "32.00"
    },
    "environment": "production"
  }
}
```

---

### 🛠️ How to Run Locally

```bash
# Clone the repository
git clone https://github.com/GovindxSharma/Chatt.git
cd Chatt

# Install dependencies
npm run build

# Start the server
npm start
```

Or run backend and frontend separately:

```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
cd client
npm start
```

---

### 🔒 Environment Variables

Create a `.env` file in the root or `server/` directory:

| Variable     | Description                                           | Example / Default |
| ------------ | ----------------------------------------------------- | ----------------- |
| `PORT`       | Server port                                           | `5000`            |
| `MONGO_URI`  | MongoDB connection string (`MONGODB_URI` / `DB_URI`)  | `mongodb+srv://...`|
| `JWT_SECRET` | Secret key for signing authentication tokens          | `your_jwt_secret` |
| `NODE_ENV`   | Application environment (`production`/`development`)  | `development`     |
| `URL`        | Client URL for Socket.IO CORS (or `*`)                | `*`               |
