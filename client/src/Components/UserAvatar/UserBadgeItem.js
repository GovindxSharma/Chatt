import React from "react";
import { Badge, Box } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

const UserBadgeItem = ({ user, handleFunction, admin }) => {
  const isAdmin = admin && (admin._id === user._id || admin === user._id);

  return (
    <Badge
      px={3}
      py={1}
      borderRadius="full"
      m={1}
      mb={1.5}
      variant="solid"
      fontSize="12px"
      bg="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
      color="white"
      cursor="pointer"
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      boxShadow="0 2px 4px rgba(99, 102, 241, 0.3)"
      _hover={{ opacity: 0.9, transform: "scale(1.03)" }}
      transition="all 0.15s ease"
    >
      <span>{user.name}</span>
      {isAdmin && (
        <Box
          as="span"
          fontSize="9px"
          bg="yellow.400"
          color="black"
          px={1.5}
          py={0.2}
          borderRadius="full"
          fontWeight="bold"
        >
          Admin
        </Box>
      )}
      <CloseIcon
        boxSize="8px"
        cursor="pointer"
        onClick={handleFunction}
        _hover={{ color: "red.200" }}
      />
    </Badge>
  );
};

export default UserBadgeItem;