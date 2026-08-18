import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../../Context/ChatProvider";
import {
  Box,
  Text,
  IconButton,
  useToast,
  Input,
  FormControl,
  Spinner,
  Avatar,
  AvatarBadge,
  HStack,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Image,
  Tooltip,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  Search2Icon,
  CloseIcon,
  AttachmentIcon,
} from "@chakra-ui/icons";
import { getSenderFull, getSender } from "../../config/ChatLogics";
import ProfileModal from "../Miscellaneous/ProfileModal";
import Lottie from "react-lottie";
import animationData from "../../animations/typing.json";
import axios from "axios";
import io from "socket.io-client";
import ScrollableChat from "../Chat/ScrollableChat.js";
import UpdateGroupChatModal from "../Miscellaneous/UpdateGroupChatModal.js";
import "./style.css";

// Dynamically resolve backend endpoint
const getEndpoint = () => {
  if (process.env.REACT_APP_ENDPOINT) {
    return process.env.REACT_APP_ENDPOINT;
  }
  if (process.env.NODE_ENV === "production") {
    return window.location.origin;
  }
  return "http://localhost:5000";
};

const ENDPOINT = getEndpoint();
let socket, selectedChatCompare;

const COMMON_EMOJIS = [
  "😀", "😂", "🥰", "😍", "😎", "🔥", "👍", "🙌", "❤️", "🎉", "✨", "💯", "🙏", "🚀"
];

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedImage, setAttachedImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const {
    selectedChat,
    setSelectedChat,
    user,
    notification,
    setNotification,
    onlineUsers,
    setOnlineUsers,
    playNotificationSound,
    playSendSound,
  } = ChatState();

  const otherUser =
    selectedChat && !selectedChat.isGroupChat
      ? getSenderFull(user, selectedChat.users)
      : null;
  const isOtherUserOnline = otherUser && onlineUsers?.includes(otherUser._id);

  // Fetch chat messages
  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      if (socket) {
        socket.emit("join chat", selectedChat._id);
      }
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Occurred!",
        description: "Failed to load messages",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  // Upload image attachment
  const handleImageUpload = (file) => {
    if (!file) return;
    if (
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp" ||
      file.type === "image/gif"
    ) {
      setUploadingImage(true);
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "ddnwjdqbf");

      fetch("https://api.cloudinary.com/v1_1/ddnwjdqbf/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.url) {
            setAttachedImage(data.url.toString());
            toast({
              title: "Image Attached",
              status: "success",
              duration: 2000,
              isClosable: true,
            });
          }
          setUploadingImage(false);
        })
        .catch(() => {
          setUploadingImage(false);
          toast({
            title: "Upload Failed",
            description: "Could not upload image",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        });
    } else {
      toast({
        title: "Please select a valid image file",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Send message
  const sendMessage = async (event) => {
    if ((event.key === "Enter" || event.type === "click") && (newMessage.trim() || attachedImage)) {
      if (socketConnected) {
        socket.emit("stop typing", selectedChat._id);
      }

      const contentToSend = newMessage.trim();
      const imageToSend = attachedImage;

      setNewMessage("");
      setAttachedImage("");
      setShowEmojiPicker(false);

      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.post(
          "/api/message",
          {
            content: contentToSend,
            chatId: selectedChat._id,
            fileUrl: imageToSend,
          },
          config
        );

        if (socket) {
          socket.emit("new message", data);
        }
        playSendSound();
        setMessages((prev) => [...prev, data]);
        setFetchAgain(!fetchAgain);
      } catch (error) {
        toast({
          title: "Failed to Send Message",
          description: error.response?.data?.message || error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  // React to a message
  const handleReaction = async (messageId, emoji) => {
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `/api/message/${messageId}/react`,
        { emoji },
        config
      );

      // Update local message list
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data : msg))
      );

      // Broadcast reaction via socket
      if (socket) {
        socket.emit("message reaction", {
          chatId: selectedChat._id,
          message: data,
        });
      }
    } catch (error) {
      toast({
        title: "Reaction Failed",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.delete(`/api/message/${messageId}`, config);

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, isDeleted: true, content: "This message was deleted", fileUrl: "" }
            : msg
        )
      );

      if (socket) {
        socket.emit("message deleted", {
          chatId: selectedChat._id,
          messageId,
        });
      }

      toast({
        title: "Message Deleted",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not delete message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Initialize socket
  useEffect(() => {
    socket = io(ENDPOINT, { transports: ["websocket", "polling"] });
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    socket.on("online-users-list", (usersList) => {
      setOnlineUsers(usersList);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    setShowSearch(false);
    setSearchQuery("");
    // eslint-disable-next-line
  }, [selectedChat]);

  // Handle incoming real-time socket events
  useEffect(() => {
    const handleIncomingMessage = (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        if (!notification.some((n) => n._id === newMessageReceived._id)) {
          setNotification([newMessageReceived, ...notification]);
          playNotificationSound();
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMessageReceived]);
        playNotificationSound();
      }
    };

    const handleReactionUpdate = (data) => {
      if (
        selectedChatCompare &&
        selectedChatCompare._id === data.chatId &&
        data.message
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.message._id ? data.message : msg
          )
        );
      }
    };

    const handleDeletionUpdate = (data) => {
      if (selectedChatCompare && selectedChatCompare._id === data.chatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId
              ? { ...msg, isDeleted: true, content: "This message was deleted", fileUrl: "" }
              : msg
          )
        );
      }
    };

    socket?.on("message received", handleIncomingMessage);
    socket?.on("message reaction updated", handleReactionUpdate);
    socket?.on("message deleted updated", handleDeletionUpdate);

    return () => {
      socket?.off("message received", handleIncomingMessage);
      socket?.off("message reaction updated", handleReactionUpdate);
      socket?.off("message deleted updated", handleDeletionUpdate);
    };
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected || !selectedChat) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // Filter messages based on in-chat search
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : messages;

  return (
    <>
      {selectedChat ? (
        <>
          {/* Chat Header */}
          <Box
            w="100%"
            pb={3}
            px={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <HStack spacing={2} align="center" overflow="hidden">
              <IconButton
                display={{ base: "flex", md: "none" }}
                icon={<ArrowBackIcon />}
                onClick={() => setSelectedChat(null)}
                variant="ghost"
                borderRadius="full"
                size="sm"
                aria-label="Back"
              />

              {!selectedChat.isGroupChat && otherUser ? (
                <Avatar
                  size="sm"
                  name={otherUser.name}
                  src={otherUser.pic}
                >
                  <AvatarBadge
                    boxSize="1em"
                    bg={isOtherUserOnline ? "green.500" : "gray.400"}
                    borderColor="white"
                  />
                </Avatar>
              ) : (
                <Avatar
                  size="sm"
                  name={selectedChat.chatName}
                  bg="purple.500"
                />
              )}

              <Box overflow="hidden">
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  fontWeight="800"
                  color="gray.800"
                  isTruncated
                >
                  {!selectedChat.isGroupChat
                    ? getSender(user, selectedChat.users)
                    : selectedChat.chatName}
                </Text>
                <Text fontSize="10px" color="gray.500">
                  {!selectedChat.isGroupChat
                    ? isOtherUserOnline
                      ? "🟢 Active Now"
                      : "Offline"
                    : `${selectedChat.users?.length || 0} members`}
                </Text>
              </Box>
            </HStack>

            <HStack spacing={1}>
              <Tooltip label="Search messages in chat" hasArrow>
                <IconButton
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  icon={<Search2Icon color="gray.600" />}
                  onClick={() => setShowSearch(!showSearch)}
                  aria-label="Search Messages"
                />
              </Tooltip>

              {!selectedChat.isGroupChat ? (
                <ProfileModal user={otherUser} />
              ) : (
                <UpdateGroupChatModal
                  fetchMessages={fetchMessages}
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                />
              )}
            </HStack>
          </Box>

          {/* In-Chat Message Search Bar */}
          {showSearch && (
            <Box w="100%" py={2} px={1}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <Search2Icon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search in this conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="xl"
                  bg="gray.50"
                />
                {searchQuery && (
                  <InputRightElement>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={<CloseIcon boxSize="8px" />}
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear Search"
                    />
                  </InputRightElement>
                )}
              </InputGroup>
              {searchQuery && (
                <Text fontSize="xs" color="gray.500" mt={1} ml={1}>
                  Found {filteredMessages.length} message(s)
                </Text>
              )}
            </Box>
          )}

          {/* Messages Container */}
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)"
            w="100%"
            h="100%"
            borderRadius="2xl"
            overflowY="hidden"
            borderWidth="1px"
            borderColor="gray.200"
            position="relative"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={16}
                h={16}
                alignSelf="center"
                margin="auto"
                color="purple.500"
                thickness="3px"
              />
            ) : (
              <div className="messages" style={{ overflowY: "auto", flex: 1 }}>
                <ScrollableChat
                  messages={filteredMessages}
                  handleReaction={handleReaction}
                  handleDeleteMessage={handleDeleteMessage}
                />
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <Box mb={2} ml={1} display="flex" alignItems="center">
                <Lottie
                  options={defaultOptions}
                  width={60}
                  height={30}
                  style={{ marginLeft: 0 }}
                />
              </Box>
            )}

            {/* Attached Image Preview */}
            {attachedImage && (
              <Box
                mb={2}
                p={2}
                bg="white"
                borderRadius="xl"
                boxShadow="md"
                display="inline-flex"
                alignItems="center"
                gap={2}
                maxW="200px"
                position="relative"
              >
                <Image
                  src={attachedImage}
                  alt="Attachment Preview"
                  maxH="60px"
                  borderRadius="md"
                />
                <IconButton
                  size="xs"
                  colorScheme="red"
                  variant="solid"
                  borderRadius="full"
                  icon={<CloseIcon boxSize="8px" />}
                  onClick={() => setAttachedImage("")}
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  aria-label="Remove Image"
                />
              </Box>
            )}

            {/* Quick Emoji Picker Bar */}
            {showEmojiPicker && (
              <Box className="emoji-picker-strip" borderRadius="xl" mb={2}>
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="emoji-strip-btn"
                    onClick={() => setNewMessage((prev) => prev + emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </Box>
            )}

            {/* Message Input Form */}
            <FormControl
              onKeyDown={sendMessage}
              id="message-input"
              isRequired
              mt={2}
            >
              <InputGroup size="md">
                <InputLeftElement width="70px" display="flex" gap={1} pl={2}>
                  {/* Image Attachment Trigger */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageUpload(e.target.files[0])}
                  />
                  <Tooltip label="Attach Image" hasArrow>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      borderRadius="full"
                      icon={
                        uploadingImage ? (
                          <Spinner size="xs" color="purple.500" />
                        ) : (
                          <AttachmentIcon color="gray.500" />
                        )
                      }
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={uploadingImage}
                      aria-label="Attach File"
                    />
                  </Tooltip>

                  {/* Emoji Picker Toggle */}
                  <Tooltip label="Emojis" hasArrow>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      borderRadius="full"
                      icon={<span>😊</span>}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      aria-label="Emoji Picker"
                    />
                  </Tooltip>
                </InputLeftElement>

                <Input
                  variant="filled"
                  bg="white"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={typingHandler}
                  borderRadius="full"
                  pl="76px"
                  pr="50px"
                  py={5}
                  boxShadow="sm"
                  _focus={{
                    bg: "white",
                    borderColor: "purple.400",
                    boxShadow: "0 0 0 1px #8b5cf6",
                  }}
                />

                <InputRightElement pr={2}>
                  <IconButton
                    size="sm"
                    colorScheme="purple"
                    borderRadius="full"
                    icon={<span>➤</span>}
                    onClick={sendMessage}
                    aria-label="Send Message"
                    isDisabled={!newMessage.trim() && !attachedImage}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          flexDir="column"
          alignItems="center"
          justifyContent="center"
          h="100%"
          textAlign="center"
          p={6}
          color="gray.500"
        >
          <Box
            fontSize="64px"
            mb={4}
            p={6}
            bg="purple.50"
            borderRadius="full"
            boxShadow="inner"
          >
            💬
          </Box>
          <Text fontSize="2xl" fontWeight="800" color="gray.800" mb={2}>
            Welcome to Chatt
          </Text>
          <Text fontSize="md" maxW="380px">
            Select a conversation from the sidebar or search users to start real-time messaging!
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;