import React, { useState, useRef } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import {
  Box,
  Image,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  HStack,
  IconButton,
  Link,
  Button,
} from "@chakra-ui/react";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
  formatMessageTime,
} from "../../config/ChatLogics.js";
import { ChatState } from "../../Context/ChatProvider.js";

// Enhanced Audio Player with Dynamic Waveform & 1x / 1.5x / 2x Speed Controls
const AudioMessagePlayer = ({ audioUrl, isSender }) => {
  const { isDark } = ChatState() || {};
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const cycleSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box
      display="flex"
      flexDir="column"
      gap={1.5}
      bg={isSender ? "rgba(255, 255, 255, 0.22)" : isDark ? "#0f172a" : "gray.100"}
      p={2.5}
      borderRadius="xl"
      minW="220px"
      maxW="290px"
      my={1}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
      />

      <Box display="flex" alignItems="center" gap={2}>
        <IconButton
          size="sm"
          borderRadius="full"
          colorScheme={isSender ? "whiteAlpha" : "blue"}
          variant="solid"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          icon={
            <i
              className={isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}
              style={{ color: isSender ? "#1e293b" : "white", fontSize: "11px" }}
            ></i>
          }
        />

        {/* Dynamic Waveform Bars Animation */}
        <Box flex="1" display="flex" alignItems="center" gap="3px" h="20px">
          {[14, 20, 10, 18, 12, 22, 8, 16, 14, 20].map((h, idx) => (
            <Box
              key={idx}
              w="3px"
              h={isPlaying ? `${Math.max(6, (h * (idx % 2 === 0 ? 1.2 : 0.8)))}px` : `${h * 0.6}px`}
              bg={isSender ? "white" : "blue.500"}
              borderRadius="full"
              opacity={progressPercent > idx * 10 ? 1 : 0.4}
              transition="all 0.15s ease"
            />
          ))}
        </Box>

        {/* Speed Toggle Button */}
        <Button
          size="xs"
          fontSize="9px"
          fontWeight="bold"
          borderRadius="full"
          variant="ghost"
          color={isSender ? "white" : isDark ? "blue.300" : "blue.600"}
          bg={isSender ? "whiteAlpha.300" : isDark ? "gray.800" : "blue.50"}
          px={1.5}
          h="20px"
          onClick={cycleSpeed}
          _hover={{ opacity: 0.8 }}
        >
          {playbackSpeed}x
        </Button>
      </Box>

      {/* Interactive Progress Scrub Bar & Time Counter */}
      <Box
        w="100%"
        h="4px"
        bg={isSender ? "whiteAlpha.400" : isDark ? "gray.700" : "gray.300"}
        borderRadius="full"
        cursor="pointer"
        onClick={handleSeek}
        position="relative"
      >
        <Box
          w={`${progressPercent}%`}
          h="100%"
          bg={isSender ? "white" : "blue.500"}
          borderRadius="full"
        />
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" px={0.5}>
        <Text fontSize="9px" opacity={0.85} color={isSender ? "whiteAlpha.900" : isDark ? "gray.300" : "gray.600"} fontWeight="500">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>
        <HStack spacing={1}>
          <i className="fa-solid fa-microphone" style={{ fontSize: "9px", opacity: 0.85, color: isSender ? "white" : isDark ? "#93c5fd" : "#2563eb" }}></i>
          <Text fontSize="9px" opacity={0.85} color={isSender ? "whiteAlpha.900" : isDark ? "gray.300" : "gray.600"} fontWeight="600">
            Voice Note
          </Text>
        </HStack>
      </Box>
    </Box>
  );
};

