import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Default backend endpoint discovery
export const getBackendEndpoint = () => {
  if (process.env.REACT_APP_ENDPOINT) {
    return process.env.REACT_APP_ENDPOINT;
  }
  if (process.env.NODE_ENV === "production") {
    // If running on a separate frontend host (e.g. Vercel/Netlify), fallback to Render URL
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "chat-to-talk.onrender.com" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      return "https://chat-to-talk.onrender.com";
    }
    return window.location.origin;
  }
  // Development default
  return "http://localhost:5001";
};

// Global singleton state for background server status
const globalWarmupState = {
  status: "checking", // 'checking' | 'waking' | 'ready' | 'offline'
  latency: null,
  startTime: Date.now(),
  lastCheckTime: null,
  listeners: new Set(),
  hasWarmedUp: false,
  error: null,
};

const notifyListeners = () => {
  globalWarmupState.listeners.forEach((listener) => {
    try {
      listener({ ...globalWarmupState });
    } catch (e) {
      console.warn("Warmup listener error:", e);
    }
  });
};

// Background ping execution with timeout and retries
export const triggerServerWarmup = async (maxRetries = 6, retryDelay = 4000) => {
  if (globalWarmupState.hasWarmedUp) {
    return globalWarmupState;
  }

  const endpoint = getBackendEndpoint();
  const healthUrl = `${endpoint.replace(/\/+$/, "")}/health`;

  let attempt = 0;
  globalWarmupState.status = "checking";
  notifyListeners();

  const pingAttempt = async () => {
    attempt++;
    const pingStart = Date.now();

    try {
      // 10 second timeout per ping attempt
      const response = await axios.get(healthUrl, {
        timeout: 10000,
        headers: { "Cache-Control": "no-cache" },
      });

      if (response.status === 200 || response.data?.status === "OK") {
        const pingEnd = Date.now();
        globalWarmupState.status = "ready";
        globalWarmupState.latency = pingEnd - pingStart;
        globalWarmupState.hasWarmedUp = true;
        globalWarmupState.lastCheckTime = new Date();
        notifyListeners();
        return true;
      }
    } catch (err) {
      // If server took long or returned 502/503 (Render cold boot booting up)
      if (attempt < maxRetries) {
        globalWarmupState.status = "waking";
        globalWarmupState.error = err.message;
        notifyListeners();
        setTimeout(pingAttempt, retryDelay);
      } else {
        // After max retries, mark as offline/standby
        globalWarmupState.status = "offline";
        globalWarmupState.error = "Server took longer than expected to wake up.";
        notifyListeners();
      }
    }
    return false;
  };

  return pingAttempt();
};

// Auto-trigger immediately on module load in browser environment
if (typeof window !== "undefined") {
  // Fire behind-the-scenes warmup
  setTimeout(() => {
    triggerServerWarmup();
  }, 100);
}

// React Hook for components to subscribe to server warmup status
export const useServerWarmup = () => {
  const [state, setState] = useState({
    status: globalWarmupState.status,
    latency: globalWarmupState.latency,
    hasWarmedUp: globalWarmupState.hasWarmedUp,
    error: globalWarmupState.error,
  });

  useEffect(() => {
    let mounted = true;
    const handleUpdate = (updatedState) => {
      if (!mounted) return;
      setState({
        status: updatedState.status,
        latency: updatedState.latency,
        hasWarmedUp: updatedState.hasWarmedUp,
        error: updatedState.error,
      });
    };

    globalWarmupState.listeners.add(handleUpdate);
    // Initial sync
    handleUpdate(globalWarmupState);

    // If still in checking or offline, ensure warmup has been requested
    if (!globalWarmupState.hasWarmedUp && globalWarmupState.status !== "waking") {
      triggerServerWarmup();
    }

    return () => {
      mounted = false;
      globalWarmupState.listeners.delete(handleUpdate);
    };
  }, []);

  const manualRetry = useCallback(() => {
    globalWarmupState.hasWarmedUp = false;
    globalWarmupState.status = "checking";
    return triggerServerWarmup(4, 3000);
  }, []);

  return {
    ...state,
    manualRetry,
    isReady: state.status === "ready",
    isWaking: state.status === "waking" || state.status === "checking",
    isOffline: state.status === "offline",
  };
};

export default triggerServerWarmup;
