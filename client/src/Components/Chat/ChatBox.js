import React from "react";
import { ChatState } from "../../Context/ChatProvider";
import { Box } from "@chakra-ui/react";
import SingleChat from "../Chat/SingleChat.js";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat, isDark } = ChatState();

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={4}
      bg={isDark ? "rgba(17, 24, 39, 0.96)" : "rgba(255, 255, 255, 0.95)"}
      backdropFilter="blur(16px)"
      w={{ base: "100%", md: "66%", lg: "69%" }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={isDark ? "rgba(255, 255, 255, 0.08)" : "gray.200"}
      boxShadow={isDark ? "0 10px 30px rgba(0, 0, 0, 0.35)" : "0 10px 30px rgba(0, 0, 0, 0.06)"}
      h="100%"
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
    </Box>
  );
};

export default ChatBox;