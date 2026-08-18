import React, { useState } from "react";
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
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  Input,
  Drawer,
  DrawerBody,
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
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import ChatLoading from "../Chat/ChatLoading.js";
import UserListItem from "../UserAvatar/UserListItem.js";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { getSender } from "../../config/ChatLogics";
import "./notification.css";

const SideDrawer = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // Profile Modal & Logout Modal states
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
    user,
    setUser,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
    onlineUsers,
    soundEnabled,
    toggleSound,
    themeMode,
    toggleThemeMode,
  } = ChatState();

  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const handleSearch = async () => {
    if (!search || !search.trim()) {
      toast({
        title: "Please enter a name or email to search",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }
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

      setLoading(false);
      if (data.length === 0) {
        toast({
          title: "No user found",
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "top-left",
        });
      }
      setSearchResult(data);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Searching Users",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const accessChat = async (userId) => {
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

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
        w="100%"
        p="8px 14px"
        borderBottomWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <Tooltip label="Search Users" hasArrow placement="bottom-start">
          <Button
            variant="ghost"
            onClick={onOpen}
            borderRadius="full"
            bg="gray.100"
            _hover={{ bg: "gray.200" }}
            size="sm"
            px={3.5}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ color: "#4f46e5" }}></i>
            <Text display={{ base: "none", md: "flex" }} px="2" fontWeight="600" fontSize="sm">
              Search User
            </Text>
          </Button>
        </Tooltip>

        <Box display="flex" alignItems="center" gap={2}>
          <i className="fa-solid fa-comments" style={{ color: "#6366f1", fontSize: "20px" }}></i>
          <Text
            fontSize={{ base: "lg", md: "2xl" }}
            fontFamily="Work sans"
            fontWeight="700"
            color="gray.800"
          >
            Chat-To-Talk
          </Text>
          {onlineUsers?.length > 0 && (
            <Badge
              colorScheme="green"
              variant="subtle"
              borderRadius="full"
              px={2}
              py={0.5}
              fontSize="10px"
              display={{ base: "none", sm: "inline-flex" }}
              alignItems="center"
              gap={1}
            >
              <Box as="span" className="online-dot" boxSize="6px" />
              {onlineUsers.length} Online
            </Badge>
          )}
        </Box>

        <HStack spacing={1}>
          {/* Theme Mode Switcher */}
          <Tooltip
            label={themeMode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            hasArrow
          >
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="full"
              aria-label="Toggle Theme"
              icon={
                <i
                  className={themeMode === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"}
                  style={{ color: themeMode === "dark" ? "#f59e0b" : "#64748b" }}
                ></i>
              }
              onClick={toggleThemeMode}
            />
          </Tooltip>

          {/* Sound Toggle Button */}
          <Tooltip
            label={soundEnabled ? "Sound enabled (click to mute)" : "Sound muted (click to enable)"}
            hasArrow
          >
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="full"
              aria-label="Toggle Audio"
              icon={
                <i
                  className={soundEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark"}
                  style={{ color: soundEnabled ? "#6366f1" : "#94a3b8" }}
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
                    colorScheme="purple"
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

      {/* Logout Confirmation Modal */}
      <Modal isOpen={isLogoutOpen} onClose={onLogoutClose} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" mx={4} overflow="hidden">
          <ModalHeader fontSize="lg" fontWeight="700" pt={5} pb={2} textAlign="center">
            <i
              className="fa-solid fa-right-from-bracket"
              style={{ color: "#ef4444", fontSize: "28px", display: "block", marginBottom: "8px" }}
            ></i>
            Log Out of Chat-To-Talk?
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

      {/* Search Users Drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent borderRightRadius="2xl">
          <DrawerHeader borderBottomWidth="1px" fontSize="lg" fontWeight="700">
            <i className="fa-solid fa-magnifying-glass" style={{ marginRight: "8px" }}></i>
            Search Users
          </DrawerHeader>
          <DrawerBody p={4}>
            <Box display="flex" pb={3} gap={2}>
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                borderRadius="xl"
              />
              <Button colorScheme="blue" onClick={handleSearch} borderRadius="xl">
                Go
              </Button>
            </Box>
            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((u) => (
                <UserListItem
                  key={u._id}
                  user={u}
                  handleFunction={() => accessChat(u._id)}
                />
              ))
            )}
            {loadingChat && (
              <Box textAlign="center" py={4}>
                <Spinner size="lg" color="blue.500" />
              </Box>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideDrawer;
