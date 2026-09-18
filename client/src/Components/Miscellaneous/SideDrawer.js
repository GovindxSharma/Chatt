import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Button,
  Tooltip,
  Text,
  Menu,
  MenuButton,
  Avatar,
  AvatarBadge,
  MenuList,
  MenuItem,
  MenuDivider,
  Input,
  Spinner,
  IconButton,
  HStack,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Kbd,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon, CloseIcon } from "@chakra-ui/icons";
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import GroupChatModal from "./GroupChatModal";
import ChatLoading from "../Chat/ChatLoading.js";
import UserListItem from "../UserAvatar/UserListItem.js";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { getSender, getSenderFull } from "../../config/ChatLogics";
import { clearAllChattCache } from "../../utils/cacheUtils";
import "./notification.css";

const SideDrawer = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "people" | "chats" | "actions"
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem("chatt_recent_searches");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const searchInputRef = useRef(null);

  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform?.toUpperCase().indexOf("MAC") >= 0;

  // Disclosures
  const {
    isOpen: isProfileOpen,
    onOpen: onProfileOpen,
    onClose: onProfileClose,
  } = useDisclosure();

  const {
    isOpen: isLogoutOpen,
    onOpen: onLogoutOpen,
    onClose: onLogoutClose,
  } = useDisclosure();

  const {
    isOpen: isGroupOpen,
    onOpen: onGroupOpen,
    onClose: onGroupClose,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    user,
    setUser,
    selectedChat,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
    onlineUsers,
    soundEnabled,
    toggleSound,
    isDark,
    toggleTheme,
  } = ChatState();

  // Save term to recent searches
  const recordSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((t) => t.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem("chatt_recent_searches", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const removeRecentSearch = (termToRemove, e) => {
    if (e) e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t !== termToRemove);
      try {
        localStorage.setItem("chatt_recent_searches", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("chatt_recent_searches");
    } catch (e) {}
  };

  // Open Search with focus
  const handleOpenSearch = () => {
    setSearch("");
    setSearchResult([]);
    setActiveFilter("all");
    setSelectedIndex(0);
    onOpen();
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);
  };

  // Global keyboard shortcuts (Cmd+K / Ctrl+K, and '/')
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = ["INPUT", "TEXTAREA"].includes(activeTag);

      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          handleOpenSearch();
        }
      } else if (e.key === "/" && !isTyping && !isOpen) {
        e.preventDefault();
        handleOpenSearch();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onOpen, onClose]);

  // Live debounced search (250ms) for server users
  useEffect(() => {
    if (!isOpen) return;
    if (!search || !search.trim()) {
      setSearchResult([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (!user?.token) return;
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.get(
          `/api/user?search=${encodeURIComponent(search.trim())}`,
          config
        );
        setSearchResult(data || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error.message);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, user?.token, isOpen]);

  // Quick action commands list
  const actionsList = useMemo(() => [
    {
      id: "action-group",
      title: "Create New Group Chat",
      description: "Start a group conversation with multiple team members",
      icon: "fa-solid fa-users",
      iconBg: isDark ? "blue.900" : "blue.50",
      iconColor: isDark ? "blue.300" : "blue.600",
      badge: "Command",
      badgeColor: "blue",
      keywords: ["group", "channel", "team", "new", "create"],
      onSelect: () => {
        onClose();
        onGroupOpen();
      },
    },
    {
      id: "action-profile",
      title: "My Profile Settings",
      description: "View and edit your personal profile and avatar",
      icon: "fa-solid fa-circle-user",
      iconBg: isDark ? "purple.900" : "purple.50",
      iconColor: isDark ? "purple.300" : "purple.600",
      badge: "Account",
      badgeColor: "purple",
      keywords: ["profile", "me", "account", "status", "bio", "pic", "settings"],
      onSelect: () => {
        onClose();
        onProfileOpen();
      },
    },
    {
      id: "action-sound",
      title: soundEnabled ? "Mute Message Chimes" : "Enable Message Chimes",
      description: soundEnabled
        ? "Turn off audio chimes for incoming messages"
        : "Play subtle audio chimes when messages arrive",
      icon: soundEnabled ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high",
      iconBg: isDark ? (soundEnabled ? "orange.900" : "green.900") : (soundEnabled ? "orange.50" : "green.50"),
      iconColor: isDark ? (soundEnabled ? "orange.300" : "green.300") : (soundEnabled ? "orange.600" : "green.600"),
      badge: "Audio",
      badgeColor: soundEnabled ? "orange" : "green",
      keywords: ["sound", "audio", "mute", "unmute", "volume", "notification", "bell"],
      onSelect: () => {
        toggleSound();
        toast({
          title: soundEnabled ? "Message Chimes Muted" : "Message Chimes Enabled",
          status: "info",
          duration: 1800,
          isClosable: true,
        });
      },
    },
    {
      id: "action-theme",
      title: isDark ? "Switch to Light Mode" : "Switch to Dark Mode",
      description: isDark
        ? "Switch interface to clean daylight mode"
        : "Switch interface to sleek eye-friendly dark mode",
      icon: isDark ? "fa-solid fa-sun" : "fa-solid fa-moon",
      iconBg: isDark ? "yellow.900" : "purple.100",
      iconColor: isDark ? "yellow.300" : "purple.700",
      badge: "Theme",
      badgeColor: isDark ? "yellow" : "purple",
      keywords: ["theme", "dark", "light", "mode", "color", "appearance", "night", "day"],
      onSelect: () => {
        toggleTheme();
        onClose();
        toast({
          title: isDark ? "Switched to Light Mode" : "Switched to Dark Mode",
          status: "success",
          duration: 1800,
          isClosable: true,
        });
      },
    },
    {
      id: "action-cache",
      title: "Clear Local Cache & Refresh",
      description: "Purge locally cached chats and messages to reload fresh state",
      icon: "fa-solid fa-rotate",
      iconBg: isDark ? "teal.900" : "teal.50",
      iconColor: isDark ? "teal.300" : "teal.600",
      badge: "Cache",
      badgeColor: "teal",
      keywords: ["clear", "cache", "clean", "reset", "refresh", "purge", "reload"],
      onSelect: () => {
        clearAllChattCache();
        onClose();
        toast({
          title: "Local Cache Purged",
          description: "Fresh state reloaded from server",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      },
    },
    {
      id: "action-logout",
      title: "Sign Out of Chatt",
      description: "Log out of your account on this device",
      icon: "fa-solid fa-right-from-bracket",
      iconColor: "red.600",
      badge: "System",
      badgeColor: "red",
      keywords: ["logout", "sign out", "exit", "leave", "disconnect"],
      onSelect: () => {
        onClose();
        onLogoutOpen();
      },
    },
    ...(selectedChat
      ? [
          {
            id: "action-close-chat",
            title: "Close Active Chat",
            description: "Deselect the current conversation and return to the home overview",
            icon: "fa-solid fa-xmark",
            iconBg: "gray.100",
            iconColor: "gray.700",
            badge: "View",
            badgeColor: "gray",
            keywords: ["close", "exit", "clear", "back", "deselect", "leave", "esc"],
            onSelect: () => {
              setSelectedChat(null);
              onClose();
            },
          },
        ]
      : []),
  ], [soundEnabled, toggleSound, isDark, toggleTheme, toast, onClose, onGroupOpen, onProfileOpen, onLogoutOpen, selectedChat, setSelectedChat]);

  // Matching existing chats & groups
  const matchingChats = useMemo(() => {
    if (!chats || !Array.isArray(chats)) return [];
    const query = search.trim().toLowerCase();
    if (!query) {
      return chats.slice(0, 4); // show recent 4 chats when empty
    }
    return chats.filter((c) => {
      if (c.isGroupChat) {
        return c.chatName?.toLowerCase().includes(query);
      }
      const partner = getSenderFull(user, c.users);
      return (
        partner?.name?.toLowerCase().includes(query) ||
        partner?.email?.toLowerCase().includes(query)
      );
    });
  }, [chats, search, user]);

  // Matching actions
  const matchingActions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return actionsList;
    return actionsList.filter((act) => {
      return (
        act.title.toLowerCase().includes(query) ||
        act.description.toLowerCase().includes(query) ||
        act.keywords.some((k) => k.includes(query))
      );
    });
  }, [actionsList, search]);

  // Access or create chat
  const accessChat = async (userId, searchKeyword) => {
    if (searchKeyword) recordSearch(searchKeyword);
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post("/api/chat", { userId }, config);

      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }

      setSelectedChat(data);
      setLoadingChat(false);
      onClose();
    } catch (error) {
      setLoadingChat(false);
      toast({
        title: "Error Fetching Chat",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const handleSelectExistingChat = (chat, searchKeyword) => {
    if (searchKeyword) recordSearch(searchKeyword);
    setSelectedChat(chat);
    onClose();
  };

  // Build flattened navigable items for smooth Arrow navigation across sections
  const flatItems = useMemo(() => {
    const items = [];
    const isSearching = !!search.trim();

    // 1. Existing Chats
    if (activeFilter === "all" || activeFilter === "chats") {
      matchingChats.forEach((chat) => {
        items.push({
          id: `chat-${chat._id}`,
          type: "chat",
          data: chat,
          onSelect: () => handleSelectExistingChat(chat, search.trim()),
        });
      });
    }

    // 2. People (server search)
    if ((activeFilter === "all" || activeFilter === "people") && isSearching) {
      searchResult.forEach((u) => {
        items.push({
          id: `user-${u._id}`,
          type: "person",
          data: u,
          onSelect: () => accessChat(u._id, search.trim()),
        });
      });
    }

    // 3. Quick Actions
    if (activeFilter === "all" || activeFilter === "actions") {
      matchingActions.forEach((act) => {
        items.push({
          id: act.id,
          type: "action",
          data: act,
          onSelect: act.onSelect,
        });
      });
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingChats, searchResult, matchingActions, activeFilter, search]);

  // Smooth scroll active element into view when selectedIndex changes
  useEffect(() => {
    if (flatItems.length > 0) {
      const activeEl = document.getElementById(`cmd-item-${selectedIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, flatItems.length]);

  // Keep selectedIndex within bounds
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(0);
    }
  }, [flatItems.length, selectedIndex]);

  // Keyboard navigation within the Search Modal
  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        flatItems[selectedIndex].onSelect();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (search) {
        setSearch("");
        setSearchResult([]);
        setSelectedIndex(0);
      } else {
        onClose();
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const filters = ["all", "people", "chats", "actions"];
      const currentIndex = filters.indexOf(activeFilter);
      const nextIndex = e.shiftKey
        ? (currentIndex - 1 + filters.length) % filters.length
        : (currentIndex + 1) % filters.length;
      setActiveFilter(filters[nextIndex]);
      setSelectedIndex(0);
    }
  };

  const confirmLogout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    setSelectedChat(null);
    setChats([]);
    setNotification([]);
    onLogoutClose();
    navigate("/");
    toast({
      title: "Logged Out",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "bottom",
    });
  };

  return (
    <>
      {/* Top Navbar */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg={isDark ? "gray.900" : "white"}
        w="100%"
        p="8px 16px"
        borderBottomWidth="1px"
        borderColor={isDark ? "gray.800" : "gray.200"}
        boxShadow="sm"
        position="relative"
        zIndex={10}
      >
        {/* Command Palette Trigger Button - Highly Responsive */}
        <Tooltip label={`Search Users, Chats, Actions (${isMac ? "⌘K" : "Ctrl+K"})`} hasArrow placement="bottom-start">
          <Button
            variant="outline"
            borderColor={isDark ? "gray.700" : "gray.200"}
            bg={isDark ? "gray.800" : "gray.50"}
            _hover={{ bg: isDark ? "gray.700" : "gray.100", borderColor: isDark ? "gray.600" : "gray.300" }}
            onClick={handleOpenSearch}
            borderRadius="xl"
            size="sm"
            px={{ base: 2.5, sm: 3 }}
            gap={2.5}
            aria-label="Search users and commands"
            minW={{ base: "auto", sm: "160px", md: "200px" }}
            justifyContent="space-between"
          >
            <HStack spacing={2}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: "#2563eb", fontSize: "12px" }}></i>
              <Text fontSize="xs" fontWeight="600" color={isDark ? "gray.300" : "gray.700"}>
                Search...
              </Text>
            </HStack>
            <Kbd
              display={{ base: "none", sm: "inline-flex" }}
              fontSize="10px"
              py={0.5}
              px={1.5}
              bg={isDark ? "gray.700" : "white"}
              borderColor={isDark ? "gray.600" : "gray.300"}
              color={isDark ? "gray.300" : "gray.600"}
              borderRadius="md"
              boxShadow="sm"
            >
              {isMac ? "⌘K" : "Ctrl+K"}
            </Kbd>
          </Button>
        </Tooltip>

        {/* Brand Logo & Status */}
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            w="32px"
            h="32px"
            borderRadius="lg"
            bg="blue.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="sm"
          >
            <i className="fa-solid fa-comments" style={{ color: "white", fontSize: "15px" }}></i>
          </Box>
          <Text
            fontSize={{ base: "lg", md: "2xl" }}
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            letterSpacing="-0.02em"
            color={isDark ? "white" : "gray.900"}
          >
            Chatt
          </Text>
          {onlineUsers?.length > 0 && (
            <Badge
              colorScheme="green"
              variant="subtle"
              borderRadius="full"
              px={2.5}
              py={0.5}
              fontSize="10px"
              fontWeight="700"
              display={{ base: "none", sm: "inline-flex" }}
              alignItems="center"
              gap={1.5}
            >
              <Box as="span" className="online-dot" boxSize="6px" />
              {onlineUsers.length} Online
            </Badge>
          )}
        </Box>

        {/* Action Controls */}
        <HStack spacing={1}>
          {/* Theme Toggle Button (Light/Dark) */}
          <Tooltip
            label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            hasArrow
          >
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="full"
              aria-label="Toggle theme mode"
              icon={
                isDark ? (
                  <i
                    className="fa-solid fa-sun"
                    style={{ color: "#facc15", fontSize: "15px" }}
                  />
                ) : (
                  <i
                    className="fa-solid fa-moon"
                    style={{ color: "#64748b", fontSize: "15px" }}
                  />
                )
              }
              onClick={toggleTheme}
            />
          </Tooltip>

          {/* Sound Toggle Button */}
          <Tooltip
            label={soundEnabled ? "Message chimes enabled (click to mute)" : "Message chimes muted (click to enable)"}
            hasArrow
          >
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="full"
              aria-label="Toggle Message Audio"
              icon={
                <i
                  className={soundEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark"}
                  style={{ color: soundEnabled ? "#2563eb" : "#94a3b8" }}
                ></i>
              }
              onClick={toggleSound}
            />
          </Tooltip>

          {/* Notifications Menu */}
          <Menu>
            <MenuButton
              as={IconButton}
              size="sm"
              variant="ghost"
              borderRadius="full"
              position="relative"
              aria-label="Notifications"
              icon={
                <>
                  <BellIcon fontSize="xl" color="gray.600" />
                  {notification.length > 0 && (
                    <Box
                      position="absolute"
                      top="2px"
                      right="2px"
                      bg="red.500"
                      color="white"
                      borderRadius="full"
                      fontSize="9px"
                      fontWeight="bold"
                      w="16px"
                      h="16px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 0 0 2px white"
                    >
                      {notification.length}
                    </Box>
                  )}
                </>
              }
            />
            <MenuList
              p={2}
              borderRadius="xl"
              boxShadow="2xl"
              minW="280px"
              maxH="320px"
              overflowY="auto"
            >
              <Box
                px={2}
                py={1}
                mb={1}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontWeight="700" fontSize="sm">
                  Notifications
                </Text>
                {notification.length > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => setNotification([])}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
              <MenuDivider my={1} />
              {!notification.length && (
                <Text fontSize="sm" color="gray.500" p={3} textAlign="center">
                  No New Messages
                </Text>
              )}
              {notification.map((noti) => (
                <MenuItem
                  key={noti._id}
                  borderRadius="lg"
                  py={2}
                  onClick={() => {
                    setSelectedChat(noti.chat);
                    setNotification(notification.filter((n) => n._id !== noti._id));
                  }}
                >
                  <Box>
                    <Text fontWeight="600" fontSize="xs">
                      {noti.chat.isGroupChat
                        ? `New in ${noti.chat.chatName}`
                        : `New from ${getSender(user, noti.chat.users)}`}
                    </Text>
                    <Text fontSize="xs" color="gray.500" isTruncated maxW="220px">
                      {noti.content || (noti.fileType === "audio" ? "Voice message" : "Attachment")}
                    </Text>
                  </Box>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* User Profile & Logout Menu */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              p={1}
              borderRadius="full"
              aria-label="User account menu"
              rightIcon={<ChevronDownIcon color="gray.500" />}
            >
              <Avatar
                size="sm"
                cursor="pointer"
                name={user?.name}
                src={user?.pic}
              >
                <AvatarBadge boxSize="1em" bg="green.500" borderColor="white" />
              </Avatar>
            </MenuButton>
            <MenuList borderRadius="xl" boxShadow="2xl" p={2}>
              <Box px={3} py={2}>
                <Text fontWeight="700" fontSize="sm">
                  {user?.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user?.email}
                </Text>
              </Box>
              <MenuDivider my={1} />
              <MenuItem
                borderRadius="lg"
                icon={<i className="fa-solid fa-user"></i>}
                onClick={onProfileOpen}
              >
                My Profile
              </MenuItem>
              <MenuItem
                borderRadius="lg"
                icon={<i className="fa-solid fa-users"></i>}
                onClick={onGroupOpen}
              >
                New Group Chat
              </MenuItem>
              <MenuDivider my={1} />
              <MenuItem
                borderRadius="lg"
                icon={<i className="fa-solid fa-right-from-bracket"></i>}
                color="red.500"
                _hover={{ bg: "red.50" }}
                onClick={onLogoutOpen}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Box>

      {/* Controlled Profile Modal */}
      {user && (
        <ProfileModal
          user={user}
          isOpen={isProfileOpen}
          onClose={onProfileClose}
        />
      )}

      {/* Controlled Group Chat Modal */}
      <GroupChatModal isOpen={isGroupOpen} onClose={onGroupClose} />

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isLogoutOpen} onClose={onLogoutClose} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" mx={4} overflow="hidden">
          <ModalHeader fontSize="lg" fontWeight="700" pt={5} pb={2} textAlign="center">
            <i
              className="fa-solid fa-right-from-bracket"
              style={{ color: "#ef4444", fontSize: "28px", display: "block", marginBottom: "8px" }}
            ></i>
            Log Out of Chatt?
          </ModalHeader>
          <ModalBody textAlign="center" color="gray.600" fontSize="sm" py={2}>
            Are you sure you want to log out? You will need to sign in again to access your messages.
          </ModalBody>
          <ModalFooter display="flex" justifyContent="center" gap={3} pt={4} pb={5}>
            <Button variant="ghost" onClick={onLogoutClose} borderRadius="lg" px={5}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmLogout} borderRadius="lg" px={5}>
              Yes, Log Out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Professional Spotlight Command Palette Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "full", sm: "lg", md: "2xl" }}
        isCentered={false}
        scrollBehavior="inside"
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(8px)" bg="rgba(15, 23, 42, 0.5)" />
        <ModalContent
          borderRadius={{ base: "none", sm: "2xl" }}
          mx={{ base: 0, sm: 4 }}
          my={{ base: 0, sm: "7vh" }}
          maxH={{ base: "100vh", sm: "84vh" }}
          bg={isDark ? "gray.900" : "white"}
          borderWidth={{ base: "0", sm: "1px" }}
          borderColor={isDark ? "gray.700" : "gray.200"}
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.45)"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          {/* Header Search Input Bar */}
          <ModalHeader
            p={{ base: 3, sm: 4 }}
            pb={{ base: 2, sm: 3 }}
            borderBottomWidth="1px"
            borderColor={isDark ? "gray.800" : "gray.100"}
            bg={isDark ? "gray.900" : "white"}
          >
            <HStack spacing={2} w="100%">
              {/* Mobile Back Button */}
              <IconButton
                display={{ base: "flex", sm: "none" }}
                variant="ghost"
                size="md"
                aria-label="Back"
                icon={<i className="fa-solid fa-arrow-left" style={{ fontSize: "16px", color: isDark ? "#94a3b8" : "#475569" }}></i>}
                onClick={onClose}
                borderRadius="full"
              />

              <InputGroup size="lg" flex="1">
                <InputLeftElement pointerEvents="none" color="gray.400" pl={2}>
                  <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "17px", color: "#2563eb" }}></i>
                </InputLeftElement>
                <Input
                  ref={searchInputRef}
                  placeholder="Search people, conversations, or actions..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  fontSize={{ base: "sm", sm: "md" }}
                  borderRadius="xl"
                  bg={isDark ? "gray.800" : "gray.50"}
                  color={isDark ? "white" : "gray.900"}
                  borderWidth="1px"
                  borderColor={isDark ? "gray.700" : "gray.200"}
                  _focus={{ bg: isDark ? "gray.800" : "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3b82f6" }}
                  pr={search ? "75px" : "40px"}
                  aria-label="Search users and commands"
                  autoComplete="off"
                />
                <InputRightElement width={search ? "70px" : "40px"} pr={2} display="flex" gap={1}>
                  {loading && <Spinner size="sm" color="blue.500" />}
                  {search && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      borderRadius="full"
                      icon={<CloseIcon boxSize="9px" />}
                      onClick={() => {
                        setSearch("");
                        setSearchResult([]);
                        setSelectedIndex(0);
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                    />
                  )}
                </InputRightElement>
              </InputGroup>

              {/* Desktop ESC badge */}
              <Kbd
                display={{ base: "none", md: "inline-flex" }}
                fontSize="11px"
                py={1}
                px={2}
                bg="gray.100"
                borderColor="gray.300"
                color="gray.600"
                borderRadius="md"
              >
                ESC
              </Kbd>
            </HStack>

            {/* Category Filter Chips Bar */}
            <HStack
              spacing={2}
              mt={3}
              overflowX="auto"
              py={1}
              sx={{
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {[
                { key: "all", label: "All Results", count: flatItems.length },
                { key: "people", label: "People", count: search.trim() ? searchResult.length : 0 },
                { key: "chats", label: "Chats & Groups", count: matchingChats.length },
                { key: "actions", label: "Commands", count: matchingActions.length },
              ].map((tab) => {
                const isActive = activeFilter === tab.key;
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
                    px={3}
                    py={1.5}
                    fontSize="xs"
                    fontWeight="600"
                    onClick={() => {
                      setActiveFilter(tab.key);
                      setSelectedIndex(0);
                      searchInputRef.current?.focus();
                    }}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <Badge
                        ml={1.5}
                        fontSize="9px"
                        borderRadius="full"
                        px={1.5}
                        colorScheme={isActive ? "whiteAlpha" : "gray"}
                        variant="solid"
                        bg={
                          isActive
                            ? "whiteAlpha.300"
                            : isDark
                            ? "gray.700"
                            : "gray.100"
                        }
                        color={
                          isActive
                            ? "white"
                            : isDark
                            ? "gray.200"
                            : "gray.700"
                        }
                        borderWidth="1px"
                        borderColor={
                          isActive
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
          </ModalHeader>

          {/* Results List Body */}
          <ModalBody
            p={{ base: 3, sm: 4 }}
            overflowY="auto"
            flex="1"
            sx={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            {loadingChat ? (
              <Box textAlign="center" py={12}>
                <Spinner size="lg" color="blue.600" thickness="3px" />
                <Text fontSize="sm" color="gray.700" mt={3} fontWeight="600">
                  Connecting to conversation...
                </Text>
              </Box>
            ) : (
              <>
                {/* 1. Empty query state with Recent Searches & Suggestions */}
                {!search.trim() && (
                  <Box mb={4}>
                    {/* Recent Searches Tags */}
                    {recentSearches.length > 0 && (
                      <Box mb={4} p={3} bg="gray.50" borderRadius="xl" borderWidth="1px" borderColor="gray.100">
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <HStack spacing={1.5} color="gray.600">
                            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: "11px" }}></i>
                            <Text fontSize="xs" fontWeight="700" textTransform="uppercase" letterSpacing="wider">
                              Recent Searches
                            </Text>
                          </HStack>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="gray"
                            fontSize="11px"
                            onClick={clearAllRecentSearches}
                          >
                            Clear History
                          </Button>
                        </Box>
                        <HStack spacing={2} flexWrap="wrap">
                          {recentSearches.map((term) => (
                            <Tag
                              key={term}
                              size="md"
                              borderRadius="full"
                              variant="subtle"
                              colorScheme="blue"
                              cursor="pointer"
                              _hover={{ bg: "blue.100" }}
                              onClick={() => {
                                setSearch(term);
                                searchInputRef.current?.focus();
                              }}
                            >
                              <TagLabel fontSize="xs">{term}</TagLabel>
                              <TagCloseButton onClick={(e) => removeRecentSearch(term, e)} />
                            </Tag>
                          ))}
                        </HStack>
                      </Box>
                    )}
                  </Box>
                )}

                {/* 2. Loading state for live search */}
                {loading && search.trim() ? (
                  <Box py={2}>
                    <ChatLoading />
                  </Box>
                ) : null}

                {/* 3. Render items list */}
                {flatItems.length > 0 ? (
                  <Box role="listbox">
                    {/* Render sections depending on activeFilter */}
                    {/* Section: Chats & Groups */}
                    {(activeFilter === "all" || activeFilter === "chats") && matchingChats.length > 0 && (
                      <Box mb={4}>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color={isDark ? "gray.400" : "gray.500"}
                          textTransform="uppercase"
                          letterSpacing="wider"
                          mb={2}
                          px={1}
                        >
                          {search.trim() ? "Conversations & Groups" : "Recent Conversations"} ({matchingChats.length})
                        </Text>
                        {matchingChats.map((chat) => {
                          const flatIndex = flatItems.findIndex((fi) => fi.id === `chat-${chat._id}`);
                          const isHighlighted = flatIndex === selectedIndex;
                          const isGroup = chat.isGroupChat;
                          const partner = !isGroup ? getSenderFull(user, chat.users) : null;
                          const isOnline = partner?._id && onlineUsers?.includes(partner._id);

                          return (
                            <Box
                              key={chat._id}
                              id={`cmd-item-${flatIndex}`}
                              onClick={() => handleSelectExistingChat(chat, search.trim())}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              cursor="pointer"
                              bg={
                                isHighlighted
                                  ? isDark
                                    ? "#1e293b"
                                    : "blue.50"
                                  : isDark
                                  ? "#111827"
                                  : "white"
                              }
                              _hover={{
                                bg: isHighlighted
                                  ? isDark
                                    ? "#243248"
                                    : "blue.50"
                                  : isDark
                                  ? "#1f2937"
                                  : "gray.50",
                                borderColor: isHighlighted ? "blue.400" : isDark ? "gray.600" : "gray.300",
                              }}
                              _active={{ bg: isDark ? "#2d3748" : "blue.100" }}
                              transition="all 0.15s ease"
                              w="100%"
                              minH="54px"
                              display="flex"
                              alignItems="center"
                              color={isDark ? "#f3f4f6" : "gray.900"}
                              px={3.5}
                              py={2.5}
                              mb={2}
                              borderRadius="xl"
                              borderWidth="1px"
                              borderColor={isHighlighted ? "blue.400" : isDark ? "gray.700" : "gray.200"}
                              boxShadow={isHighlighted ? "0 2px 8px rgba(37, 99, 235, 0.14)" : "sm"}
                              role="option"
                              aria-selected={isHighlighted}
                            >
                              {isGroup ? (
                                <Box
                                  mr={3}
                                  w="36px"
                                  h="36px"
                                  borderRadius="full"
                                  bg={isDark ? "blue.900" : "blue.100"}
                                  color={isDark ? "blue.300" : "blue.600"}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  fontSize="14px"
                                >
                                  <i className="fa-solid fa-users"></i>
                                </Box>
                              ) : (
                                <Avatar
                                  mr={3}
                                  size="sm"
                                  name={partner?.name || "Chat"}
                                  src={partner?.pic}
                                  boxShadow="sm"
                                >
                                  <AvatarBadge
                                    boxSize="1em"
                                    bg={isOnline ? "green.500" : "gray.400"}
                                    borderColor={isDark ? "#111827" : "white"}
                                  />
                                </Avatar>
                              )}

                              <Box flex="1" overflow="hidden">
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                  <Text
                                    fontWeight="600"
                                    fontSize="sm"
                                    isTruncated
                                    color={
                                      isHighlighted
                                        ? isDark
                                          ? "blue.300"
                                          : "blue.700"
                                        : isDark
                                        ? "white"
                                        : "gray.900"
                                    }
                                  >
                                    {isGroup ? chat.chatName : getSender(user, chat.users)}
                                  </Text>
                                  <HStack spacing={2}>
                                    <Badge
                                      colorScheme={isGroup ? "blue" : "gray"}
                                      variant="subtle"
                                      fontSize="9px"
                                      px={2}
                                      py={0.5}
                                      borderRadius="full"
                                    >
                                      {isGroup ? `${chat.users.length} members` : isOnline ? "Online" : "Direct"}
                                    </Badge>
                                    {isHighlighted && (
                                      <Text
                                        display={{ base: "none", sm: "inline-block" }}
                                        fontSize="10px"
                                        fontWeight="700"
                                        color={isDark ? "blue.300" : "blue.600"}
                                        bg={isDark ? "blue.900" : "blue.100"}
                                        px={1.5}
                                        py={0.5}
                                        borderRadius="md"
                                      >
                                        ↵ Open
                                      </Text>
                                    )}
                                  </HStack>
                                </Box>
                                <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"} isTruncated mt={0.5}>
                                  {chat.latestMessage?.content
                                    ? `Latest: ${chat.latestMessage.content}`
                                    : isGroup
                                    ? "Group conversation"
                                    : partner?.email || "Direct message"}
                                </Text>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {/* Section: People from API Search */}
                    {(activeFilter === "all" || activeFilter === "people") && search.trim() && searchResult.length > 0 && (
                      <Box mb={4}>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color={isDark ? "gray.400" : "gray.500"}
                          textTransform="uppercase"
                          letterSpacing="wider"
                          mb={2}
                          px={1}
                        >
                          People ({searchResult.length})
                        </Text>
                        {searchResult.map((u) => {
                          const flatIndex = flatItems.findIndex((fi) => fi.id === `user-${u._id}`);
                          return (
                            <UserListItem
                              key={u._id}
                              id={`cmd-item-${flatIndex}`}
                              user={u}
                              isActive={flatIndex === selectedIndex}
                              handleFunction={() => accessChat(u._id, search.trim())}
                            />
                          );
                        })}
                      </Box>
                    )}

                    {/* Section: Actions & Commands */}
                    {(activeFilter === "all" || activeFilter === "actions") && matchingActions.length > 0 && (
                      <Box mb={2}>
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color={isDark ? "gray.400" : "gray.500"}
                          textTransform="uppercase"
                          letterSpacing="wider"
                          mb={2}
                          px={1}
                        >
                          Commands & Actions ({matchingActions.length})
                        </Text>
                        {matchingActions.map((act) => {
                          const flatIndex = flatItems.findIndex((fi) => fi.id === act.id);
                          const isHighlighted = flatIndex === selectedIndex;

                          return (
                            <Box
                              key={act.id}
                              id={`cmd-item-${flatIndex}`}
                              onClick={act.onSelect}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              cursor="pointer"
                              bg={
                                isHighlighted
                                  ? isDark
                                    ? "#1e293b"
                                    : "blue.50"
                                  : isDark
                                  ? "#111827"
                                  : "white"
                              }
                              _hover={{
                                bg: isHighlighted
                                  ? isDark
                                    ? "#243248"
                                    : "blue.50"
                                  : isDark
                                  ? "#1f2937"
                                  : "gray.50",
                                borderColor: isHighlighted ? "blue.400" : isDark ? "gray.600" : "gray.300",
                              }}
                              _active={{ bg: isDark ? "#2d3748" : "blue.100" }}
                              transition="all 0.15s ease"
                              w="100%"
                              minH="54px"
                              display="flex"
                              alignItems="center"
                              color={isDark ? "#f3f4f6" : "gray.900"}
                              px={3.5}
                              py={2.5}
                              mb={2}
                              borderRadius="xl"
                              borderWidth="1px"
                              borderColor={isHighlighted ? "blue.400" : isDark ? "gray.700" : "gray.200"}
                              boxShadow={isHighlighted ? "0 2px 8px rgba(37, 99, 235, 0.14)" : "sm"}
                              role="option"
                              aria-selected={isHighlighted}
                            >
                              <Box
                                mr={3}
                                w="36px"
                                h="36px"
                                borderRadius="xl"
                                bg={act.iconBg}
                                color={act.iconColor}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                fontSize="15px"
                              >
                                <i className={act.icon}></i>
                              </Box>
                              <Box flex="1" overflow="hidden">
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                  <Text
                                    fontWeight="600"
                                    fontSize="sm"
                                    color={
                                      isHighlighted
                                        ? isDark
                                          ? "blue.300"
                                          : "blue.700"
                                        : isDark
                                        ? "white"
                                        : "gray.900"
                                    }
                                  >
                                    {act.title}
                                  </Text>
                                  <HStack spacing={2}>
                                    <Badge
                                      colorScheme={act.badgeColor}
                                      variant="subtle"
                                      fontSize="9px"
                                      px={2}
                                      py={0.5}
                                      borderRadius="full"
                                    >
                                      {act.badge}
                                    </Badge>
                                    {isHighlighted && (
                                      <Text
                                        display={{ base: "none", sm: "inline-block" }}
                                        fontSize="10px"
                                        fontWeight="700"
                                        color={isDark ? "blue.300" : "blue.600"}
                                        bg={isDark ? "blue.900" : "blue.100"}
                                        px={1.5}
                                        py={0.5}
                                        borderRadius="md"
                                      >
                                        ↵ Run
                                      </Text>
                                    )}
                                  </HStack>
                                </Box>
                                <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"} isTruncated mt={0.5}>
                                  {act.description}
                                </Text>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                ) : search.trim() && !loading ? (
                  /* Zero results state */
                  <Box textAlign="center" py={12} px={4}>
                    <Box color="gray.300" mb={3}>
                      <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "36px" }}></i>
                    </Box>
                    <Text fontWeight="700" color="gray.800" fontSize="md">
                      No results for "{search.trim()}"
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1} maxW="380px" mx="auto" lineHeight="tall">
                      Try searching with different keywords, check the spelling, or switch to another category filter.
                    </Text>
                    <HStack justify="center" spacing={2} mt={4}>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        borderRadius="full"
                        onClick={() => {
                          setSearch("");
                          setActiveFilter("all");
                          searchInputRef.current?.focus();
                        }}
                      >
                        Reset Search
                      </Button>
                      <Button
                        size="xs"
                        variant="solid"
                        colorScheme="blue"
                        borderRadius="full"
                        onClick={() => {
                          onClose();
                          onGroupOpen();
                        }}
                      >
                        New Group Chat
                      </Button>
                    </HStack>
                  </Box>
                ) : null}
              </>
            )}
          </ModalBody>

          {/* Footer with keyboard hints for Desktop & Close button for Mobile */}
          <ModalFooter
            p={{ base: 2.5, sm: 3 }}
            px={{ base: 3, sm: 4 }}
            bg={isDark ? "gray.800" : "gray.50"}
            borderTopWidth="1px"
            borderColor={isDark ? "gray.700" : "gray.100"}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            {/* Desktop Keyboard Hints */}
            <HStack
              spacing={4}
              fontSize="11px"
              color={isDark ? "gray.400" : "gray.500"}
              display={{ base: "none", sm: "flex" }}
              flexWrap="wrap"
            >
              <HStack spacing={1}>
                <Kbd bg={isDark ? "gray.700" : "white"} borderColor={isDark ? "gray.600" : "gray.300"} color={isDark ? "gray.300" : "gray.600"}>↑</Kbd>
                <Kbd bg={isDark ? "gray.700" : "white"} borderColor={isDark ? "gray.600" : "gray.300"} color={isDark ? "gray.300" : "gray.600"}>↓</Kbd>
                <Text>Navigate</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd bg={isDark ? "gray.700" : "white"} borderColor={isDark ? "gray.600" : "gray.300"} color={isDark ? "gray.300" : "gray.600"}>↵</Kbd>
                <Text>Select</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd bg={isDark ? "gray.700" : "white"} borderColor={isDark ? "gray.600" : "gray.300"} color={isDark ? "gray.300" : "gray.600"}>Tab</Kbd>
                <Text>Filter</Text>
              </HStack>
              <HStack spacing={1}>
                <Kbd bg={isDark ? "gray.700" : "white"} borderColor={isDark ? "gray.600" : "gray.300"} color={isDark ? "gray.300" : "gray.600"}>esc</Kbd>
                <Text>Dismiss</Text>
              </HStack>
            </HStack>

            {/* Mobile Close Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              borderRadius="lg"
              display={{ base: "flex", sm: "none" }}
              w="100%"
              color="gray.600"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SideDrawer;
