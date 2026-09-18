import React, { useState } from "react";
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
  useToast,
  FormControl,
  Input,
  Box,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { ChatState } from "../../Context/ChatProvider";
import axios from "axios";
import UserListItem from "../UserAvatar/UserListItem";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";

const GroupChatModal = ({
  children,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}) => {
  const toast = useToast();
  const internalDisclosure = useDisclosure();
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalDisclosure.isOpen;
  const onOpen = internalDisclosure.onOpen;
  const onClose = isControlled ? externalOnClose : internalDisclosure.onClose;

  const { user, chats, setChats, setSelectedChat, isDark } = ChatState();

  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGroup = (userToAdd) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) {
      toast({
        title: "User already added",
        status: "warning",
        duration: 2500,
        isClosable: true,
        position: "top",
      });
      return;
    }
    setSelectedUsers([...selectedUsers, userToAdd]);
  };

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
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    if (!groupChatName.trim() || selectedUsers.length === 0) {
      toast({
        title: "Please fill in group name and select at least 2 members",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (selectedUsers.length < 2) {
      toast({
        title: "At least 2 users are required to form a group chat",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      setSubmitting(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `/api/chat/group`,
        {
          name: groupChatName.trim(),
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        config
      );
      setChats([data, ...chats]);
      setSelectedChat(data);
      setSubmitting(false);
      onClose();
      setSelectedUsers([]);
      setGroupChatName("");
      setSearchResult([]);
      toast({
        title: "New Group Chat Created!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      setSubmitting(false);
      toast({
        title: "Failed to Create Chat",
        description: error.response?.data?.message || error.response?.data || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <>
      {children && <span onClick={onOpen}>{children}</span>}

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
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
            fontSize="18px"
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
            <i className="fa-solid fa-users"></i>
            Create Group Chat
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody display="flex" flexDir="column" p={6} bg={isDark ? "gray.800" : "white"}>
            <FormControl mb={3} isRequired>
              <Text fontSize="xs" fontWeight="700" color={isDark ? "gray.300" : "gray.600"} mb={1} textTransform="uppercase">
                Group Name
              </Text>
              <Input
                placeholder="Group Name"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                borderRadius="xl"
                bg={isDark ? "gray.700" : "white"}
                color={isDark ? "white" : "gray.900"}
                borderColor={isDark ? "gray.600" : "gray.200"}
              />
            </FormControl>

            <FormControl mb={3}>
              <Text fontSize="xs" fontWeight="700" color={isDark ? "gray.300" : "gray.600"} mb={1} textTransform="uppercase">
                Add Users
              </Text>
              <Input
                placeholder="Search user by name or email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                borderRadius="xl"
                bg={isDark ? "gray.700" : "white"}
                color={isDark ? "white" : "gray.900"}
                borderColor={isDark ? "gray.600" : "gray.200"}
              />
            </FormControl>

            {selectedUsers.length > 0 && (
              <Box w="100%" display="flex" flexWrap="wrap" mb={3} p={2} bg={isDark ? "rgba(37, 99, 235, 0.18)" : "blue.50"} borderRadius="xl">
                {selectedUsers.map((u) => (
                  <UserBadgeItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleDelete(u)}
                  />
                ))}
              </Box>
            )}

            <Box maxH="200px" overflowY="auto" mt={1}>
              {loading ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" color="blue.500" />
                </Box>
              ) : (
                searchResult?.slice(0, 4).map((u) => (
                  <UserListItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleGroup(u)}
                  />
                ))
              )}
            </Box>
          </ModalBody>
          <ModalFooter bg={isDark ? "gray.900" : "gray.50"} borderColor={isDark ? "gray.700" : "gray.200"} borderTopWidth="1px" px={6} py={4}>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="lg" color={isDark ? "gray.300" : "gray.600"}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={submitting}
              borderRadius="lg"
            >
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupChatModal;