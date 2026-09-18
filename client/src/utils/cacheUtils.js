// Chatt Stale-While-Revalidate Local & Session Caching Utility

const CHATS_CACHE_PREFIX = "chatt_cache_chats_";
const PREVIEWS_CACHE_PREFIX = "chatt_cache_previews_";
const MESSAGES_CACHE_PREFIX = "chatt_cache_msg_";
const MAX_CACHED_MESSAGES_PER_CHAT = 40;

/**
 * Retrieve cached conversation list for instant UI paint
 */
export const getCachedChats = (userId) => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${CHATS_CACHE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn("Error reading chats cache:", err);
    return null;
  }
};

/**
 * Persist conversation list in local cache
 */
export const setCachedChats = (userId, chats) => {
  if (!userId || !Array.isArray(chats)) return;
  try {
    // Only cache essential serializable data
    const sanitized = chats.map((c) => ({
      _id: c._id,
      chatName: c.chatName,
      isGroupChat: c.isGroupChat,
      users: c.users,
      latestMessage: c.latestMessage,
      groupAdmin: c.groupAdmin,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));
    localStorage.setItem(`${CHATS_CACHE_PREFIX}${userId}`, JSON.stringify(sanitized));
  } catch (err) {
    console.warn("Error persisting chats cache:", err);
  }
};

/**
 * Retrieve cached previews (decrypted)
 */
export const getCachedPreviews = (userId) => {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${PREVIEWS_CACHE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
};

/**
 * Persist decrypted previews
 */
export const setCachedPreviews = (userId, previews) => {
  if (!userId || !previews) return;
  try {
    localStorage.setItem(`${PREVIEWS_CACHE_PREFIX}${userId}`, JSON.stringify(previews));
  } catch (err) {}
};

/**
 * Retrieve cached messages for a specific chat for 0ms transition
 */
export const getCachedMessages = (chatId) => {
  if (!chatId) return null;
  try {
    const raw = sessionStorage.getItem(`${MESSAGES_CACHE_PREFIX}${chatId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
};

/**
 * Persist latest messages for a specific chat
 */
export const setCachedMessages = (chatId, messages) => {
  if (!chatId || !Array.isArray(messages)) return;
  try {
    // Keep only the most recent N messages to conserve memory
    const trimmed = messages.slice(-MAX_CACHED_MESSAGES_PER_CHAT);
    sessionStorage.setItem(`${MESSAGES_CACHE_PREFIX}${chatId}`, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Error persisting messages cache:", err);
  }
};

/**
 * Clear all local Chatt cache
 */
export const clearAllChattCache = () => {
  try {
    // Clear localStorage Chatt cache keys
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith(CHATS_CACHE_PREFIX) ||
        key.startsWith(PREVIEWS_CACHE_PREFIX)
      ) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(MESSAGES_CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn("Error clearing cache:", err);
  }
};
