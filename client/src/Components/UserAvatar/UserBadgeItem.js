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
      bg="blue.600"
      color="white"
      cursor="pointer"
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      boxShadow="sm"
      _hover={{ bg: "blue.700", transform: "scale(1.02)" }}
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