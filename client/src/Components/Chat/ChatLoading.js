import React from "react";
import { Stack, Box, HStack, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";

const ChatLoading = ({ count = 7 }) => {
  const { isDark } = ChatState() || {};

  const startColor = isDark ? "gray.800" : "gray.100";
  const endColor = isDark ? "gray.700" : "gray.200";

  return (
    <Stack spacing={2.5} px={1} py={1} w="100%">
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          p={3}
          borderRadius="xl"
          bg={isDark ? "gray.800" : "white"}
          borderWidth="1px"
          borderColor={isDark ? "gray.700" : "gray.100"}
          boxShadow="xs"
        >
          <HStack spacing={3} align="center">
            {/* Avatar Circle Skeleton */}
            <SkeletonCircle
              size="10"
              startColor={startColor}
              endColor={endColor}
              flexShrink={0}
            />

            {/* Content Lines */}
            <Box flex="1">
              <HStack justify="space-between" mb={1.5}>
                <Skeleton
                  height="14px"
                  width={i % 2 === 0 ? "45%" : "60%"}
                  borderRadius="md"
                  startColor={startColor}
                  endColor={endColor}
                />
                <Skeleton
                  height="11px"
                  width="18%"
                  borderRadius="md"
                  startColor={startColor}
                  endColor={endColor}
                />
              </HStack>

              <HStack justify="space-between">
                <Skeleton
                  height="12px"
                  width={i % 3 === 0 ? "75%" : "50%"}
                  borderRadius="md"
                  startColor={startColor}
                  endColor={endColor}
                />
                {i % 3 === 0 && (
                  <SkeletonCircle
                    size="4"
                    startColor={startColor}
                    endColor={endColor}
                  />
                )}
              </HStack>
            </Box>
          </HStack>
        </Box>
      ))}
    </Stack>
  );
};

export default ChatLoading;
