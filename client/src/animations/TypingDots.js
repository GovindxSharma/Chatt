import React from "react";
import { Box } from "@chakra-ui/react";

/**
 * Lightweight, zero-dependency, high-performance CSS typing indicator.
 * Eliminates lottie-web bundle weight (~300KB) and avoids eval() security warnings in Lighthouse.
 */
const TypingDots = () => {
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      gap="4px"
      bg="white"
      px="12px"
      py="8px"
      borderRadius="full"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
      aria-label="User is typing..."
      role="status"
    >
      <Box as="span" className="typing-dot" />
      <Box as="span" className="typing-dot" style={{ animationDelay: "0.2s" }} />
      <Box as="span" className="typing-dot" style={{ animationDelay: "0.4s" }} />
    </Box>
  );
};

export default TypingDots;
