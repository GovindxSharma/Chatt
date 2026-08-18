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
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon, Search2Icon } from "@chakra-ui/icons";
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

  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
    onlineUsers,
    soundEnabled,
    toggleSound,
  } = ChatState();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
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
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(16px)"
        w="100%"
        p="8px 16px"
        borderBottom="1px solid rgba(226, 232, 240, 0.8)"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.04)"
      >
        <Tooltip label="Search Users to start chat" hasArrow placement="bottom-start">
          <Button
            variant="ghost"
            onClick={onOpen}
            leftIcon={<Search2Icon color="purple.500" />}
            borderRadius="full"
            bg="gray.100"
            _hover={{ bg: "gray.200" }}
            size="sm"
            px={4}
          >
            <Text display={{ base: "none", md: "flex" }} fontWeight="600" fontSize="sm">
              Search Users
            </Text>
          </Button>
        </Tooltip>

        <Box display="flex" alignItems="center" gap={2}>
          <Text
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="800"
            letterSpacing="-0.5px"
            bgGradient="linear(to-r, #6366f1, #a855f7, #ec4899)"
            bgClip="text"
          >
            💬 Chatt
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

        <HStack spacing={2}>
          {/* Sound Toggle */}
          <Tooltip
            label={soundEnabled ? "Mute notifications" : "Enable notifications sound"}
            hasArrow
          >
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="full"
              aria-label="Toggle Sound"
              icon={<span>{soundEnabled ? "🔊" : "🔇"}</span>}
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
                <Text fontSize="sm" color="gray.500" p={2} textAlign="center">
                  No new messages ✨
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
                        ? `Group: ${noti.chat.chatName}`
                        : getSender(user, noti.chat.users)}
                    </Text>
                    <Text fontSize="xs" color="gray.600" isTruncated maxW="220px">
                      {noti.content || "Sent an attachment"}
                    </Text>
                  </Box>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* User Profile Menu */}
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
              <ProfileModal user={user}>
                <MenuItem borderRadius="lg">👤 View & Edit Profile</MenuItem>
              </ProfileModal>
              <MenuDivider my={1} />
              <MenuItem
                borderRadius="lg"
                color="red.500"
                _hover={{ bg: "red.50" }}
                onClick={logoutHandler}
              >
                🚪 Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Box>

      {/* Search Users Drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent borderRightRadius="2xl">
          <DrawerHeader borderBottomWidth="1px" fontSize="lg" fontWeight="700">
            🔍 Search Users
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
              <Button colorScheme="purple" onClick={handleSearch} borderRadius="xl">
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
                <Spinner size="lg" color="purple.500" />
              </Box>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideDrawer;
