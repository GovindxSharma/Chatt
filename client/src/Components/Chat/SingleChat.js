import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../../Context/ChatProvider";
import {
  Box,
  Button,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { ArrowBackIcon, CloseIcon } from "@chakra-ui/icons";
import { getSenderFull, getSender } from "../../config/ChatLogics";
import {
  encryptText,
  decryptMessagesList,
  decryptMessageObject,
} from "../../config/cryptoLogics";
import ProfileModal from "../Miscellaneous/ProfileModal";
import Lottie from "react-lottie";
import animationData from "../../animations/typing.json";
import axios from "axios";
import io from "socket.io-client";
import ScrollableChat from "../Chat/ScrollableChat.js";
import UpdateGroupChatModal from "../Miscellaneous/UpdateGroupChatModal.js";
import "./style.css";

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

// Convert File/Blob to Base64 Data URL
const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Replying & Editing states
  const [replyingMessage, setReplyingMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  // Pinned Messages state
  const [pinnedIndex, setPinnedIndex] = useState(0);

  // Scroll to bottom FAB state
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Clear Chat Modal state
  const {
    isOpen: isClearChatOpen,
    onOpen: onClearChatOpen,
    onClose: onClearChatClose,
  } = useDisclosure();

  // File Attachment states
  const [attachedFile, setAttachedFile] = useState(null); // { url, type, name }
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Audio Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const recordingStreamRef = useRef(null);

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

  // Pinned messages list
  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);

  // Fetch chat messages and decrypt client-side
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

      const decryptedData = await decryptMessagesList(data, selectedChat._id);
      setMessages(decryptedData);
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

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  };

  // Scroll listener for FAB button
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight > 200) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  // Upload file or image
  const handleFileUpload = async (file, explicitType = "") => {
    if (!file) return;
    setUploadingFile(true);

    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    const determinedType = explicitType || (isImage ? "image" : isAudio ? "audio" : "file");

    try {
      let finalUrl = "";

      if (isImage) {
        try {
          const data = new FormData();
          data.append("file", file);
          data.append("upload_preset", "chat-app");
          data.append("cloud_name", "ddnwjdqbf");

          const res = await fetch("https://api.cloudinary.com/v1_1/ddnwjdqbf/image/upload", {
            method: "post",
            body: data,
          });
          const resData = await res.json();
          if (resData.url || resData.secure_url) {
            finalUrl = (resData.secure_url || resData.url).toString();
          }
        } catch (e) {}
      }

      if (!finalUrl) {
        finalUrl = await fileToDataUrl(file);
      }

      setAttachedFile({
        url: finalUrl,
        type: determinedType,
        name: file.name || "Attachment",
      });

      toast({
        title: `${determinedType === "audio" ? "Audio" : "File"} Attached`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      setUploadingFile(false);
    } catch (err) {
      setUploadingFile(false);
      toast({
        title: "Attachment Failed",
        description: "Could not read file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Send Direct Voice Note
  const sendDirectVoiceNote = async (audioBlob) => {
    if (!selectedChat) return;
    try {
      setUploadingFile(true);
      const audioDataUrl = await fileToDataUrl(audioBlob);

      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const encryptedContent = await encryptText("Voice note", selectedChat._id);
      const encryptedFileName = await encryptText("voice-note.webm", selectedChat._id);

      const payload = {
        content: encryptedContent,
        chatId: selectedChat._id,
        fileUrl: audioDataUrl,
        fileType: "audio",
        fileName: encryptedFileName,
        replyTo: replyingMessage ? replyingMessage._id : undefined,
      };

      const { data } = await axios.post("/api/message", payload, config);

      if (socket) {
        socket.emit("new message", data);
      }
      playSendSound();

      const decryptedMsg = await decryptMessageObject(data, selectedChat._id);
      setMessages((prev) => [...prev, decryptedMsg]);
      setFetchAgain(!fetchAgain);
      setUploadingFile(false);
      setReplyingMessage(null);

      toast({
        title: "Voice Note Sent!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      setUploadingFile(false);
      toast({
        title: "Failed to Send Voice Note",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  // Start Live Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalMime = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
        if (audioChunksRef.current.length > 0) {
          await sendDirectVoiceNote(audioBlob);
        }
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser to record voice notes",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      setRecordingDuration(0);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Send message / Save edited message
  const sendMessage = async (event) => {
    if (
      (event?.key === "Enter" || event?.type === "click") &&
      (newMessage.trim() || attachedFile)
    ) {
      if (socketConnected && selectedChat) {
        socket.emit("stop typing", selectedChat._id);
      }

      // Handle Edit Message Mode
      if (editingMessage) {
        try {
          const config = {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          };

          const encryptedContent = await encryptText(newMessage.trim(), selectedChat._id);

          const { data } = await axios.put(
            `/api/message/${editingMessage._id}/edit`,
            { content: encryptedContent },
            config
          );

          if (socket) {
            socket.emit("message edited", {
              chatId: selectedChat._id,
              message: data,
            });
          }

          const decrypted = await decryptMessageObject(data, selectedChat._id);
          setMessages((prev) =>
            prev.map((msg) => (msg._id === editingMessage._id ? decrypted : msg))
          );

          setNewMessage("");
          setEditingMessage(null);
          toast({
            title: "Message Edited",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
          return;
        } catch (err) {
          toast({
            title: "Failed to edit message",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
      }

      // Standard Send Mode
      const contentToSend = newMessage.trim();
      const fileToSend = attachedFile;
      const replyTarget = replyingMessage;

      setNewMessage("");
      setAttachedFile(null);
      setReplyingMessage(null);

      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const textToEncrypt = contentToSend || (fileToSend ? fileToSend.name : "");
        const encryptedContent = await encryptText(textToEncrypt, selectedChat._id);
        const encryptedFileName = fileToSend?.name
          ? await encryptText(fileToSend.name, selectedChat._id)
          : "";

        const payload = {
          content: encryptedContent,
          chatId: selectedChat._id,
          fileUrl: fileToSend?.url || "",
          fileType: fileToSend?.type || "",
          fileName: encryptedFileName,
          replyTo: replyTarget ? replyTarget._id : undefined,
        };

        const { data } = await axios.post("/api/message", payload, config);

        if (socket) {
          socket.emit("new message", data);
        }
        playSendSound();

        const decryptedMsg = await decryptMessageObject(data, selectedChat._id);
        setMessages((prev) => [...prev, decryptedMsg]);
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

  // Reply handler
  const handleReplyMessage = (msg) => {
    setReplyingMessage(msg);
    setEditingMessage(null);
  };

  // Edit message handler
  const handleEditMessage = (msg) => {
    setEditingMessage(msg);
    setNewMessage(msg.content);
    setReplyingMessage(null);
  };

  // Pin message handler
  const handlePinMessage = async (messageId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(`/api/message/${messageId}/pin`, {}, config);

      if (socket) {
        socket.emit("message pinned", {
          chatId: selectedChat._id,
          message: data,
        });
      }

      const decrypted = await decryptMessageObject(data, selectedChat._id);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? decrypted : msg))
      );

      toast({
        title: decrypted.isPinned ? "Message Pinned" : "Message Unpinned",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Could not pin message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Clear conversation handler
  const handleClearChat = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.delete(`/api/message/clear/${selectedChat._id}`, config);

      if (socket) {
        socket.emit("chat cleared", { chatId: selectedChat._id });
      }

      setMessages([]);
      onClearChatClose();
      setFetchAgain(!fetchAgain);

      toast({
        title: "Chat History Cleared",
        status: "info",
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Failed to clear chat",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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

      const decrypted = await decryptMessageObject(data, selectedChat._id);

      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? decrypted : msg))
      );

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
            ? {
                ...msg,
                isDeleted: true,
                content: "This message was deleted",
                fileUrl: "",
                fileType: "",
                fileName: "",
              }
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

  // Socket initialization
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
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    setShowSearch(false);
    setSearchQuery("");
    setAttachedFile(null);
    setReplyingMessage(null);
    setEditingMessage(null);
    cancelRecording();
    // eslint-disable-next-line
  }, [selectedChat]);

  // Real-time socket listeners
  useEffect(() => {
    const handleIncomingMessage = async (newMessageReceived) => {
      const decryptedMsg = await decryptMessageObject(
        newMessageReceived,
        newMessageReceived.chat._id
      );

      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        if (!notification.some((n) => n._id === newMessageReceived._id)) {
          setNotification([decryptedMsg, ...notification]);
          playNotificationSound();
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, decryptedMsg]);
        playNotificationSound();
      }
    };

    const handleReactionUpdate = async (data) => {
      if (
        selectedChatCompare &&
        selectedChatCompare._id === data.chatId &&
        data.message
      ) {
        const decrypted = await decryptMessageObject(data.message, data.chatId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.message._id ? decrypted : msg
          )
        );
      }
    };

    const handleDeletionUpdate = (data) => {
      if (selectedChatCompare && selectedChatCompare._id === data.chatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId
              ? {
                  ...msg,
                  isDeleted: true,
                  content: "This message was deleted",
                  fileUrl: "",
                  fileType: "",
                  fileName: "",
                }
              : msg
          )
        );
      }
    };

    const handleEditUpdate = async (data) => {
      if (selectedChatCompare && selectedChatCompare._id === data.chatId && data.message) {
        const decrypted = await decryptMessageObject(data.message, data.chatId);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === data.message._id ? decrypted : msg))
        );
      }
    };

    const handlePinUpdate = async (data) => {
      if (selectedChatCompare && selectedChatCompare._id === data.chatId && data.message) {
        const decrypted = await decryptMessageObject(data.message, data.chatId);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === data.message._id ? decrypted : msg))
        );
      }
    };

    const handleClearUpdate = (data) => {
      if (selectedChatCompare && selectedChatCompare._id === data.chatId) {
        setMessages([]);
      }
    };

    socket?.on("message received", handleIncomingMessage);
    socket?.on("message reaction updated", handleReactionUpdate);
    socket?.on("message deleted updated", handleDeletionUpdate);
    socket?.on("message edited updated", handleEditUpdate);
    socket?.on("message pinned updated", handlePinUpdate);
    socket?.on("chat cleared updated", handleClearUpdate);

    return () => {
      socket?.off("message received", handleIncomingMessage);
      socket?.off("message reaction updated", handleReactionUpdate);
      socket?.off("message deleted updated", handleDeletionUpdate);
      socket?.off("message edited updated", handleEditUpdate);
      socket?.off("message pinned updated", handlePinUpdate);
      socket?.off("chat cleared updated", handleClearUpdate);
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

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : messages;

  return (
    <>
      {selectedChat ? (
        <>
          {/* Top Bar Header */}
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
                aria-label="Back to chats"
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
                  bg="blue.500"
                  icon={<i className="fa-solid fa-users" style={{ fontSize: "14px", color: "white" }}></i>}
                />
              )}

              <Box overflow="hidden">
                <HStack spacing={2} align="center">
                  <Text
                    fontSize={{ base: "md", md: "lg" }}
                    fontWeight="700"
                    color="gray.800"
                    isTruncated
                  >
                    {!selectedChat.isGroupChat
                      ? getSender(user, selectedChat.users)
                      : selectedChat.chatName}
                  </Text>
                  <Tooltip
                    label="Messages and audio notes are End-to-End Encrypted (AES-256). No one outside of this chat can listen or read them."
                    hasArrow
                    placement="bottom"
                  >
                    <Badge
                      colorScheme="blue"
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="9px"
                      display={{ base: "none", sm: "inline-flex" }}
                      alignItems="center"
                      gap={1}
                    >
                      <i className="fa-solid fa-lock" style={{ fontSize: "8px" }}></i>
                      E2EE
                    </Badge>
                  </Tooltip>
                </HStack>
                <Text fontSize="10px" color="gray.500">
                  {!selectedChat.isGroupChat
                    ? isOtherUserOnline
                      ? "Active Now"
                      : "Offline"
                    : `${selectedChat.users?.length || 0} members`}
                </Text>
              </Box>
            </HStack>

            <HStack spacing={1}>
              <Tooltip label="Search in conversation" hasArrow>
                <IconButton
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  icon={<i className="fa-solid fa-magnifying-glass" style={{ color: "#64748b" }}></i>}
                  onClick={() => setShowSearch(!showSearch)}
                  aria-label="Search Messages"
                />
              </Tooltip>

              {/* Chat Options Menu (Clear Chat, Profile, Settings) */}
              <Menu>
                <MenuButton
                  as={IconButton}
                  size="sm"
                  variant="ghost"
                  borderRadius="full"
                  icon={<i className="fa-solid fa-ellipsis-vertical" style={{ color: "#64748b" }}></i>}
                  aria-label="Chat Options"
                />
                <MenuList p={2} borderRadius="xl" boxShadow="2xl">
                  {!selectedChat.isGroupChat ? (
                    <ProfileModal user={otherUser}>
                      <MenuItem borderRadius="lg" icon={<i className="fa-solid fa-user"></i>}>
                        View Profile
                      </MenuItem>
                    </ProfileModal>
                  ) : (
                    <UpdateGroupChatModal
                      fetchMessages={fetchMessages}
                      fetchAgain={fetchAgain}
                      setFetchAgain={setFetchAgain}
                    >
                      <MenuItem borderRadius="lg" icon={<i className="fa-solid fa-gear"></i>}>
                        Group Settings
                      </MenuItem>
                    </UpdateGroupChatModal>
                  )}
                  <MenuItem
                    borderRadius="lg"
                    icon={<i className="fa-solid fa-broom"></i>}
                    color="red.500"
                    onClick={onClearChatOpen}
                  >
                    Clear Chat History
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Box>

          {/* Pinned Messages Banner */}
          {pinnedMessages.length > 0 && (
            <Box
              w="100%"
              bg="yellow.50"
              borderBottom="1px solid"
              borderColor="yellow.200"
              px={3}
              py={1.5}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <HStack spacing={2} overflow="hidden" flex="1">
                <i className="fa-solid fa-thumbtack" style={{ color: "#ca8a04", fontSize: "11px" }}></i>
                <Box overflow="hidden" flex="1">
                  <Text fontSize="xs" fontWeight="700" color="yellow.900" isTruncated>
                    Pinned Message {pinnedMessages.length > 1 && `(${pinnedIndex + 1}/${pinnedMessages.length})`}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="yellow.800"
                    isTruncated
                    cursor="pointer"
                    onClick={() => {
                      const msg = pinnedMessages[pinnedIndex % pinnedMessages.length];
                      if (msg) {
                        const el = document.getElementById(`msg-${msg._id}`);
                        el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                  >
                    {pinnedMessages[pinnedIndex % pinnedMessages.length]?.content || "Pinned attachment"}
                  </Text>
                </Box>
              </HStack>

              <HStack spacing={1}>
                {pinnedMessages.length > 1 && (
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={<i className="fa-solid fa-chevron-right" style={{ fontSize: "9px" }}></i>}
                    onClick={() => setPinnedIndex((prev) => (prev + 1) % pinnedMessages.length)}
                    aria-label="Next Pinned"
                  />
                )}
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={<CloseIcon boxSize="7px" />}
                  onClick={() => handlePinMessage(pinnedMessages[pinnedIndex % pinnedMessages.length]?._id)}
                  title="Unpin"
                  aria-label="Unpin"
                />
              </HStack>
            </Box>
          )}

          {/* In-Chat Message Search Bar */}
          {showSearch && (
            <Box w="100%" py={2} px={1}>
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                  <i className="fa-solid fa-magnifying-glass" style={{ color: "#94a3b8", fontSize: "12px" }}></i>
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

          {/* Messages Feed Area */}
          <Box
            ref={messagesContainerRef}
            onScroll={handleScroll}
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
                w={14}
                h={14}
                alignSelf="center"
                margin="auto"
                color="blue.500"
                thickness="3px"
              />
            ) : (
              <div className="messages" style={{ overflowY: "auto", flex: 1 }}>
                <ScrollableChat
                  messages={filteredMessages}
                  handleReaction={handleReaction}
                  handleDeleteMessage={handleDeleteMessage}
                  handleReplyMessage={handleReplyMessage}
                  handleEditMessage={handleEditMessage}
                  handlePinMessage={handlePinMessage}
                />
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Scroll-To-Bottom Floating Button */}
            {showScrollBottom && (
              <IconButton
                position="absolute"
                bottom="75px"
                right="20px"
                size="sm"
                borderRadius="full"
                colorScheme="blue"
                boxShadow="lg"
                icon={<i className="fa-solid fa-arrow-down"></i>}
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
                zIndex={10}
              />
            )}

            {/* Live Typing Animation */}
            {isTyping && (
              <Box mb={2} ml={1} display="flex" alignItems="center">
                <Lottie
                  options={defaultOptions}
                  width={55}
                  height={25}
                  style={{ marginLeft: 0 }}
                />
              </Box>
            )}

            {/* Replying Preview Bar */}
            {replyingMessage && (
              <Box
                mb={2}
                p={2}
                bg="blue.50"
                borderLeft="3px solid"
                borderColor="blue.500"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box overflow="hidden">
                  <Text fontSize="10px" fontWeight="700" color="blue.600">
                    Replying to {replyingMessage.sender?.name || "User"}
                  </Text>
                  <Text fontSize="xs" color="gray.600" isTruncated>
                    {replyingMessage.content || "Attachment"}
                  </Text>
                </Box>
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={<CloseIcon boxSize="8px" />}
                  onClick={() => setReplyingMessage(null)}
                  aria-label="Cancel Reply"
                />
              </Box>
            )}

            {/* Editing Preview Bar */}
            {editingMessage && (
              <Box
                mb={2}
                p={2}
                bg="purple.50"
                borderLeft="3px solid"
                borderColor="purple.500"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box overflow="hidden">
                  <Text fontSize="10px" fontWeight="700" color="purple.600">
                    Editing Message
                  </Text>
                  <Text fontSize="xs" color="gray.600" isTruncated>
                    {editingMessage.content}
                  </Text>
                </Box>
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={<CloseIcon boxSize="8px" />}
                  onClick={() => {
                    setEditingMessage(null);
                    setNewMessage("");
                  }}
                  aria-label="Cancel Edit"
                />
              </Box>
            )}

            {/* Attached File/Image Preview Chip */}
            {attachedFile && (
              <Box
                mb={2}
                p={2.5}
                bg="white"
                borderRadius="xl"
                boxShadow="md"
                display="inline-flex"
                alignItems="center"
                gap={3}
                maxW="260px"
                position="relative"
                borderWidth="1px"
                borderColor="gray.200"
              >
                {attachedFile.type === "image" ? (
                  <Image
                    src={attachedFile.url}
                    alt="Preview"
                    maxH="50px"
                    borderRadius="md"
                  />
                ) : (
                  <Box p={2} bg="blue.50" borderRadius="md" color="blue.600">
                    <i
                      className={`fa-solid ${
                        attachedFile.type === "audio" ? "fa-microphone" : "fa-file"
                      }`}
                    ></i>
                  </Box>
                )}
                <Box overflow="hidden" flex="1">
                  <Text fontSize="xs" fontWeight="600" isTruncated>
                    {attachedFile.name}
                  </Text>
                  <Text fontSize="10px" color="gray.500">
                    Encrypted on send
                  </Text>
                </Box>
                <IconButton
                  size="xs"
                  colorScheme="red"
                  variant="solid"
                  borderRadius="full"
                  icon={<CloseIcon boxSize="8px" />}
                  onClick={() => setAttachedFile(null)}
                  aria-label="Remove Attachment"
                />
              </Box>
            )}

            {/* Hidden File Input for Picker */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e.target.files[0])}
            />

            {/* Bottom Input / Voice Recording Bar */}
            {isRecording ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={3}
                bg="white"
                borderRadius="full"
                boxShadow="md"
                mt={2}
                border="2px solid #ef4444"
              >
                <HStack spacing={3}>
                  <Box
                    as="span"
                    w="10px"
                    h="10px"
                    bg="red.500"
                    borderRadius="full"
                    animation="pulse-online 1s infinite"
                  />
                  <Text fontSize="sm" fontWeight="700" color="red.500">
                    Recording: {formatDuration(recordingDuration)}
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    onClick={cancelRecording}
                    borderRadius="full"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    borderRadius="full"
                    leftIcon={<i className="fa-solid fa-paper-plane"></i>}
                    onClick={stopAndSendRecording}
                    isLoading={uploadingFile}
                  >
                    Send Voice Note
                  </Button>
                </HStack>
              </Box>
            ) : (
              <FormControl
                onKeyDown={sendMessage}
                id="message-input"
                isRequired
                mt={2}
              >
                <InputGroup size="md">
                  {/* Attachment Menu (Files, Photos, Audio) */}
                  <InputLeftElement width="50px" pl={2}>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        size="sm"
                        variant="ghost"
                        borderRadius="full"
                        aria-label="Attach Menu"
                        icon={
                          uploadingFile ? (
                            <Spinner size="xs" color="blue.500" />
                          ) : (
                            <i className="fa-solid fa-paperclip" style={{ color: "#64748b" }}></i>
                          )
                        }
                        isLoading={uploadingFile}
                      />
                      <MenuList p={2} borderRadius="xl" boxShadow="2xl" minW="160px">
                        <MenuItem
                          borderRadius="lg"
                          icon={<i className="fa-solid fa-image" style={{ color: "#3b82f6" }}></i>}
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = "image/*";
                              fileInputRef.current.click();
                            }
                          }}
                        >
                          Photo / Image
                        </MenuItem>
                        <MenuItem
                          borderRadius="lg"
                          icon={<i className="fa-solid fa-file" style={{ color: "#10b981" }}></i>}
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = "*/*";
                              fileInputRef.current.click();
                            }
                          }}
                        >
                          Document / File
                        </MenuItem>
                        <MenuItem
                          borderRadius="lg"
                          icon={<i className="fa-solid fa-music" style={{ color: "#a855f7" }}></i>}
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = "audio/*";
                              fileInputRef.current.click();
                            }
                          }}
                        >
                          Audio File
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </InputLeftElement>

                  <Input
                    variant="filled"
                    bg="white"
                    placeholder={
                      editingMessage
                        ? "Edit your message..."
                        : replyingMessage
                        ? `Reply to ${replyingMessage.sender?.name || "User"}...`
                        : "Type an encrypted message..."
                    }
                    value={newMessage}
                    onChange={typingHandler}
                    borderRadius="full"
                    pl="52px"
                    pr="88px"
                    py={5}
                    boxShadow="sm"
                    _focus={{
                      bg: "white",
                      borderColor: editingMessage ? "purple.400" : "blue.400",
                      boxShadow: editingMessage ? "0 0 0 1px #a855f7" : "0 0 0 1px #3b82f6",
                    }}
                  />

                  <InputRightElement width="84px" pr={2} display="flex" gap={1}>
                    {/* Voice Note Recording Button */}
                    <Tooltip label="Hold/Click to record voice note" hasArrow>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorScheme="gray"
                        borderRadius="full"
                        icon={<i className="fa-solid fa-microphone" style={{ color: "#64748b" }}></i>}
                        onClick={startRecording}
                        aria-label="Record Audio"
                      />
                    </Tooltip>

                    {/* Send / Save Button */}
                    <IconButton
                      size="sm"
                      colorScheme={editingMessage ? "purple" : "blue"}
                      borderRadius="full"
                      icon={
                        editingMessage ? (
                          <i className="fa-solid fa-check" style={{ color: "white" }}></i>
                        ) : (
                          <i className="fa-solid fa-paper-plane" style={{ color: "white" }}></i>
                        )
                      }
                      onClick={sendMessage}
                      aria-label="Send Message"
                      isDisabled={!newMessage.trim() && !attachedFile}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            )}
          </Box>

          {/* Clear Chat Confirmation Modal */}
          <Modal isOpen={isClearChatOpen} onClose={onClearChatClose} isCentered size="sm">
            <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
            <ModalContent borderRadius="2xl" mx={4} overflow="hidden">
              <ModalHeader fontSize="lg" fontWeight="700" pt={5} pb={2} textAlign="center">
                <i
                  className="fa-solid fa-broom"
                  style={{ color: "#ef4444", fontSize: "28px", display: "block", marginBottom: "8px" }}
                ></i>
                Clear Conversation History?
              </ModalHeader>
              <ModalBody textAlign="center" color="gray.600" fontSize="sm" py={2}>
                This will delete messages in this chat. This action cannot be undone.
              </ModalBody>
              <ModalFooter display="flex" justifyContent="center" gap={3} pt={4} pb={5}>
                <Button variant="ghost" onClick={onClearChatClose} borderRadius="lg" px={5}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleClearChat} borderRadius="lg" px={5}>
                  Clear History
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
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
            p={6}
            bg="blue.50"
            borderRadius="full"
            boxShadow="inner"
            mb={4}
            color="blue.500"
          >
            <i className="fa-solid fa-shield-halved" style={{ fontSize: "48px" }}></i>
          </Box>
          <Text fontSize="2xl" fontWeight="700" fontFamily="Work sans" color="gray.800" mb={1}>
            Chat-To-Talk
          </Text>
          <HStack justify="center" spacing={1} mb={3} color="blue.600">
            <i className="fa-solid fa-lock" style={{ fontSize: "12px" }}></i>
            <Text fontSize="xs" fontWeight="700" letterSpacing="wide">
              END-TO-END ENCRYPTED
            </Text>
          </HStack>
          <Text fontSize="sm" maxW="360px" color="gray.500">
            Your personal messages and audio notes are secured with AES-256-GCM encryption.
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;