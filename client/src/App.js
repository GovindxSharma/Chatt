import React from "react";
import "./App.css";
import HomePage from "./Pages/HomePage.js";
import ChatPage from './Pages/ChatPage.js'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChatProvider from "./Context/ChatProvider";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ChatProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chats" element={<ChatPage />} />
          </Routes>
        </ChatProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
