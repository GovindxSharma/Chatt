// End-to-End Encryption (E2EE) Utility using Web Crypto API (AES-256-GCM + PBKDF2)

const SALT = "Chat-To-Talk-E2EE-Global-Salt-v1";
const keyCache = new Map();

// Helper: ArrayBuffer to Base64
const bufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Helper: Base64 to ArrayBuffer
const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Derive a 256-bit AES-GCM CryptoKey for a specific Chat ID
export const deriveChatKey = async (chatId) => {
  if (!chatId) return null;
  const rawChatId = typeof chatId === "object" && chatId._id ? chatId._id : chatId;
  
  if (keyCache.has(rawChatId)) {
    return keyCache.get(rawChatId);
  }

  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(`chatt_key_${rawChatId}`),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(`${SALT}_${rawChatId}`),
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  keyCache.set(rawChatId, derivedKey);
  return derivedKey;
};

// Encrypt plaintext string -> enc:v1:<base64-iv>:<base64-ciphertext>
export const encryptText = async (plaintext, chatId) => {
  if (!plaintext || typeof plaintext !== "string") return plaintext;
  try {
    const key = await deriveChatKey(chatId);
    if (!key) return plaintext;

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedPlaintext = encoder.encode(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedPlaintext
    );

    const ivBase64 = bufferToBase64(iv);
    const cipherBase64 = bufferToBase64(ciphertextBuffer);

    return `enc:v1:${ivBase64}:${cipherBase64}`;
  } catch (error) {
    console.error("E2EE Encryption Error:", error);
    return plaintext;
  }
};

// Decrypt ciphertext string -> plaintext string (supports legacy unencrypted strings)
export const decryptText = async (encryptedText, chatId) => {
  if (!encryptedText || typeof encryptedText !== "string") return encryptedText;
  if (!encryptedText.startsWith("enc:v1:")) {
    // Unencrypted legacy message
    return encryptedText;
  }

  try {
    const key = await deriveChatKey(chatId);
    if (!key) return encryptedText;

    const parts = encryptedText.split(":");
    if (parts.length !== 4) return encryptedText;

    const iv = new Uint8Array(base64ToBuffer(parts[2]));
    const ciphertext = base64ToBuffer(parts[3]);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    // Failed decryption fallback
    return encryptedText;
  }
};

// Decrypt single message object
export const decryptMessageObject = async (message, chatId) => {
  if (!message) return message;
  const targetChatId = chatId || message.chat?._id || message.chat;
  if (!targetChatId) return message;

  const decryptedContent = message.content
    ? await decryptText(message.content, targetChatId)
    : message.content;

  const decryptedFileName = message.fileName
    ? await decryptText(message.fileName, targetChatId)
    : message.fileName;

  return {
    ...message,
    content: decryptedContent,
    fileName: decryptedFileName,
    isEncrypted: message.content?.startsWith("enc:v1:"),
  };
};

// Decrypt array of message objects
export const decryptMessagesList = async (messages, chatId) => {
  if (!messages || !Array.isArray(messages)) return messages;
  return Promise.all(
    messages.map((msg) => decryptMessageObject(msg, chatId || msg.chat?._id || msg.chat))
  );
};
