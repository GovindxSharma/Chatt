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
} from "@chakra-ui/react";
import { ArrowBackIcon, CloseIcon } from "@chakra-ui/icons";
import { getSenderFull, getSender } from "../../config/ChatLogics";
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

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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

  // Upload file or image
  const handleFileUpload = (file, explicitType = "") => {
    if (!file) return;
    setUploadingFile(true);

    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    const determinedType = explicitType || (isImage ? "image" : isAudio ? "audio" : "file");

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "chat-app");
    data.append("cloud_name", "ddnwjdqbf");

    // Cloudinary upload (auto resource type handles images, video, raw documents)
    const resourceType = isImage ? "image" : isAudio ? "video" : "auto";

    fetch(`https://api.cloudinary.com/v1_1/ddnwjdqbf/${resourceType}/upload`, {
      method: "post",
      body: data,
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.url || resData.secure_url) {
          const finalUrl = (resData.secure_url || resData.url).toString();
          setAttachedFile({
            url: finalUrl,
            type: determinedType,
            name: file.name || "Attachment",
          });
          toast({
            title: "File Attached",
            status: "success",
            duration: 2000,
            isClosable: true,
          });
        }
        setUploadingFile(false);
      })
      .catch(() => {
        setUploadingFile(false);
        toast({
          title: "Upload Failed",
          description: "Could not upload file",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        handleFileUpload(audioFile, "audio");
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record voice notes",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      setRecordingDuration(0);
    }
  };

  // Format recording duration timer (MM:SS)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Send message
  const sendMessage = async (event) => {
    if (
      (event?.key === "Enter" || event?.type === "click") &&
      (newMessage.trim() || attachedFile)
    ) {
      if (socketConnected && selectedChat) {
        socket.emit("stop typing", selectedChat._id);
      }

      const contentToSend = newMessage.trim();
      const fileToSend = attachedFile;

      setNewMessage("");
      setAttachedFile(null);

      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        const payload = {
          content: contentToSend || (fileToSend ? fileToSend.name : ""),
          chatId: selectedChat._id,
          fileUrl: fileToSend?.url || "",
          fileType: fileToSend?.type || "",
          fileName: fileToSend?.name || "",
        };

        const { data } = await axios.post("/api/message", payload, config);

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

      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? data : msg))
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
    cancelRecording();
    // eslint-disable-next-line
  }, [selectedChat]);

  // Real-time socket event listeners
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
                />
              </div>
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
                    Ready to send
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
              /* Live Voice Recording UI */
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
                    Recording... {formatDuration(recordingDuration)}
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
                  <IconButton
                    size="sm"
                    colorScheme="red"
                    borderRadius="full"
                    icon={<i className="fa-solid fa-stop"></i>}
                    onClick={stopRecording}
                    aria-label="Stop & Attach Voice Note"
                  />
                </HStack>
              </Box>
            ) : (
              /* Standard Input Bar */
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
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={typingHandler}
                    borderRadius="full"
                    pl="52px"
                    pr="88px"
                    py={5}
                    boxShadow="sm"
                    _focus={{
                      bg: "white",
                      borderColor: "blue.400",
                      boxShadow: "0 0 0 1px #3b82f6",
                    }}
                  />

                  <InputRightElement width="84px" pr={2} display="flex" gap={1}>
                    {/* Voice Note Recording Button */}
                    <Tooltip label="Record Voice Note" hasArrow>
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

                    {/* Send Button */}
                    <IconButton
                      size="sm"
                      colorScheme="blue"
                      borderRadius="full"
                      icon={<i className="fa-solid fa-paper-plane" style={{ color: "white" }}></i>}
                      onClick={sendMessage}
                      aria-label="Send Message"
                      isDisabled={!newMessage.trim() && !attachedFile}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            )}
          </Box>
        </>
      ) : (
        /* Empty Conversation State */
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
            <i className="fa-solid fa-comments" style={{ fontSize: "48px" }}></i>
          </Box>
          <Text fontSize="2xl" fontWeight="700" fontFamily="Work sans" color="gray.800" mb={2}>
            Chat-To-Talk
          </Text>
          <Text fontSize="md" maxW="360px" color="gray.500">
            Select a conversation or search for users to start instant messaging!
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;