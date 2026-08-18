const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");

// Load environment variables from both root or server/.env if available
dotenv.config();
dotenv.config({ path: "server/.env" });

// Connect to MongoDB
connectDB();

const app = express();

// Enable CORS for API requests
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

//------------------------------HEALTH CHECK ROUTES------------------------//
// Dedicated routes for UptimeRobot, Render, and monitoring pingers
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

//------------------------------API ROUTES---------------------------------//
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

//------------------------------DEPLOYMENT---------------------------------//
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/client/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "client", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("Chatt API is running successfully. Access /health for system status.");
  });
}

//------------------------------ERROR HANDLERS-----------------------------//
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Chatt Server is up and running at Port: ${PORT}`);
  console.log(`🩺 Health check available at: http://localhost:${PORT}/health`);
});

//------------------------------SOCKET.IO REALTIME------------------------//
const SOCKET_URL = process.env.URL || "*";
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: SOCKET_URL === "*" ? true : [SOCKET_URL, "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// In-memory online users tracking: Map<userId, Set<socketId>>
const onlineUsers = new Map();

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

io.on("connection", (socket) => {
  let currentUserId = null;

  // Initial user setup
  socket.on("setup", (userData) => {
    if (!userData || !userData._id) return;
    currentUserId = userData._id;
    socket.join(currentUserId);

    // Track user socket ID
    if (!onlineUsers.has(currentUserId)) {
      onlineUsers.set(currentUserId, new Set());
    }
    onlineUsers.get(currentUserId).add(socket.id);

    socket.emit("connected");
    // Broadcast updated online users list
    io.emit("online-users-list", getOnlineUserIds());
  });

  // Request online users list
  socket.on("get-online-users", () => {
    socket.emit("online-users-list", getOnlineUserIds());
  });

  // Join a specific chat room
  socket.on("join chat", (room) => {
    socket.join(room);
  });

  // Typing indicators
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // Real-time new message dispatch
  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat || !chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  // Real-time message reactions
  socket.on("message reaction", (data) => {
    if (data && data.chatId) {
      socket.in(data.chatId).emit("message reaction updated", data);
    }
  });

  // Real-time message deletion
  socket.on("message deleted", (data) => {
    if (data && data.chatId) {
      socket.in(data.chatId).emit("message deleted updated", data);
    }
  });

  // Disconnect / cleanup
  const handleDisconnect = () => {
    if (currentUserId && onlineUsers.has(currentUserId)) {
      const userSockets = onlineUsers.get(currentUserId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(currentUserId);
      }
      io.emit("online-users-list", getOnlineUserIds());
    }
  };

  socket.on("disconnect", handleDisconnect);

  socket.off("setup", () => {
    if (currentUserId) {
      socket.leave(currentUserId);
    }
    handleDisconnect();
  });
});