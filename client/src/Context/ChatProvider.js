import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const ChatContext = createContext();

// Synthetic Web Audio API Chimes (Zero external audio file dependencies)
const playSoundEffect = (type = "receive") => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "receive") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      osc1.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
      osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.1);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === "send") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
      osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    // AudioContext blocked before user interaction
  }
};

const ChatProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("chatt_sound");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Dark & Light Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("chatt_theme");
    if (saved === "dark" || saved === "light") return saved;
    // System preference fallback
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  const isDark = theme === "dark";

  // Sync theme to document body and HTML
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (isDark) {
      document.body.classList.add("chakra-ui-dark");
      document.body.classList.remove("chakra-ui-light");
    } else {
      document.body.classList.add("chakra-ui-light");
      document.body.classList.remove("chakra-ui-dark");
    }
  }, [theme, isDark]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("chatt_theme", next);
      return next;
    });
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("chatt_sound", JSON.stringify(next));
      return next;
    });
  };

  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      playSoundEffect("receive");
    }
  }, [soundEnabled]);

  const playSendSound = useCallback(() => {
    if (soundEnabled) {
      playSoundEffect("send");
    }
  }, [soundEnabled]);

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      setUser(userInfo);

      if (!userInfo) {
        navigate("/");
      }
    } catch (e) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
        onlineUsers,
        setOnlineUsers,
        soundEnabled,
        toggleSound,
        playNotificationSound,
        playSendSound,
        theme,
        isDark,
        toggleTheme,
      }}
    >
      <div
        className={isDark ? "theme-dark" : "theme-light"}
        data-theme={theme}
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </div>
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;