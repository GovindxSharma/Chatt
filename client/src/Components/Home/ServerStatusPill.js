import React from "react";
import {
  Box,
  HStack,
  Text,
  Badge,
  Tooltip,
  IconButton,
  Progress,
  Collapse,
} from "@chakra-ui/react";
import { useServerWarmup } from "../../utils/serverWarmup";

const ServerStatusPill = ({ isDark }) => {
  const { latency, manualRetry, isReady, isWaking, isOffline } =
    useServerWarmup();

  return (
    <Box>
      <HStack
        px={3.5}
        py={1.5}
        borderRadius="full"
        bg={isDark ? "gray.800" : "white"}
        borderWidth="1px"
        borderColor={
          isReady
            ? isDark
              ? "green.800"
              : "green.200"
            : isWaking
            ? isDark
              ? "blue.800"
              : "blue.200"
            : isDark
            ? "yellow.800"
            : "yellow.200"
        }
        boxShadow="sm"
        spacing={2.5}
        transition="all 0.3s ease"
      >
        {/* Animated Dot Indicator */}
        <Box
          boxSize="8px"
          borderRadius="full"
          bg={
            isReady
              ? "green.400"
              : isWaking
              ? "blue.400"
              : isOffline
              ? "red.400"
              : "yellow.400"
          }
          className={isWaking ? "pulse-dot" : isReady ? "online-dot" : ""}
        />

        <Text
          fontSize={{ base: "10px", sm: "11px" }}
          fontWeight="600"
          color={isDark ? "gray.300" : "gray.700"}
          letterSpacing="0.02em"
        >
          {isReady && (
            <span>
              BACKEND READY{" "}
              {latency !== null && (
                <Text as="span" color="green.500" fontWeight="700">
                  • {latency}ms
                </Text>
              )}
            </span>
          )}
          {isWaking && <span>CONNECTING TO CLOUD • WAKING STANDBY...</span>}
          {isOffline && <span>CLOUD STANDBY • CLICK TO WAKE</span>}
        </Text>

        <Badge
          colorScheme={isReady ? "green" : isWaking ? "blue" : "yellow"}
          variant="subtle"
          borderRadius="full"
          fontSize="9px"
          px={1.5}
          py={0.2}
        >
          {isReady ? "ONLINE" : isWaking ? "WARMING UP" : "STANDBY"}
        </Badge>

        {isOffline && (
          <Tooltip label="Retry connecting to server" hasArrow>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label="Retry server ping"
              icon={<i className="fa-solid fa-rotate-right" />}
              onClick={manualRetry}
            />
          </Tooltip>
        )}
      </HStack>

      {/* Subtle Warmup Progress Bar during cold boot */}
      <Collapse in={isWaking} animateOpacity>
        <Box mt={1.5} px={1}>
          <Progress
            size="xs"
            isIndeterminate
            colorScheme="blue"
            borderRadius="full"
            bg={isDark ? "gray.850" : "gray.100"}
          />
        </Box>
      </Collapse>
    </Box>
  );
};

export default ServerStatusPill;
