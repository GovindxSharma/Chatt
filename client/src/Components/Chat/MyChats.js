import React, { useEffect, useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import axios from "axios";
import {
  Box,
  Button,
  useToast,
  Stack,
  Text,
  Avatar,
  AvatarBadge,
  HStack,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import ChatLoading from "./ChatLoading";
import { getSender, getSenderFull, formatMessageTime } from "../../config/ChatLogics";
import GroupChatModal from "../Miscellaneous/GroupChatModal.js";

const MyChats = ({ fetchAgain }) => {
  const toast = useToast();
  const [loggedUser, setLoggedUser] = useState(null);
  const { selectedChat, setSelectedChat, user, chats, setChats, onlineUsers } =
    ChatState();

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
    } catch (e) {}
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      p={4}
      bg="rgba(255, 255, 255, 0.9)"
      backdropFilter="blur(16px)"
      w={{ base: "100%", md: "32%", lg: "30%" }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="whiteAlpha.400"
      boxShadow="0 10px 30px rgba(0, 0, 0, 0.08)"
      h="100%"
    >
      <Box
        pb={3}
        px={1}
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Text fontSize={{ base: "xl", lg: "2xl" }} fontWeight="800" color="gray.800">
          Messages
        </Text>
        <GroupChatModal>
          <Button
            size="sm"
            colorScheme="purple"
            variant="solid"
            borderRadius="full"
            fontSize="12px"
            fontWeight="600"
            rightIcon={<AddIcon boxSize="9px" />}
            boxShadow="0 4px 12px rgba(99, 102, 241, 0.3)"
          >
            New Group
          </Button>
        </GroupChatModal>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        pt={3}
        w="100%"
        h="100%"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="auto" spacing={2} pr={1}>
            {chats.length === 0 && (
              <Box textAlign="center" py={12} px={4} color="gray.500">
                <Text fontSize="2xl" mb={2}>💬</Text>
                <Text fontWeight="600">No conversations yet</Text>
                <Text fontSize="xs" mt={1}>Search users to start chatting!</Text>
              </Box>
            )}
            {chats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              const senderUser = !chat.isGroupChat
                ? getSenderFull(loggedUser, chat.users)
                : null;
              const isOnline = senderUser && onlineUsers?.includes(senderUser._id);

              return (
                <Box
                  onClick={() => setSelectedChat(chat)}
                  cursor="pointer"
                  bg={
                    isSelected
                      ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                      : "rgba(248, 250, 252, 0.85)"
                  }
                  color={isSelected ? "white" : "gray.800"}
                  px={3.5}
                  py={3}
                  borderRadius="xl"
                  key={chat._id}
                  borderWidth="1px"
                  borderColor={isSelected ? "purple.400" : "gray.200"}
                  boxShadow={isSelected ? "0 4px 14px rgba(99, 102, 241, 0.35)" : "sm"}
                  _hover={{
                    transform: isSelected ? "none" : "translateY(-1px)",
                    boxShadow: "md",
                  }}
                  transition="all 0.15s ease"
                >
                  <HStack spacing={3} align="center">
                    <Avatar
                      size="sm"
                      name={
                        !chat.isGroupChat
                          ? getSender(loggedUser, chat.users)
                          : chat.chatName
                      }
                      src={senderUser?.pic}
                      bg={chat.isGroupChat ? "purple.500" : undefined}
                    >
                      {!chat.isGroupChat && (
                        <AvatarBadge
                          boxSize="1em"
                          bg={isOnline ? "green.500" : "gray.400"}
                          borderColor="white"
                        />
                      )}
                    </Avatar>

                    <Box flex="1" overflow="hidden">
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Text
                          fontWeight="700"
                          fontSize="sm"
                          isTruncated
                          color={isSelected ? "white" : "gray.800"}
                        >
                          {!chat.isGroupChat
                            ? getSender(loggedUser, chat.users)
                            : chat.chatName}
                        </Text>
                        {chat.latestMessage && (
                          <Text
                            fontSize="10px"
                            opacity={0.8}
                            color={isSelected ? "whiteAlpha.800" : "gray.500"}
                            flexShrink={0}
                            ml={2}
                          >
                            {formatMessageTime(chat.latestMessage.createdAt)}
                          </Text>
                        )}
                      </Box>

                      {chat.latestMessage ? (
                        <Text
                          fontSize="xs"
                          opacity={isSelected ? 0.9 : 0.7}
                          isTruncated
                          color={isSelected ? "whiteAlpha.900" : "gray.600"}
                        >
                          <span style={{ fontWeight: 600 }}>
                            {chat.latestMessage.sender?._id === user?._id
                              ? "You: "
                              : `${chat.latestMessage.sender?.name?.split(" ")[0] || "User"}: `}
                          </span>
                          {chat.latestMessage.fileUrl && !chat.latestMessage.content
                            ? "📷 Attachment"
                            : chat.latestMessage.content}
                        </Text>
                      ) : (
                        <Text
                          fontSize="xs"
                          opacity={0.6}
                          fontStyle="italic"
                          color={isSelected ? "whiteAlpha.700" : "gray.400"}
                        >
                          Start the conversation...
                        </Text>
                      )}
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