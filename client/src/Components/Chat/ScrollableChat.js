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

  const QUICK_EMOJIS = ["❤️", "👍", "😂", "🔥", "😮"];

  return (
    <>
      <ScrollableFeed>
        {messages &&
          messages.map((m, i) => {
            const isSender = m.sender?._id === user?._id;
            const hasReactions = m.reactions && m.reactions.length > 0;

            // Group reactions by emoji
            const reactionCounts = {};
            if (hasReactions) {
              m.reactions.forEach((r) => {
                reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
              });
            }

            return (
              <div
                className="message-bubble-wrapper"
                key={m._id || i}
                style={{
                  justifyContent: isSender ? "flex-end" : "flex-start",
                }}
              >
                {/* Avatar for receiver */}
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

                {/* Message Actions Menu on Hover */}
                {!m.isDeleted && (
                  <div
                    className={`message-actions ${
                      isSender ? "message-actions-sender" : "message-actions-receiver"
                    }`}
                  >
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        className="action-btn"
                        onClick={() => handleReaction && handleReaction(m._id, emoji)}
                        title={`React ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                    {m.content && (
                      <button
                        className="action-btn"
                        onClick={() => copyToClipboard(m.content)}
                        title="Copy text"
                      >
                        📋
                      </button>
                    )}
                    {isSender && handleDeleteMessage && (
                      <button
                        className="action-btn"
                        onClick={() => handleDeleteMessage(m._id)}
                        title="Delete message"
                        style={{ color: "#f87171" }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}

                {/* Main Message Bubble */}
                <div
                  style={{
                    backgroundColor: isSender ? "#6366f1" : "#ffffff",
                    backgroundImage: isSender
                      ? "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)"
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
                    maxWidth: "75%",
                    boxShadow: isSender
                      ? "0 3px 12px rgba(99, 102, 241, 0.25)"
                      : "0 2px 8px rgba(0, 0, 0, 0.05)",
                    border: isSender ? "none" : "1px solid #e2e8f0",
                    position: "relative",
                  }}
                >
                  {/* Sender Name in group chat if receiver */}
                  {!isSender && m.chat?.isGroupChat && (
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      color="purple.600"
                      mb={0.5}
                    >
                      {m.sender?.name}
                    </Text>
                  )}

                  {/* Image Attachment Preview */}
                  {m.fileUrl && !m.isDeleted && (
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
                        fallbackSrc="https://via.placeholder.com/300x200?text=Loading+Image..."
                      />
                    </Box>
                  )}

                  {/* Text Content */}
                  <Text
                    fontSize="sm"
                    lineHeight="1.4"
                    fontStyle={m.isDeleted ? "italic" : "normal"}
                    opacity={m.isDeleted ? 0.7 : 1}
                    wordBreak="break-word"
                  >
                    {m.content}
                  </Text>

                  {/* Timestamp & Status */}
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
                      <Text
                        fontSize="9px"
                        color="whiteAlpha.900"
                        title="Delivered"
                      >
                        ✓
                      </Text>
                    )}
                  </Box>

                  {/* Emoji Reactions List */}
                  {hasReactions && !m.isDeleted && (
                    <div className="reactions-container">
                      {Object.entries(reactionCounts).map(([emoji, count]) => {
                        const userReacted = m.reactions.some(
                          (r) => r.user?._id === user?._id && r.emoji === emoji
                        );
                        return (
                          <span
                            key={emoji}
                            className={`reaction-badge ${
                              userReacted ? "user-reacted" : ""
                            }`}
                            onClick={() =>
                              handleReaction && handleReaction(m._id, emoji)
                            }
                            title="Click to toggle reaction"
                          >
                            <span>{emoji}</span>
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

      {/* Full Size Image Preview Modal */}
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
