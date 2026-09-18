import React from "react";
import { Box, Text, Avatar, Badge, AvatarBadge } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";

const UserListItem = ({ user, handleFunction, isActive = false, id }) => {
  const { onlineUsers, isDark } = ChatState();
  const isOnline = onlineUsers?.includes(user._id);

  return (
    <Box
      id={id}
      onClick={handleFunction}
      cursor="pointer"
      bg={
        isActive
          ? isDark
            ? "#1e293b"
            : "blue.50"
          : isDark
          ? "#111827"
          : "white"
      }
      _hover={{
        bg: isActive
          ? isDark
            ? "#243248"
            : "blue.50"
          : isDark
          ? "#1f2937"
          : "gray.50",
        borderColor: isActive ? "blue.400" : isDark ? "gray.600" : "gray.300",
        transform: "translateX(2px)",
      }}
      _active={{
        bg: isDark ? "#2d3748" : "blue.100",
      }}
      transition="all 0.15s ease"
      w="100%"
      minH="54px"
      display="flex"
      alignItems="center"
      color={isDark ? "#f3f4f6" : "gray.900"}
      px={3.5}
      py={2.5}
      mb={2}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={
        isActive
          ? "blue.400"
          : isDark
          ? "gray.700"
          : "gray.200"
      }
      boxShadow={isActive ? "0 2px 8px rgba(37, 99, 235, 0.14)" : "sm"}
      role="option"
      aria-selected={isActive}
    >
      <Avatar
        mr={3}
        size="sm"
        name={user.name}
        src={user.pic}
        boxShadow="sm"
      >
        <AvatarBadge
          boxSize="1em"
          bg={isOnline ? "green.500" : "gray.400"}
          borderColor={isDark ? "#111827" : "white"}
        />
      </Avatar>
      <Box flex="1" overflow="hidden">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Text
            fontWeight="600"
            fontSize="sm"
            isTruncated
            color={
              isActive
                ? isDark
                  ? "blue.300"
                  : "blue.700"
                : isDark
                ? "white"
                : "gray.900"
            }
          >
            {user.name}
          </Text>
          <Box display="flex" alignItems="center" gap={2}>
            {isOnline ? (
              <Badge colorScheme="green" variant="subtle" fontSize="9px" px={2} py={0.5} borderRadius="full">
                Online
              </Badge>
            ) : (
              <Text fontSize="10px" color={isDark ? "gray.400" : "gray.400"}>
                Offline
              </Text>
            )}
            {isActive && (
              <Text
                display={{ base: "none", sm: "inline-block" }}
                fontSize="10px"
                fontWeight="700"
                color={isDark ? "blue.300" : "blue.600"}
                bg={isDark ? "blue.900" : "blue.100"}
                px={1.5}
                py={0.5}
                borderRadius="md"
              >
                ↵ Chat
              </Text>
            )}
          </Box>
        </Box>
        <Text fontSize="xs" color={isDark ? "gray.400" : "gray.500"} isTruncated mt={0.5}>
          {user.bio ? `${user.bio} • ${user.email}` : user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;