// Document / File Message Card
const FileMessageCard = ({ fileUrl, fileName, isSender }) => {
  const { isDark } = ChatState() || {};
  const getFileIcon = (name) => {
    if (!name) return "fa-file";
    const ext = name.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext)) return "fa-file-pdf";
    if (["doc", "docx"].includes(ext)) return "fa-file-word";
    if (["xls", "xlsx"].includes(ext)) return "fa-file-excel";
    if (["zip", "rar", "7z"].includes(ext)) return "fa-file-zipper";
    if (["mp3", "wav", "ogg"].includes(ext)) return "fa-file-audio";
    if (["mp4", "mov", "avi"].includes(ext)) return "fa-file-video";
    return "fa-file";
  };

  return (
    <Link
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      _hover={{ textDecoration: "none" }}
      display="block"
      my={1}
    >
      <Box
        display="flex"
        alignItems="center"
        gap={3}
        bg={isSender ? "rgba(255, 255, 255, 0.2)" : isDark ? "#0f172a" : "gray.100"}
        p={2.5}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={isSender ? "whiteAlpha.300" : isDark ? "#334155" : "gray.200"}
        minW="180px"
        maxW="260px"
        transition="all 0.2s"
        _hover={{ transform: "translateY(-1px)", shadow: "sm" }}
      >
        <Box
          p={2}
          bg={isSender ? "rgba(255, 255, 255, 0.3)" : isDark ? "blue.900" : "blue.100"}
          borderRadius="lg"
          color={isSender ? "white" : isDark ? "blue.300" : "blue.600"}
        >
          <i className={`fa-solid ${getFileIcon(fileName)}`} style={{ fontSize: "18px" }}></i>
        </Box>
        <Box flex="1" overflow="hidden">
          <Text fontSize="xs" fontWeight="600" isTruncated color={isSender ? "white" : isDark ? "#f8fafc" : "#0f172a"}>
            {fileName || "Attachment"}
          </Text>
          <HStack spacing={1}>
            <i className="fa-solid fa-download" style={{ fontSize: "10px", opacity: 0.8, color: isSender ? "white" : isDark ? "#94a3b8" : "#64748b" }}></i>
            <Text fontSize="10px" opacity={0.8} color={isSender ? "whiteAlpha.900" : isDark ? "gray.400" : "gray.500"}>
              Download file
            </Text>
          </HStack>
        </Box>
      </Box>
    </Link>
  );
};

