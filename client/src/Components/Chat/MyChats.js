import React, { useEffect, useState, useMemo, useRef } from "react";
import { ChatState } from "../../Context/ChatProvider";
import axios from "axios";
import {
  Box,
  Button,
  useToast,
  Stack,
  Text,
  Heading,
  Avatar,
  AvatarBadge,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Badge,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@chakra-ui/react";
import { AddIcon, CloseIcon } from "@chakra-ui/icons";
import ChatLoading from "./ChatLoading";
import { getSender, getSenderFull, formatMessageTime } from "../../config/ChatLogics";
import { decryptText } from "../../config/cryptoLogics";
import {
  getCachedChats,
  setCachedChats,
  getCachedPreviews,
  setCachedPreviews,
} from "../../utils/cacheUtils";
import GroupChatModal from "../Miscellaneous/GroupChatModal.js";

// Helper component to highlight search queries in results
const HighlightMatch = ({ text, query }) => {
  const { isDark } = ChatState() || {};
  if (!query || !query.trim() || !text) return <>{text}</>;
  const cleanQ = query.trim();
  const regex = new RegExp(`(${cleanQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = String(text).split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <Box
            as="mark"
            key={i}
            bg={isDark ? "blue.900" : "#fef3c7"}
            color={isDark ? "blue.200" : "#78350f"}
            px={0.5}
            borderRadius="sm"
            fontWeight="inherit"
          >
            {part}
          </Box>
        ) : (
          part
        )
      )}
    </>
  );
};

const MyChats = ({ fetchAgain }) => {
  const toast = useToast();
  const [loggedUser, setLoggedUser] = useState(null);
  const [decryptedPreviews, setDecryptedPreviews] = useState({});
  const [filterQuery, setFilterQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // "all" | "direct" | "groups" | "online" | "unread" | "voice" | "files"
  const [sortBy, setSortBy] = useState("recent"); // "recent" | "unread" | "online" | "name"
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filterInputRef = useRef(null);

  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform?.toUpperCase().indexOf("MAC") >= 0;

  const {
    selectedChat,
    setSelectedChat,
    user,
    chats,
    setChats,
    onlineUsers,
    notification,
    isDark,
  } = ChatState();

  const fetchChats = async () => {
    if (!user || !user.token) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
      if (user._id) {
        setCachedChats(user._id, data);
      }

      // Decrypt latest message preview text for each chat
      const previews = {};
      await Promise.all(
        data.map(async (chat) => {
          if (chat.latestMessage && chat.latestMessage.content) {
            previews[chat._id] = await decryptText(
              chat.latestMessage.content,
              chat._id
            );
          }
        })
      );
      setDecryptedPreviews(previews);
      if (user._id) {
        setCachedPreviews(user._id, previews);
      }
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load chats",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      setLoggedUser(userInfo);
      if (userInfo && userInfo._id) {
        // Stale-While-Revalidate: load cached chats immediately for 0ms initial paint
        const cached = getCachedChats(userInfo._id);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setChats(cached);
        }
        const cachedPrev = getCachedPreviews(userInfo._id);
        if (cachedPrev && Object.keys(cachedPrev).length > 0) {
          setDecryptedPreviews(cachedPrev);
        }
      }
    } catch (e) {}
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  // Global Cmd+F / Ctrl+F shortcut to jump to conversation filter
  useEffect(() => {
    const handleGlobalF = (e) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = ["INPUT", "TEXTAREA"].includes(activeTag);

      if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F") && !isTyping) {
        e.preventDefault();
        filterInputRef.current?.focus();
        filterInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleGlobalF);
    return () => window.removeEventListener("keydown", handleGlobalF);
  }, []);

  // Compute live tab counts
  const counts = useMemo(() => {
    if (!chats || !Array.isArray(chats)) {
      return { all: 0, direct: 0, groups: 0, online: 0, unread: 0, voice: 0, files: 0 };
    }
    const direct = chats.filter((c) => !c.isGroupChat).length;
    const groups = chats.filter((c) => c.isGroupChat).length;
    const online = chats.filter((c) => {
      if (c.isGroupChat) return false;
      const partner = getSenderFull(loggedUser, c.users);
      return partner?._id && onlineUsers?.includes(partner._id);
    }).length;
    const unread = chats.filter((c) =>
      notification?.some((n) => n.chat?._id === c._id)
    ).length;
    const voice = chats.filter((c) => c.latestMessage?.fileType === "audio").length;
    const files = chats.filter(
      (c) => c.latestMessage?.fileUrl && c.latestMessage?.fileType !== "audio"
    ).length;

    return {
      all: chats.length,
      direct,
      groups,
      online,
      unread,
      voice,
      files,
    };
  }, [chats, notification, onlineUsers, loggedUser]);

  // Filtered & Sorted chats based on active tab, search query, and sort mode
  const displayedChats = useMemo(() => {
    if (!chats || !Array.isArray(chats)) return [];

    // 1. Filter
    const filtered = chats.filter((chat) => {
      const partner = !chat.isGroupChat ? getSenderFull(loggedUser, chat.users) : null;
      const isOnline = partner?._id && onlineUsers?.includes(partner._id);
      const isVoice = chat.latestMessage?.fileType === "audio";
      const isFile = !!(chat.latestMessage?.fileUrl && chat.latestMessage?.fileType !== "audio");
      const hasUnread = notification?.some((n) => n.chat?._id === chat._id);

      // Filter Tab Check
      if (filterTab === "direct" && chat.isGroupChat) return false;
      if (filterTab === "groups" && !chat.isGroupChat) return false;
      if (filterTab === "online" && !isOnline) return false;
      if (filterTab === "unread" && !hasUnread) return false;
      if (filterTab === "voice" && !isVoice) return false;
      if (filterTab === "files" && !isFile) return false;

      // Query String Check (matches name, email, or message preview)
      if (!filterQuery.trim()) return true;
      const q = filterQuery.trim().toLowerCase();

      const name = !chat.isGroupChat
        ? getSender(loggedUser, chat.users)
        : chat.chatName;
      const email = partner?.email || "";
      const latest =
        decryptedPreviews[chat._id] || chat.latestMessage?.content || "";

      return (
        (name || "").toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        latest.toLowerCase().includes(q)
      );
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortBy === "unread") {
        const unreadA = notification?.filter((n) => n.chat?._id === a._id).length || 0;
        const unreadB = notification?.filter((n) => n.chat?._id === b._id).length || 0;
        if (unreadA !== unreadB) return unreadB - unreadA;
      } else if (sortBy === "online") {
        const partnerA = !a.isGroupChat ? getSenderFull(loggedUser, a.users) : null;
        const partnerB = !b.isGroupChat ? getSenderFull(loggedUser, b.users) : null;
        const onlineA = partnerA?._id && onlineUsers?.includes(partnerA._id) ? 1 : 0;
        const onlineB = partnerB?._id && onlineUsers?.includes(partnerB._id) ? 1 : 0;
        if (onlineA !== onlineB) return onlineB - onlineA;
      } else if (sortBy === "name") {
        const nameA = (!a.isGroupChat ? getSender(loggedUser, a.users) : a.chatName) || "";
        const nameB = (!b.isGroupChat ? getSender(loggedUser, b.users) : b.chatName) || "";
        return nameA.localeCompare(nameB);
      }
      // default: recent activity
      const timeA = new Date(a.latestMessage?.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.latestMessage?.createdAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [chats, filterTab, filterQuery, sortBy, loggedUser, notification, onlineUsers, decryptedPreviews]);

  // Keyboard navigation within the filtered chat list
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (displayedChats.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % displayedChats.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (displayedChats.length > 0) {
        setSelectedIndex(
          (prev) => (prev - 1 + displayedChats.length) % displayedChats.length
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (displayedChats.length > 0 && displayedChats[selectedIndex]) {
        setSelectedChat(displayedChats[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      if (filterQuery) {
        setFilterQuery("");
        setSelectedIndex(0);
      }
    }
  };

  // Auto scroll highlighted chat into view
  useEffect(() => {
    if (displayedChats.length > 0) {
      const activeCard = document.getElementById(`chat-card-${selectedIndex}`);
      if (activeCard) {
        activeCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, displayedChats.length]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      p={{ base: 3, md: 4 }}
      bg={isDark ? "gray.900" : "white"}
      w={{ base: "100%", md: "34%", lg: "30%" }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={isDark ? "gray.800" : "gray.200"}
      boxShadow="sm"
      h="100%"
      overflow="hidden"
    >
      {/* Top Header: Title & Action Controls */}
      <Box
        pb={3}
        px={1}
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        borderBottom="1px solid"
        borderColor={isDark ? "gray.800" : "gray.100"}
      >
        <HStack spacing={2.5} align="center">
          <Heading
            as="h2"
            fontSize={{ base: "lg", lg: "xl" }}
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            letterSpacing="-0.02em"
            color={isDark ? "white" : "gray.900"}
          >
            Chats
          </Heading>
          {counts.all > 0 && (
            <Badge
              colorScheme="blue"
              variant="subtle"
              borderRadius="full"
              px={2.5}
              py={0.5}
              fontSize="11px"
              fontWeight="700"
            >
              {counts.all}
            </Badge>
          )}
          {counts.online > 0 && (
            <Tooltip label={`${counts.online} friend(s) active now`} hasArrow>
              <Badge
                colorScheme="green"
                variant="subtle"
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="10px"
                fontWeight="700"
                display="flex"
                alignItems="center"
                gap={1}
                cursor="pointer"
                onClick={() => setFilterTab("online")}
              >
                <Box as="span" className="online-dot" boxSize="5px" />
                {counts.online} Online
              </Badge>
            </Tooltip>
          )}
        </HStack>

        <HStack spacing={1.5}>
          {selectedChat && (
            <Tooltip label="Close active conversation (Esc)" hasArrow>
              <Button
                size="sm"
                variant="ghost"
                color="gray.600"
                _hover={{ bg: "red.50", color: "red.500" }}
                borderRadius="xl"
                fontSize="11px"
                fontWeight="600"
                onClick={() => setSelectedChat(null)}
                leftIcon={<CloseIcon boxSize="7px" />}
                px={2.5}
                aria-label="Close active chat"
              >
                Close Chat
              </Button>
            </Tooltip>
          )}

          <GroupChatModal>
            <Button
              size="sm"
              colorScheme="blue"
              bg="blue.600"
              _hover={{ bg: "blue.700" }}
              variant="solid"
              borderRadius="xl"
              fontSize="12px"
              fontWeight="600"
              rightIcon={<AddIcon boxSize="9px" />}
              boxShadow="sm"
              aria-label="Create New Group Chat"
              px={3}
            >
              New Group
            </Button>
          </GroupChatModal>
        </HStack>
      </Box>

      {/* Interactive Search & Sort Bar */}
      <Box pt={3} pb={2}>
        <HStack spacing={2}>
          <InputGroup size="sm" flex="1">
            <InputLeftElement pointerEvents="none" color="gray.400">
              <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "11px", color: "#2563eb" }}></i>
            </InputLeftElement>
            <Input
              ref={filterInputRef}
              placeholder={`Filter chats... (${isMac ? "⌘F" : "Ctrl+F"})`}
              value={filterQuery}
              onChange={(e) => {
                setFilterQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              borderRadius="xl"
              bg={isDark ? "gray.800" : "gray.50"}
              color={isDark ? "white" : "gray.900"}
              borderWidth="1px"
              borderColor={isDark ? "gray.700" : "gray.200"}
              _focus={{ bg: isDark ? "gray.800" : "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3b82f6" }}
              fontSize="xs"
              aria-label="Filter conversations"
              pr={filterQuery ? "32px" : "12px"}
            />
            {filterQuery && (
              <InputRightElement width="32px">
                <IconButton
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  icon={<CloseIcon boxSize="8px" />}
                  onClick={() => {
                    setFilterQuery("");
                    setSelectedIndex(0);
                    filterInputRef.current?.focus();
                  }}
                  aria-label="Clear filter"
                />
              </InputRightElement>
            )}
          </InputGroup>

          {/* Sort & Organize Menu */}
          <Menu>
            <Tooltip label="Sort conversations" hasArrow>
              <MenuButton
                as={IconButton}
                size="sm"
                variant="outline"
                borderColor="gray.200"
                borderRadius="xl"
                bg={sortBy !== "recent" ? "blue.50" : "white"}
                color={sortBy !== "recent" ? "blue.600" : "gray.600"}
                icon={<i className="fa-solid fa-arrow-down-short-wide" style={{ fontSize: "11px" }}></i>}
                aria-label="Sort Options"
              />
            </Tooltip>
            <MenuList p={1.5} borderRadius="xl" boxShadow="2xl" fontSize="xs">
              <Text px={3} py={1} fontSize="10px" fontWeight="700" color="gray.400" textTransform="uppercase">
                Sort Conversations
              </Text>
              <MenuItem
                borderRadius="lg"
                fontWeight={sortBy === "recent" ? "700" : "500"}
                color={sortBy === "recent" ? "blue.600" : "gray.700"}
                onClick={() => setSortBy("recent")}
                icon={<i className="fa-solid fa-clock"></i>}
              >
                Recent Activity {sortBy === "recent" && "✓"}
              </MenuItem>
              <MenuItem
                borderRadius="lg"
                fontWeight={sortBy === "unread" ? "700" : "500"}
                color={sortBy === "unread" ? "blue.600" : "gray.700"}
                onClick={() => setSortBy("unread")}
                icon={<i className="fa-solid fa-envelope-open-text"></i>}
              >
                Unread First {sortBy === "unread" && "✓"}
              </MenuItem>
              <MenuItem
                borderRadius="lg"
                fontWeight={sortBy === "online" ? "700" : "500"}
                color={sortBy === "online" ? "blue.600" : "gray.700"}
                onClick={() => setSortBy("online")}
                icon={<i className="fa-solid fa-circle-dot" style={{ color: "#22c55e" }}></i>}
              >
                Online Friends First {sortBy === "online" && "✓"}
              </MenuItem>
              <MenuItem
                borderRadius="lg"
                fontWeight={sortBy === "name" ? "700" : "500"}
                color={sortBy === "name" ? "blue.600" : "gray.700"}
                onClick={() => setSortBy("name")}
                icon={<i className="fa-solid fa-arrow-down-a-z"></i>}
              >
                Alphabetical (A-Z) {sortBy === "name" && "✓"}
              </MenuItem>
              {sortBy !== "recent" && (
                <>
                  <MenuDivider my={1} />
                  <MenuItem
                    borderRadius="lg"
                    color="red.500"
                    onClick={() => setSortBy("recent")}
                    icon={<i className="fa-solid fa-rotate-left"></i>}
                  >
                    Reset to Default Sort
                  </MenuItem>
                </>
              )}
            </MenuList>
          </Menu>
        </HStack>
      </Box>

      {/* Happening & Interactive Category Pills */}
      <Box
        pb={2}
        overflowX="auto"
        sx={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <HStack spacing={1.5} py={0.5}>
          {[
            { key: "all", label: "All", count: counts.all, icon: "fa-solid fa-comments" },
            { key: "direct", label: "Direct", count: counts.direct, icon: "fa-solid fa-user" },
            { key: "groups", label: "Groups", count: counts.groups, icon: "fa-solid fa-users" },
            {
              key: "online",
              label: "Online",
              count: counts.online,
              icon: "fa-solid fa-circle",
              iconColor: "#22c55e",
            },
            {
              key: "unread",
              label: "Unread",
              count: counts.unread,
              icon: "fa-solid fa-bell",
              highlight: counts.unread > 0,
            },
            { key: "voice", label: "Voice", count: counts.voice, icon: "fa-solid fa-microphone" },
            { key: "files", label: "Files", count: counts.files, icon: "fa-solid fa-paperclip" },
          ].map((tab) => {
            const isActive = filterTab === tab.key;
            return (
              <Button
                key={tab.key}
                size="xs"
                variant={isActive ? "solid" : "outline"}
                colorScheme={isActive ? "blue" : "gray"}
                bg={isActive ? "blue.600" : isDark ? "gray.800" : "white"}
                borderColor={isActive ? "blue.600" : isDark ? "gray.700" : "gray.200"}
                color={isActive ? "white" : isDark ? "gray.200" : "gray.700"}
                _hover={{
                  bg: isActive ? "blue.700" : isDark ? "gray.700" : "gray.50",
                  borderColor: isActive ? "blue.700" : isDark ? "gray.600" : "gray.300",
                }}
                borderRadius="full"
                px={2.5}
                py={1}
                fontSize="11px"
                fontWeight="600"
                onClick={() => {
                  setFilterTab(tab.key);
                  setSelectedIndex(0);
                }}
                flexShrink={0}
              >
                <i
                  className={tab.icon}
                  style={{
                    fontSize: "9px",
                    marginRight: "4px",
                    color: isActive ? "white" : tab.iconColor || "inherit",
                  }}
                ></i>
                {tab.label}
                {tab.count > 0 && (
                  <Badge
                    ml={1.5}
                    fontSize="9px"
                    borderRadius="full"
                    px={1.5}
                    colorScheme={tab.highlight ? "red" : isActive ? "whiteAlpha" : "gray"}
                    variant="solid"
                    bg={
                      tab.highlight
                        ? "red.500"
                        : isActive
                        ? "whiteAlpha.300"
                        : isDark
                        ? "gray.700"
                        : "gray.100"
                    }
                    color={
                      tab.highlight || isActive
                        ? "white"
                        : isDark
                        ? "gray.200"
                        : "gray.700"
                    }
                    borderWidth="1px"
                    borderColor={
                      tab.highlight
                        ? "red.500"
                        : isActive
                        ? "whiteAlpha.400"
                        : isDark
                        ? "gray.600"
                        : "gray.300"
                    }
                  >
                    {tab.count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </HStack>
      </Box>

      {/* Filter Status / Reset Tag */}
      {(filterQuery || filterTab !== "all" || sortBy !== "recent") && (
        <HStack
          justify="space-between"
          align="center"
          px={2}
          py={1}
          mb={1.5}
          bg="blue.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="blue.100"
          fontSize="11px"
        >
          <HStack spacing={1.5} color="blue.700" fontWeight="600">
            <i className="fa-solid fa-filter" style={{ fontSize: "9px" }}></i>
            <Text>
              Showing {displayedChats.length} {displayedChats.length === 1 ? "chat" : "chats"}
              {filterTab !== "all" ? ` in ${filterTab}` : ""}
            </Text>
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="blue"
            fontSize="10px"
            h="20px"
            px={1.5}
            onClick={() => {
              setFilterQuery("");
              setFilterTab("all");
              setSortBy("recent");
              setSelectedIndex(0);
            }}
          >
            Reset
          </Button>
        </HStack>
      )}

      {/* Conversation Cards List */}
      <Box
        display="flex"
        flexDir="column"
        pt={1}
        w="100%"
        flex="1"
        overflowY="hidden"
      >
        {chats ? (
          <Stack
            overflowY="auto"
            spacing={1.5}
            pr={1}
            flex="1"
            sx={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            {displayedChats.length === 0 && (
              <Box textAlign="center" py={12} px={4} color="gray.500">
                <Box color="gray.300" mb={2}>
                  <i className="fa-solid fa-comments" style={{ fontSize: "36px" }}></i>
                </Box>
                <Text fontWeight="700" color="gray.800" fontSize="sm">
                  {filterQuery
                    ? `No chats matching "${filterQuery}"`
                    : filterTab === "online"
                    ? "None of your contacts are online"
                    : filterTab === "unread"
                    ? "No unread messages"
                    : filterTab === "voice"
                    ? "No voice notes found"
                    : filterTab === "files"
                    ? "No file attachments found"
                    : "No conversations yet"}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1} maxW="260px" mx="auto">
                  {filterQuery
                    ? "Try adjusting your search terms or reset the filters."
                    : "Search contacts (⌘K) to start a new message right away!"}
                </Text>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  borderRadius="full"
                  mt={3}
                  onClick={() => {
                    setFilterQuery("");
                    setFilterTab("all");
                    setSortBy("recent");
                  }}
                >
                  Show All Chats
                </Button>
              </Box>
            )}

            {displayedChats.map((chat, index) => {
              const isSelected = selectedChat?._id === chat._id;
              const isNavActive = index === selectedIndex && !isSelected;
              const senderUser = !chat.isGroupChat
                ? getSenderFull(loggedUser, chat.users)
                : null;
              const isOnline = senderUser?._id && onlineUsers?.includes(senderUser._id);

              const unreadInChat = notification?.filter(
                (n) => n.chat?._id === chat._id
              ).length;

              const previewText =
                decryptedPreviews[chat._id] ||
                chat.latestMessage?.content ||
                "";

              const chatTitle = !chat.isGroupChat
                ? getSender(loggedUser, chat.users)
                : chat.chatName;

              return (
                <Box
                  id={`chat-card-${index}`}
                  key={chat._id}
                  onClick={() => setSelectedChat(isSelected ? null : chat)}
                  cursor="pointer"
                  bg={
                    isSelected
                      ? isDark
                        ? "#1e293b"
                        : "#eff6ff"
                      : isNavActive
                      ? isDark
                        ? "#1a2436"
                        : "#f8fafc"
                      : isDark
                      ? "#111827"
                      : "#ffffff"
                  }
                  color={isDark ? "#f3f4f6" : "#1e293b"}
                  px={3}
                  py={2.5}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={
                    isSelected
                      ? isDark
                        ? "#3b82f6"
                        : "#bfdbfe"
                      : isNavActive
                      ? isDark
                        ? "#475569"
                        : "#cbd5e1"
                      : isDark
                      ? "#1f2937"
                      : "#e2e8f0"
                  }
                  borderLeftWidth={isSelected ? "4px" : "1px"}
                  borderLeftColor={
                    isSelected
                      ? isDark
                        ? "#60a5fa"
                        : "#2563eb"
                      : isNavActive
                      ? isDark
                        ? "#475569"
                        : "#94a3b8"
                      : isDark
                      ? "#1f2937"
                      : "#e2e8f0"
                  }
                  boxShadow={
                    isSelected
                      ? isDark
                        ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                        : "0 2px 6px rgba(37, 99, 235, 0.08)"
                      : "none"
                  }
                  _hover={{
                    bg: isSelected
                      ? isDark
                        ? "#243248"
                        : "#e5edff"
                      : isDark
                      ? "#182234"
                      : "#f8fafc",
                    borderColor: isSelected
                      ? isDark
                        ? "#60a5fa"
                        : "#93c5fd"
                      : isDark
                      ? "#374151"
                      : "#cbd5e1",
                    transform: "translateX(2px)",
                  }}
                  _active={{
                    bg: isDark ? "#1e293b" : "#e0edff",
                  }}
                  transition="all 0.15s ease"
                  role="option"
                  tabIndex={0}
                  aria-selected={isSelected}
                >
                  <HStack spacing={3} align="center">
                    {chat.isGroupChat ? (
                      <Box
                        w="38px"
                        h="38px"
                        borderRadius="xl"
                        bg={isSelected ? (isDark ? "blue.800" : "blue.100") : isDark ? "#1f2937" : "#f1f5f9"}
                        color={isSelected ? (isDark ? "blue.200" : "blue.700") : isDark ? "#94a3b8" : "#64748b"}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="14px"
                        flexShrink={0}
                      >
                        <i className="fa-solid fa-users"></i>
                      </Box>
                    ) : (
                      <Avatar
                        size="sm"
                        name={chatTitle}
                        src={senderUser?.pic}
                        flexShrink={0}
                        boxShadow="xs"
                      >
                        <AvatarBadge
                          boxSize="1em"
                          bg={isOnline ? "green.500" : "gray.400"}
                          borderColor={isDark ? "#111827" : "#ffffff"}
                        />
                      </Avatar>
                    )}

                    <Box flex="1" overflow="hidden">
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Text
                          fontWeight={isSelected || unreadInChat > 0 ? "700" : "600"}
                          fontSize="sm"
                          isTruncated
                          color={
                            isSelected
                              ? isDark
                                ? "#93c5fd"
                                : "#1d4ed8"
                              : isDark
                              ? "#f3f4f6"
                              : "#0f172a"
                          }
                        >
                          <HighlightMatch text={chatTitle} query={filterQuery} />
                        </Text>
                        <HStack spacing={1.5} flexShrink={0} ml={2} align="center">
                          {isSelected && (
                            <Badge
                              colorScheme="blue"
                              variant="subtle"
                              borderRadius="full"
                              px={1.5}
                              py={0.2}
                              fontSize="9px"
                              fontWeight="700"
                            >
                              Open
                            </Badge>
                          )}
                          {chat.latestMessage && (
                            <Text
                              fontSize="10px"
                              color={
                                unreadInChat > 0
                                  ? isDark
                                    ? "#60a5fa"
                                    : "#2563eb"
                                  : isDark
                                  ? "#94a3b8"
                                  : "#64748b"
                              }
                              fontWeight={unreadInChat > 0 ? "700" : "500"}
                            >
                              {formatMessageTime(chat.latestMessage.createdAt)}
                            </Text>
                          )}
                        </HStack>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        {chat.latestMessage ? (
                          <Text
                            fontSize="xs"
                            isTruncated
                            color={
                              isSelected
                                ? isDark
                                  ? "#cbd5e1"
                                  : "#334155"
                                : unreadInChat > 0
                                ? isDark
                                  ? "#e2e8f0"
                                  : "#1e293b"
                                : isDark
                                ? "#9ca3af"
                                : "#64748b"
                            }
                            fontWeight={unreadInChat > 0 ? "600" : "400"}
                            maxW="82%"
                          >
                            <span style={{ fontWeight: 600 }}>
                              {chat.latestMessage.sender?._id === user?._id
                                ? "You: "
                                : `${chat.latestMessage.sender?.name?.split(" ")[0] || "User"}: `}
                            </span>
                            {chat.latestMessage.fileType === "audio" ? (
                              <HStack as="span" spacing={1} display="inline-flex" alignItems="center">
                                <i className="fa-solid fa-microphone" style={{ fontSize: "10px", color: "#2563eb" }}></i>
                                <span>Voice note</span>
                              </HStack>
                            ) : chat.latestMessage.fileUrl && !previewText ? (
                              <HStack as="span" spacing={1} display="inline-flex" alignItems="center">
                                <i className="fa-solid fa-paperclip" style={{ fontSize: "10px", color: "#2563eb" }}></i>
                                <span>Attachment</span>
                              </HStack>
                            ) : (
                              <HighlightMatch text={previewText} query={filterQuery} />
                            )}
                          </Text>
                        ) : (
                          <Text
                            fontSize="xs"
                            fontStyle="italic"
                            color={isSelected ? (isDark ? "blue.300" : "blue.600") : isDark ? "gray.500" : "gray.400"}
                          >
                            Start the conversation...
                          </Text>
                        )}

                        {unreadInChat > 0 && (
                          <Badge
                            bg="red.500"
                            color="white"
                            borderRadius="full"
                            fontSize="9px"
                            fontWeight="800"
                            px={1.5}
                            py={0.5}
                            boxShadow="0 2px 4px rgba(239, 68, 68, 0.3)"
                          >
                            {unreadInChat}
                          </Badge>
                        )}
                      </Box>
                    </Box>
                  </HStack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;