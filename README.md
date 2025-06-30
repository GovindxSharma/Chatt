
## 💬 Chatt – Real-time Chat Application

**Chatt** is a full-stack, real-time chat application built with the **MERN stack** and powered by **Socket.IO** for live messaging. Designed for instant communication between users, Chatt features a modern interface, secure authentication, and seamless user experience.

> 🔗 **Live Demo:** [Chatt on Render](https://chat-to-talk.onrender.com)

---

### 🚀 Tech Stack

**Frontend**

* React.js
* Axios
* Context API
* Tailwind CSS (or CSS Module/UI Library, depending on your build)

**Backend**

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT Authentication
* Bcrypt.js for password hashing

**Real-time**

* Socket.IO

---

### ✨ Features

* 🔐 Secure User Authentication (Register, Login, Logout)
* 💬 Real-time 1-on-1 and group chat
* 🔔 Typing indicator
* 🟢 Online status indicator
* 📥 Chat history persistence
* 🧑‍🤝‍🧑 Search users and create chat rooms
* 📱 Fully responsive UI

---

### 📁 Folder Structure (Basic)

```
Chatt/
├── client/                 # React Frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       └── pages/
├── server/                 # Express Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── socket/
├── .env
├── package.json
└── README.md
```

---

### 🛠️ How to Run Locally

```bash
# Clone the repository
git clone https://github.com/GovindxSharma/Chatt.git
cd Chatt

# Start backend
cd server
npm install
npm run dev

# Start frontend
cd ../client
npm install
npm start
```

Ensure you have a `.env` file in your `server/` with the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
```

---

### 🔒 Environment Variables

| Variable     | Description                 |
| ------------ | --------------------------- |
| `MONGO_URI`  | MongoDB connection URI      |
| `JWT_SECRET` | Secret for signing tokens   |
| `PORT`       | Server port (default: 5000) |

---