// Helper component to highlight search matches in message text
const HighlightedText = ({ text, query, isSender }) => {
  const { isDark } = ChatState() || {};
  if (!query || !query.trim() || !text) return <>{text}</>;
  const cleanQ = query.trim();
  const regex = new RegExp(`(${cleanQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = String(text).split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              backgroundColor: isSender
                ? "rgba(255, 255, 255, 0.3)"
                : isDark
                ? "#3b82f6"
                : "#fef3c7",
              color: isSender
                ? "#ffffff"
                : isDark
                ? "#ffffff"
                : "#78350f",
              padding: "0 2px",
              borderRadius: "3px",
              fontWeight: "600",
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const ScrollableChat = ({
  messages,
  searchQuery = "",
  handleReaction,
  handleDeleteMessage,
  handleReplyMessage,
  handleEditMessage,
  handlePinMessage,
}) => {
  const { user, isDark } = ChatState();
  const toast = useToast();
  const [previewImage, setPreviewImage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleImageClick = (url) => {
    setPreviewImage(url);
    onOpen();
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 1500,
      isClosable: true,
      position: "bottom",
    });
  };

  const scrollToMessage = (msgId) => {
    if (!msgId) return;
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background-color 0.5s ease";
      el.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
      setTimeout(() => {
        el.style.backgroundColor = "";
      }, 1500);
    }
  };

  const QUICK_ICONS = [
    { key: "like", icon: "fa-thumbs-up", label: "Like" },
    { key: "heart", icon: "fa-heart", label: "Heart" },
    { key: "fire", icon: "fa-fire", label: "Fire" },
    { key: "star", icon: "fa-star", label: "Star" },
    { key: "smile", icon: "fa-face-smile", label: "Smile" },
  ];

  return (
    <>
      <ScrollableFeed>
        {messages &&
          messages.map((m, i) => {
            const isSender = m.sender?._id === user?._id;
            const hasReactions = m.reactions && m.reactions.length > 0;

            const reactionCounts = {};
            if (hasReactions) {
              m.reactions.forEach((r) => {
                reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
              });
            }

            const isAudio =
              m.fileType === "audio" ||
              m.fileUrl?.startsWith("data:audio") ||
              m.fileUrl?.includes("audio") ||
              m.fileUrl?.endsWith(".webm") ||
              m.fileUrl?.endsWith(".mp3") ||
              m.fileUrl?.endsWith(".wav") ||
              m.fileUrl?.endsWith(".ogg") ||
              m.fileUrl?.endsWith(".m4a");

            const isImage =
              (m.fileType === "image" ||
                m.fileUrl?.startsWith("data:image") ||
                (m.fileUrl && !isAudio && !m.fileType?.includes("file"))) &&
              !m.isDeleted;

            const isFile = m.fileType === "file" && !m.isDeleted && !isAudio && !isImage;

            return (
              <div
                id={`msg-${m._id}`}
                className="message-bubble-wrapper"
                key={m._id || i}
                style={{
                  justifyContent: isSender ? "flex-end" : "flex-start",
                  borderRadius: "12px",
                  padding: "2px 4px",
                }}
              >
                {/* Receiver Avatar */}
                {!isSender &&
                  (isSameSender(messages, m, i, user?._id) ||
                    isLastMessage(messages, i, user?._id)) && (
                    <Tooltip label={m.sender?.name} placement="bottom-start" hasArrow>
                      <Avatar
                        mt="7px"
                        mr={2}
                        size="xs"
                        cursor="pointer"
                        name={m.sender?.name}
                        src={m.sender?.pic}
                      />
                    </Tooltip>
                  )}

                {/* Hover Action Bar with Vector Icons */}
                {!m.isDeleted && (
                  <div
                    className={`message-actions ${
                      isSender ? "message-actions-sender" : "message-actions-receiver"
                    }`}
                  >
                    {QUICK_ICONS.map(({ key, icon, label }) => (
                      <button
                        key={key}
                        className="action-btn"
                        onClick={() => handleReaction && handleReaction(m._id, key)}
                        title={label}
                      >
                        <i className={`fa-solid ${icon}`}></i>
                      </button>
                    ))}
                    {/* Reply Action */}
                    {handleReplyMessage && (
                      <button
                        className="action-btn"
                        onClick={() => handleReplyMessage(m)}
                        title="Reply"
                      >
                        <i className="fa-solid fa-reply"></i>
                      </button>
                    )}
                    {/* Pin Action */}
                    {handlePinMessage && (
                      <button
                        className="action-btn"
                        onClick={() => handlePinMessage(m._id)}
                        title={m.isPinned ? "Unpin message" : "Pin message"}
                        style={{ color: m.isPinned ? "#eab308" : undefined }}
                      >
                        <i className="fa-solid fa-thumbtack"></i>
                      </button>
                    )}
                    {/* Edit Action (for sender text messages) */}
                    {isSender && m.content && !isAudio && !isFile && !isImage && handleEditMessage && (
                      <button
                        className="action-btn"
                        onClick={() => handleEditMessage(m)}
                        title="Edit message"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                    )}
                    {/* Copy Text Action */}
                    {m.content && (
                      <button
                        className="action-btn"
                        onClick={() => copyToClipboard(m.content)}
                        title="Copy text"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    )}
                    {/* Delete Action */}
                    {isSender && handleDeleteMessage && (
                      <button
                        className="action-btn"
                        onClick={() => handleDeleteMessage(m._id)}
                        title="Delete message"
                        style={{ color: "#ef4444" }}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </div>
                )}

                {/* Bubble Container */}
                <div
                  style={{
                    backgroundColor: isSender ? "#2563eb" : isDark ? "#1e293b" : "#ffffff",
                    color: isSender ? "#ffffff" : isDark ? "#f8fafc" : "#0f172a",
                    marginLeft: !isSender
                      ? isSameSenderMargin(messages, m, i, user?._id)
                      : "auto",
                    marginTop: isSameUser(messages, m, i, user?._id) ? 3 : 8,
                    borderRadius: isSender
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    padding: "8px 14px",
                    maxWidth: "80%",
                    boxShadow: isSender
                      ? "0 3px 10px rgba(59, 130, 246, 0.25)"
                      : isDark
                      ? "0 2px 8px rgba(0, 0, 0, 0.35)"
                      : "0 2px 8px rgba(0, 0, 0, 0.05)",
                    border: isSender ? "none" : isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                    position: "relative",
                  }}
                >
                  {/* Sender Name in group chat */}
                  {!isSender && m.chat?.isGroupChat && (
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      color={isDark ? "blue.300" : "blue.600"}
                      mb={0.5}
                    >
                      {m.sender?.name}
                    </Text>
                  )}

                  {/* Pinned Message Chip */}
                  {m.isPinned && (
                    <Box
                      display="inline-flex"
                      alignItems="center"
                      gap={1}
                      px={2}
                      py={0.5}
                      bg={isSender ? "whiteAlpha.300" : isDark ? "yellow.900" : "yellow.100"}
                      color={isSender ? "yellow.200" : isDark ? "yellow.200" : "yellow.800"}
                      borderRadius="full"
                      fontSize="9px"
                      fontWeight="700"
                      mb={1}
                    >
                      <i className="fa-solid fa-thumbtack" style={{ fontSize: "8px" }}></i>
                      Pinned
                    </Box>
                  )}

                  {/* Quoted Reply Box */}
                  {m.replyTo && (
                    <Box
                      bg={isSender ? "rgba(0, 0, 0, 0.15)" : isDark ? "rgba(255, 255, 255, 0.07)" : "gray.50"}
                      borderLeft="3px solid"
                      borderColor={isSender ? "white" : "blue.500"}
                      p={1.5}
                      borderRadius="md"
                      mb={1.5}
                      cursor="pointer"
                      onClick={() => scrollToMessage(m.replyTo._id)}
                      _hover={{ opacity: 0.9 }}
                    >
                      <Text
                        fontSize="10px"
                        fontWeight="700"
                        color={isSender ? "whiteAlpha.900" : "blue.600"}
                      >
                        {m.replyTo.sender?.name || "User"}
                      </Text>
                      <Text
                        fontSize="10px"
                        opacity={0.85}
                        isTruncated
                        color={isSender ? "whiteAlpha.800" : "gray.600"}
                      >
                        {m.replyTo.content || (m.replyTo.fileType === "audio" ? "Voice message" : "Attachment")}
                      </Text>
                    </Box>
                  )}

                  {/* Audio / Voice Message */}
                  {isAudio && m.fileUrl && !m.isDeleted && (
                    <AudioMessagePlayer audioUrl={m.fileUrl} isSender={isSender} />
                  )}

                  {/* Image Attachment Preview */}
                  {isImage && m.fileUrl && !m.isDeleted && (
                    <Box mb={m.content ? 2 : 0} borderRadius="lg" overflow="hidden">
                      <Image
                        src={m.fileUrl}
                        alt="Attachment"
                        maxH="220px"
                        maxW="100%"
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => handleImageClick(m.fileUrl)}
                        _hover={{ opacity: 0.9 }}
                      />
                    </Box>
                  )}

                  {/* File / Document Card */}
                  {isFile && m.fileUrl && !m.isDeleted && (
                    <FileMessageCard
                      fileUrl={m.fileUrl}
                      fileName={m.fileName || m.content}
                      isSender={isSender}
                    />
                  )}

                  {/* Text Content */}
                  {m.content && (!isFile || m.content !== m.fileName) && (
                    <Text
                      fontSize="sm"
                      lineHeight="1.4"
                      fontStyle={m.isDeleted ? "italic" : "normal"}
                      opacity={m.isDeleted ? 0.7 : 1}
                      wordBreak="break-word"
                    >
                      <HighlightedText text={m.content} query={searchQuery} isSender={isSender} />
                    </Text>
                  )}

                  {/* Timestamp & Delivery Checkmark & E2EE Indicator & Edited Tag */}
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="center"
                    gap={1}
                    mt={1}
                  >
                    {m.isEdited && (
                      <Text
                        fontSize="8px"
                        fontStyle="italic"
                        color={isSender ? "whiteAlpha.700" : "gray.400"}
                        mr={0.5}
                      >
                        (edited)
                      </Text>
                    )}
                    <i
                      className="fa-solid fa-lock"
                      style={{
                        fontSize: "7px",
                        opacity: isSender ? 0.7 : 0.4,
                        color: isSender ? "white" : "#64748b",
                      }}
                      title="End-to-End Encrypted"
                    ></i>
                    <Text
                      fontSize="9px"
                      color={isSender ? "whiteAlpha.800" : isDark ? "gray.400" : "gray.500"}
                      fontWeight="500"
                    >
                      {formatMessageTime(m.createdAt)}
                    </Text>
                    {isSender && (
                      <i
                        className="fa-solid fa-check"
                        style={{ fontSize: "8px", opacity: 0.9 }}
                      ></i>
                    )}
                  </Box>

                  {/* Reactions with Vector Icons */}
                  {hasReactions && !m.isDeleted && (
                    <div className="reactions-container">
                      {Object.entries(reactionCounts).map(([reactionKey, count]) => {
                        const userReacted = m.reactions.some(
                          (r) => r.user?._id === user?._id && r.emoji === reactionKey
                        );
                        const iconData = QUICK_ICONS.find((q) => q.key === reactionKey) || { icon: "fa-heart" };

                        return (
                          <span
                            key={reactionKey}
                            className={`reaction-badge ${
                              userReacted ? "user-reacted" : ""
                            }`}
                            onClick={() =>
                              handleReaction && handleReaction(m._id, reactionKey)
                            }
                            title="Click to toggle reaction"
                          >
                            <i className={`fa-solid ${iconData.icon}`} style={{ fontSize: "10px" }}></i>
                            <span>{count}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </ScrollableFeed>

      {/* Full-Size Image Lightbox Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" size="lg" />
          <ModalBody p={0} display="flex" justifyContent="center">
            {previewImage && (
              <Image
                src={previewImage}
                alt="Enlarged Preview"
                maxH="80vh"
                maxW="90vw"
                borderRadius="xl"
                boxShadow="2xl"
                objectFit="contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScrollableChat;
