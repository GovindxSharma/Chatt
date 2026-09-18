import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChakraProvider } from "@chakra-ui/react";

jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ data: {} })),
  get: jest.fn(() => Promise.resolve({ data: [] })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}));

import App from "./App";
import TypingDots from "./animations/TypingDots";
import {
  getSender,
  getSenderFull,
  formatMessageTime,
  formatMessageDate,
  isSameSender,
  isSameSenderMargin,
  isLastMessage,
  isSameUser,
} from "./config/ChatLogics";
import {
  encryptText,
  decryptText,
  decryptMessageObject,
  decryptMessagesList,
} from "./config/cryptoLogics";

describe("Chatt Comprehensive SEO & UI Test Suite", () => {
  test("renders Chatt brand heading with level 1 for SEO", () => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );

    // Semantic h1 check
    const headingElement = screen.getByRole("heading", { level: 1, name: /Chatt/i });
    expect(headingElement).toBeInTheDocument();

    // Tab controls check
    expect(screen.getByRole("tab", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Register/i })).toBeInTheDocument();

    // Quick Fill Demo button presence
    expect(
      screen.getByRole("button", { name: /Quick Fill Demo \/ Guest User/i })
    ).toBeInTheDocument();
  });

  test("fills demo credentials when clicking Quick Fill Demo / Guest User", () => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );

    const quickFillBtn = screen.getByRole("button", {
      name: /Quick Fill Demo \/ Guest User/i,
    });
    fireEvent.click(quickFillBtn);

    const emailInputs = screen.getAllByPlaceholderText(/name@example.com/i);
    const loginEmailInput = emailInputs[0];
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    expect(loginEmailInput.value).toBe("guest@example.com");
    expect(passwordInput.value).toBe("123456");
  });

  test("switches between Sign In and Register tabs smoothly", () => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );

    const registerTab = screen.getByRole("tab", { name: /Register/i });
    fireEvent.click(registerTab);

    // Register form fields
    expect(screen.getByPlaceholderText(/Your display name/i)).toBeInTheDocument();
    const emailInputs = screen.getAllByPlaceholderText(/name@example.com/i);
    expect(emailInputs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText(/Create password/i)).toBeInTheDocument();
  });

  test("renders TypingDots CSS animation component without crashing", () => {
    render(
      <ChakraProvider>
        <TypingDots />
      </ChakraProvider>
    );

    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(statusEl.querySelectorAll(".typing-dot").length).toBe(3);
  });
});

