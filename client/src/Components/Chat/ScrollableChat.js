import React, { useState } from "react";
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

// Custom Audio Player for Voice Messages
const AudioMessagePlayer = ({ audioUrl, isSender }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      bg={isSender ? "rgba(255, 255, 255, 0.2)" : "gray.100"}
      p={2}
      borderRadius="xl"
      minW="180px"
      maxW="260px"
      my={1}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
      <IconButton
        size="sm"
        borderRadius="full"
        colorScheme={isSender ? "whiteAlpha" : "blue"}
        variant={isSender ? "solid" : "solid"}
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
        icon={
          <i
            className={isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}
            style={{ color: isSender ? "#1e293b" : "white" }}
          ></i>
        }
      />
      <Box flex="1">
        <HStack spacing={1}>
          <i className="fa-solid fa-waveform" style={{ fontSize: "12px", opacity: 0.8 }}></i>
          <Text fontSize="xs" fontWeight="600">
            Voice Note
          </Text>
        </HStack>
        <Text fontSize="10px" opacity={0.75}>
          {isPlaying ? "Playing..." : "Tap to listen"}
        </Text>
      </Box>
    </Box>
  );
};

// Document / File Message Card
const FileMessageCard = ({ fileUrl, fileName, isSender }) => {
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
        bg={isSender ? "rgba(255, 255, 255, 0.2)" : "gray.100"}
        p={2.5}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={isSender ? "whiteAlpha.300" : "gray.200"}
        minW="180px"
        maxW="260px"
        transition="all 0.2s"
        _hover={{ transform: "translateY(-1px)", shadow: "sm" }}
      >
        <Box
          p={2}
          bg={isSender ? "rgba(255, 255, 255, 0.3)" : "blue.100"}
          borderRadius="lg"
          color={isSender ? "white" : "blue.600"}
        >
          <i className={`fa-solid ${getFileIcon(fileName)}`} style={{ fontSize: "18px" }}></i>
        </Box>
        <Box flex="1" overflow="hidden">
          <Text fontSize="xs" fontWeight="600" isTruncated>
            {fileName || "Attachment"}
          </Text>
          <HStack spacing={1}>
            <i className="fa-solid fa-download" style={{ fontSize: "10px", opacity: 0.7 }}></i>
            <Text fontSize="10px" opacity={0.8}>
              Download file
            </Text>
          </HStack>
        </Box>
      </Box>
    </Link>
  );
};

const ScrollableChat = ({ messages, handleReaction, handleDeleteMessage }) => {
  const { user } = ChatState();
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

            const isAudio = m.fileType === "audio" || m.fileUrl?.includes("audio") || m.fileUrl?.endsWith(".webm") || m.fileUrl?.endsWith(".mp3") || m.fileUrl?.endsWith(".wav");
            const isImage = (m.fileType === "image" || (m.fileUrl && !isAudio && !m.fileType?.includes("file"))) && !m.isDeleted;
            const isFile = m.fileType === "file" && !m.isDeleted;

            return (
              <div
                className="message-bubble-wrapper"
                key={m._id || i}
                style={{
                  justifyContent: isSender ? "flex-end" : "flex-start",
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
                    {m.content && (
                      <button
                        className="action-btn"
                        onClick={() => copyToClipboard(m.content)}
                        title="Copy text"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    )}
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
                    backgroundColor: isSender ? "#3b82f6" : "#ffffff",
                    backgroundImage: isSender
                      ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                      : "none",
                    color: isSender ? "#ffffff" : "#1e293b",
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
                      : "0 2px 8px rgba(0, 0, 0, 0.05)",
                    border: isSender ? "none" : "1px solid #e2e8f0",
                    position: "relative",
                  }}
                >
                  {/* Sender Name in group chat */}
                  {!isSender && m.chat?.isGroupChat && (
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      color="blue.600"
                      mb={0.5}
                    >
                      {m.sender?.name}
                    </Text>
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
                      {m.content}
                    </Text>
                  )}

                  {/* Timestamp & Delivery Checkmark */}
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="center"
                    gap={1}
                    mt={1}
                  >
                    <Text
                      fontSize="9px"
                      color={isSender ? "whiteAlpha.800" : "gray.400"}
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
