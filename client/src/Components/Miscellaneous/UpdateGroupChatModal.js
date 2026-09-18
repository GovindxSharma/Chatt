import React, { useState } from "react";
import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Input,
  useToast,
  Box,
  IconButton,
  Spinner,
  Text,
  HStack,
} from "@chakra-ui/react";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import UserListItem from "../UserAvatar/UserListItem";

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState("");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user, isDark } = ChatState();

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query || !query.trim()) {
      setSearchResult([]);
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(
        `/api/user?search=${encodeURIComponent(query.trim())}`,
        config
      );
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Occurred!",
        description: "Failed to load search results",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const handleRename = async () => {
    if (!groupChatName || !groupChatName.trim()) return;

    try {
      setRenameLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: groupChatName.trim(),
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
      setGroupChatName("");
      toast({
        title: "Group Renamed Successfully",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to Rename Group",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      setRenameLoading(false);
    }
  };

  const handleAddUser = async (user1) => {
    if (selectedChat.users.some((u) => u._id === user1._id)) {
      toast({
        title: "User Already in Group",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      toast({
        title: "Only admins can add members",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
      setSearch("");
      setSearchResult([]);
      toast({
        title: `${user1.name} added to group!`,
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error Occurred",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  const handleRemove = async (user1) => {
    if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
      toast({
        title: "Only admins can remove members",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      user1._id === user._id ? setSelectedChat(null) : setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      if (fetchMessages) fetchMessages();
      setLoading(false);
      toast({
        title: user1._id === user._id ? "You left the group" : `${user1.name} removed`,
        status: "info",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error Occurred",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        display={{ base: "flex" }}
        icon={<ViewIcon />}
        onClick={onOpen}
        variant="ghost"
        colorScheme="blue"
        borderRadius="full"
        aria-label="Group Settings"
      />

      <Modal onClose={onClose} isOpen={isOpen} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.600" />
        <ModalContent
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="2xl"
          borderWidth="1px"
          borderColor={isDark ? "gray.700" : "gray.200"}
          bg={isDark ? "gray.800" : "white"}
          color={isDark ? "gray.100" : "gray.800"}
          mx={4}
        >
          <ModalHeader
            fontSize="20px"
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
            display="flex"
            justifyContent="center"
            alignItems="center"
            gap={2.5}
            bg="blue.600"
            color="white"
            py={4}
          >
            <i className="fa-solid fa-users-gear"></i>
            {selectedChat.chatName}
          </ModalHeader>

          <ModalCloseButton color="white" />
          <ModalBody display="flex" flexDir="column" p={6} bg={isDark ? "gray.800" : "white"}>
            <Text fontSize="xs" fontWeight="700" color={isDark ? "gray.300" : "gray.600"} mb={1} textTransform="uppercase">
              Group Members ({selectedChat.users?.length})
            </Text>
            <Box w="100%" display="flex" flexWrap="wrap" pb={3}>
              {selectedChat.users.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  admin={selectedChat.groupAdmin}
                  handleFunction={() => handleRemove(u)}
                />
              ))}
            </Box>

            <Text fontSize="xs" fontWeight="700" color={isDark ? "gray.300" : "gray.600"} mb={1} textTransform="uppercase">
              Rename Group
            </Text>
            <HStack mb={4}>
              <Input
                placeholder="New Group Name"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                borderRadius="xl"
                bg={isDark ? "gray.700" : "white"}
                color={isDark ? "white" : "gray.900"}
                borderColor={isDark ? "gray.600" : "gray.200"}
              />
              <Button
                colorScheme="blue"
                isLoading={renameLoading}
                onClick={handleRename}
                borderRadius="xl"
                px={5}
              >
                Update
              </Button>
            </HStack>

            <Text fontSize="xs" fontWeight="700" color={isDark ? "gray.300" : "gray.600"} mb={1} textTransform="uppercase">
              Add Members
            </Text>
            <Input
              placeholder="Search user by name or email..."
              mb={2}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              borderRadius="xl"
              bg={isDark ? "gray.700" : "white"}
              color={isDark ? "white" : "gray.900"}
              borderColor={isDark ? "gray.600" : "gray.200"}
            />

            <Box maxH="180px" overflowY="auto">
              {loading ? (
                <Box textAlign="center" py={3}>
                  <Spinner size="md" color="blue.500" />
                </Box>
              ) : (
                searchResult?.slice(0, 4).map((u) => (
                  <UserListItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleAddUser(u)}
                  />
                ))
              )}
            </Box>
          </ModalBody>

          <ModalFooter bg={isDark ? "gray.900" : "gray.50"} borderColor={isDark ? "gray.700" : "gray.200"} borderTopWidth="1px" px={6} py={4} display="flex" justifyContent="space-between">
            <Button
              onClick={() => handleRemove(user)}
              colorScheme="red"
              variant="outline"
              borderRadius="lg"
            >
              Leave Group
            </Button>
            <Button colorScheme={isDark ? "whiteAlpha" : "gray"} onClick={onClose} borderRadius="lg">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