describe("ChatLogics Utility Functions & Boundary Conditions (Can Break It Suite)", () => {
  const user1 = { _id: "u1", name: "Alice", email: "alice@example.com" };
  const user2 = { _id: "u2", name: "Bob", email: "bob@example.com" };

  test("getSender correctly handles 2 users, 1 user, missing user, and null values", () => {
    expect(getSender(user1, [user1, user2])).toBe("Bob");
    expect(getSender(user2, [user1, user2])).toBe("Alice");
    expect(getSender(user1, [user2])).toBe("Bob");
    expect(getSender(user1, [])).toBe("User");
    expect(getSender(null, [user1])).toBe("Alice");
    expect(getSender(undefined, null)).toBe("User");
    expect(getSender({}, [])).toBe("User");
  });

  test("getSenderFull correctly returns user objects or safe fallbacks", () => {
    expect(getSenderFull(user1, [user1, user2])).toEqual(user2);
    expect(getSenderFull(user2, [user1, user2])).toEqual(user1);
    expect(getSenderFull(user1, [])).toEqual({});
    expect(getSenderFull(null, [user1])).toEqual(user1);
    expect(getSenderFull(undefined, undefined)).toEqual({});
  });

  test("formatMessageTime formats timestamps gracefully and defends against invalid inputs", () => {
    const now = new Date("2026-09-17T12:00:00Z");
    const formatted = formatMessageTime(now.toISOString());
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);

    // Null/undefined/empty safety
    expect(formatMessageTime(null)).toBe("");
    expect(formatMessageTime(undefined)).toBe("");
    expect(formatMessageTime("")).toBe("");
  });

  test("formatMessageDate returns Today, Yesterday, or formatted date without throwing", () => {
    const today = new Date();
    expect(formatMessageDate(today.toISOString())).toBe("Today");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatMessageDate(yesterday.toISOString())).toBe("Yesterday");

    const older = new Date("2020-01-01T10:00:00Z");
    const olderFormatted = formatMessageDate(older.toISOString());
    expect(olderFormatted).toContain("2020");

    // Boundary safety
    expect(formatMessageDate(null)).toBe("");
    expect(formatMessageDate(undefined)).toBe("");
    expect(formatMessageDate("")).toBe("");
  });

  test("isSameSender handles edge cases and boundary conditions", () => {
    const messages = [
      { sender: { _id: "u1" } },
      { sender: { _id: "u2" } },
      { sender: { _id: "u3" } },
    ];

    // messages[1] sender is u2, messages[2] sender is u3 (different), current user is u1
    expect(isSameSender(messages, messages[1], 1, "u1")).toBe(true);

    // When next sender is the same, isSameSender should be false
    const duplicateSenderMessages = [
      { sender: { _id: "u2" } },
      { sender: { _id: "u2" } },
    ];
    expect(isSameSender(duplicateSenderMessages, duplicateSenderMessages[0], 0, "u1")).toBe(false);

    // Boundary & Null checks
    expect(isSameSender([], null, 0, "u1")).toBe(false);
    expect(isSameSender(null, null, 0, "u1")).toBe(false);
    expect(isSameSender(messages, { sender: null }, 1, "u1")).toBe(false);
  });

  test("isSameSenderMargin computes spacing margins accurately under boundary states", () => {
    const messages = [
      { sender: { _id: "u2" } },
      { sender: { _id: "u2" } },
      { sender: { _id: "u1" } },
    ];

    // consecutive messages from other user (u2 then u2)
    expect(isSameSenderMargin(messages, messages[0], 0, "u1")).toBe(33);

    // message from loggedUser (u1) -> auto
    expect(isSameSenderMargin(messages, messages[2], 2, "u1")).toBe("auto");

    // Null safety
    expect(isSameSenderMargin(null, null, 0, "u1")).toBe("auto");
    expect(isSameSenderMargin([], {}, 0, "u1")).toBe("auto");
  });

  test("isLastMessage accurately identifies last message from other party", () => {
    const messages = [
      { sender: { _id: "u1" } },
      { sender: { _id: "u2" } },
    ];

    expect(isLastMessage(messages, 1, "u1")).toBe("u2");
    expect(isLastMessage(messages, 0, "u1")).toBe(false);
    expect(isLastMessage(messages, 1, "u2")).toBe(false);

    // Empty safety
    expect(isLastMessage([], 0, "u1")).toBe(false);
    expect(isLastMessage(null, 0, "u1")).toBe(false);
  });

  test("isSameUser compares adjacent messages defensively", () => {
    const messages = [
      { sender: { _id: "u1" } },
      { sender: { _id: "u1" } },
      { sender: { _id: "u2" } },
    ];

    expect(isSameUser(messages, messages[1], 1)).toBe(true);
    expect(isSameUser(messages, messages[2], 2)).toBe(false);
    expect(isSameUser(messages, messages[0], 0)).toBe(false);

    // Empty safety
    expect(isSameUser([], null, 0)).toBe(false);
    expect(isSameUser(null, null, 0)).toBe(false);
  });
});

