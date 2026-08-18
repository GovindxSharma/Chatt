import React from "react";
import { Box, Text, Avatar, Badge, AvatarBadge } from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";

const UserListItem = ({ user, handleFunction }) => {
  const { onlineUsers } = ChatState();
  const isOnline = onlineUsers?.includes(user._id);

  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg="rgba(241, 245, 249, 0.8)"
      _hover={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        color: "white",
        transform: "translateX(4px)",
      }}
      transition="all 0.2s ease"
      w="100%"
      display="flex"
      alignItems="center"
      color="slate.800"
      px={3}
      py={2.5}
      mb={2}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <Avatar
        mr={3}
        size="md"
        cursor="pointer"
        name={user.name}
        src={user.pic}
      >
        <AvatarBadge
          boxSize="1.1em"
          bg={isOnline ? "green.500" : "gray.400"}
          borderColor="white"
        />
      </Avatar>
      <Box flex="1" overflow="hidden">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Text fontWeight="600" fontSize="sm" isTruncated>
            {user.name}
          </Text>
          {isOnline && (
            <Badge colorScheme="green" variant="subtle" fontSize="9px" px={1.5} borderRadius="full">
              Online
            </Badge>
          )}
        </Box>
        <Text fontSize="xs" opacity={0.8} isTruncated>
          {user.bio || user.email}
        </Text>
      </Box>
    </Box>
  );
};

export default UserListItem;