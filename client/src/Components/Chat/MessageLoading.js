import React from "react";
import { Box, VStack, HStack, Skeleton, SkeletonCircle, Center } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";

const MessageLoading = () => {
  const { isDark } = ChatState() || {};

  const startColor = isDark ? "gray.800" : "gray.100";
  const endColor = isDark ? "gray.700" : "gray.200";

  // Mock message bubble placeholders with alternating incoming/outgoing patterns
  const bubblePatterns = [
    { type: "receiver", width: "55%", lines: 2 },
    { type: "receiver", width: "35%", lines: 1 },
    { type: "sender", width: "45%", lines: 1 },
    { type: "sender", width: "65%", lines: 2 },
    { type: "divider", text: "Today" },
    { type: "receiver", width: "50%", lines: 2 },
    { type: "sender", width: "30%", lines: 1 },
    { type: "receiver", width: "60%", lines: 2 },
  ];

  return (
    <VStack
      spacing={3.5}
      w="100%"
      h="100%"
      p={4}
      justify="flex-end"
      align="stretch"
      overflow="hidden"
    >
      {bubblePatterns.map((item, index) => {
        if (item.type === "divider") {
          return (
            <Center key={index} my={2}>
              <Skeleton
                height="18px"
                width="70px"
                borderRadius="full"
                startColor={startColor}
                endColor={endColor}
              />
            </Center>
          );
        }

        if (item.type === "receiver") {
          return (
            <HStack
              key={index}
              align="flex-end"
              spacing={2}
              maxW="80%"
              alignSelf="flex-start"
            >
              <SkeletonCircle
                size="7"
                startColor={startColor}
                endColor={endColor}
                mb={1}
                flexShrink={0}
              />
              <Box
                bg={isDark ? "gray.800" : "gray.100"}
                p={3}
                borderRadius="2xl"
                borderBottomLeftRadius="sm"
                borderWidth="1px"
                borderColor={isDark ? "gray.700" : "gray.200"}
                w={item.width}
                minW="140px"
              >
                <Skeleton
                  height="12px"
                  width="85%"
                  borderRadius="sm"
                  mb={item.lines > 1 ? 2 : 0}
                  startColor={startColor}
                  endColor={endColor}
                />
                {item.lines > 1 && (
                  <Skeleton
                    height="12px"
                    width="60%"
                    borderRadius="sm"
                    startColor={startColor}
                    endColor={endColor}
                  />
                )}
                <HStack justify="flex-end" mt={2}>
                  <Skeleton
                    height="9px"
                    width="32px"
                    borderRadius="xs"
                    startColor={startColor}
                    endColor={endColor}
                  />
                </HStack>
              </Box>
            </HStack>
          );
        }

        // Sender message
        return (
          <Box
            key={index}
            alignSelf="flex-end"
            maxW="75%"
            w={item.width}
            minW="130px"
            bg={isDark ? "blue.900" : "blue.50"}
            p={3}
            borderRadius="2xl"
            borderBottomRightRadius="sm"
            borderWidth="1px"
            borderColor={isDark ? "blue.800" : "blue.100"}
          >
            <Skeleton
              height="12px"
              width="90%"
              borderRadius="sm"
              mb={item.lines > 1 ? 2 : 0}
              startColor={isDark ? "blue.800" : "blue.100"}
              endColor={isDark ? "blue.700" : "blue.200"}
            />
            {item.lines > 1 && (
              <Skeleton
                height="12px"
                width="65%"
                borderRadius="sm"
                startColor={isDark ? "blue.800" : "blue.100"}
                endColor={isDark ? "blue.700" : "blue.200"}
              />
            )}
            <HStack justify="flex-end" mt={2}>
              <Skeleton
                height="9px"
                width="32px"
                borderRadius="xs"
                startColor={isDark ? "blue.800" : "blue.100"}
                endColor={isDark ? "blue.700" : "blue.200"}
              />
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
};

export default MessageLoading;