describe("CryptoLogics & Encryption Fault Resilience Suite", () => {
  test("plain unencrypted strings pass through untouched (backward compatibility)", async () => {
    const plaintext = "Hello, this is a plain message from an older client version";
    const result = await decryptText(plaintext, "chat123");
    expect(result).toBe(plaintext);
  });

  test("null, undefined, and empty string payloads return safely without throwing", async () => {
    expect(await decryptText(null, "chat123")).toBe(null);
    expect(await decryptText(undefined, "chat123")).toBe(undefined);
    expect(await decryptText("", "chat123")).toBe("");

    expect(await encryptText(null, "chat123")).toBe(null);
    expect(await encryptText(undefined, "chat123")).toBe(undefined);
    expect(await encryptText("", "chat123")).toBe("");
  });

  test("corrupted or tampered ciphertext returns original string without crashing", async () => {
    const corruptedPayload = "enc:v1:not_valid_base64:not_valid_ciphertext";
    const result = await decryptText(corruptedPayload, "chat123");
    // Defends against uncaught exceptions and safely falls back
    expect(result).toBe(corruptedPayload);
  });

  test("decryptMessageObject handles missing chat, missing replyTo, and nulls safely", async () => {
    const rawMsg = {
      _id: "msg1",
      content: "Regular unencrypted text",
      chat: { _id: "c1" },
    };

    const res = await decryptMessageObject(rawMsg);
    expect(res.content).toBe("Regular unencrypted text");
    expect(res.isEncrypted).toBe(false);

    // Null safety
    expect(await decryptMessageObject(null)).toBe(null);
    expect(await decryptMessageObject(undefined)).toBe(undefined);
  });

  test("decryptMessagesList handles arrays and edge cases gracefully", async () => {
    const list = [
      { _id: "m1", content: "Msg 1", chat: "c1" },
      { _id: "m2", content: "Msg 2", chat: "c1" },
    ];

    const res = await decryptMessagesList(list, "c1");
    expect(res.length).toBe(2);
    expect(res[0].content).toBe("Msg 1");

    // Null safety
    expect(await decryptMessagesList(null)).toBe(null);
    expect(await decryptMessagesList([])).toEqual([]);
  });
});

describe("Search & Filter Regex Injection Safety", () => {
  test("regex escape handles malicious and special characters safely", () => {
    const dangerousSearchQueries = [
      "[.*+?^${}()|[\\]\\\\]",
      "(((((((((([a-z]+)+)+)+)+)+)+)+)+)", // ReDoS pattern
      "\\",
      "***test***",
      "?query=true&test=1",
      "<div>injection</div>",
      "<script>alert('xss')</script>",
    ];

    dangerousSearchQueries.forEach((q) => {
      expect(() => {
        const cleanQ = q.trim();
        const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        const testStr = "This is a normal chat message about [.*+?^${}()|[\\]\\\\] and things";
        testStr.split(regex);
      }).not.toThrow();
    });
  });
});

import {
  getCachedChats,
  setCachedChats,
  getCachedPreviews,
  setCachedPreviews,
  getCachedMessages,
  setCachedMessages,
  clearAllChattCache,
} from "./utils/cacheUtils";
import ChatLoading from "./Components/Chat/ChatLoading";
import MessageLoading from "./Components/Chat/MessageLoading";

describe("Stale-While-Revalidate Caching & Performance Suite", () => {
  const mockUserId = "user_test_999";
  const mockChatId = "chat_test_888";

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test("persists and retrieves cached chats correctly", () => {
    const sampleChats = [
      { _id: "c1", chatName: "Design Team", isGroupChat: true, users: [] },
      { _id: "c2", chatName: "Alice", isGroupChat: false, users: [] },
    ];

    setCachedChats(mockUserId, sampleChats);
    const retrieved = getCachedChats(mockUserId);
    expect(retrieved).toHaveLength(2);
    expect(retrieved[0].chatName).toBe("Design Team");

    // Null safety
    expect(getCachedChats(null)).toBe(null);
    expect(getCachedChats("nonexistent")).toBe(null);
  });

  test("persists and retrieves cached decrypted previews", () => {
    const previews = { c1: "Hey there!", c2: "See you tomorrow" };
    setCachedPreviews(mockUserId, previews);
    const retrieved = getCachedPreviews(mockUserId);
    expect(retrieved.c1).toBe("Hey there!");
    expect(retrieved.c2).toBe("See you tomorrow");
  });

  test("persists and retrieves cached message histories in session storage", () => {
    const sampleMsgs = [
      { _id: "m1", content: "Cached Hello", sender: { _id: "u1" } },
      { _id: "m2", content: "Cached World", sender: { _id: "u2" } },
    ];

    setCachedMessages(mockChatId, sampleMsgs);
    const retrieved = getCachedMessages(mockChatId);
    expect(retrieved).toHaveLength(2);
    expect(retrieved[1].content).toBe("Cached World");

    // Nonexistent chat safety
    expect(getCachedMessages("nonexistent")).toBe(null);
    expect(getCachedMessages(null)).toBe(null);
  });

  test("clearAllChattCache purges all chatt cache keys cleanly", () => {
    setCachedChats(mockUserId, [{ _id: "c1" }]);
    setCachedPreviews(mockUserId, { c1: "test" });
    setCachedMessages(mockChatId, [{ _id: "m1" }]);

    clearAllChattCache();

    expect(getCachedChats(mockUserId)).toBe(null);
    expect(getCachedPreviews(mockUserId)).toEqual({});
    expect(getCachedMessages(mockChatId)).toBe(null);
  });
});

describe("Skeleton Loading Screens Component Suite", () => {
  test("renders upgraded ChatLoading conversation skeletons without crashing", () => {
    const { container } = render(
      <ChakraProvider>
        <ChatLoading count={5} />
      </ChakraProvider>
    );

    // Should render 5 chat card skeletons
    expect(container.querySelectorAll(".chakra-skeleton").length).toBeGreaterThanOrEqual(10);
  });

  test("renders realistic MessageLoading thread skeletons without crashing", () => {
    const { container } = render(
      <ChakraProvider>
        <MessageLoading />
      </ChakraProvider>
    );

    // Skeletons representing alternating bubbles and date divider
    expect(container.querySelectorAll(".chakra-skeleton").length).toBeGreaterThan(5);
  });
});

import ServerStatusPill from "./Components/Home/ServerStatusPill";
import InteractivePlayground from "./Components/Home/InteractivePlayground";
import { getBackendEndpoint, triggerServerWarmup } from "./utils/serverWarmup";

describe("Render Cold-Start Warmup & Interactive Playground Suite", () => {
  test("getBackendEndpoint returns valid URL string under test environments", () => {
    const endpoint = getBackendEndpoint();
    expect(typeof endpoint).toBe("string");
    expect(endpoint.length).toBeGreaterThan(0);
  });

  test("renders ServerStatusPill component and displays status", () => {
    render(
      <ChakraProvider>
        <ServerStatusPill isDark={false} />
      </ChakraProvider>
    );

    expect(screen.getByText(/BACKEND|CONNECTING|STANDBY/i)).toBeInTheDocument();
  });

  test("renders InteractivePlayground with Live Chat, E2EE Cipher, Audio Wave, and Speed Type tabs", () => {
    render(
      <ChakraProvider>
        <InteractivePlayground isDark={false} />
      </ChakraProvider>
    );

    expect(screen.getByRole("tab", { name: /Live Chat/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /E2EE Cipher/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Audio Wave/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Speed Type/i })).toBeInTheDocument();
  });

  test("can switch to E2EE Cipher tab in playground", () => {
    render(
      <ChakraProvider>
        <InteractivePlayground isDark={false} />
      </ChakraProvider>
    );

    const cipherTab = screen.getByRole("tab", { name: /E2EE Cipher/i });
    fireEvent.click(cipherTab);

    expect(screen.getByText(/AES-256-GCM CIPHERTEXT/i)).toBeInTheDocument();
  });
});


