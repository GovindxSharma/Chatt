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

const GroupChatModal = ({ children }) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { user, chats, setChats, setSelectedChat } = ChatState();

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
      // Fix: search with query parameter directly instead of relying on stale state
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
        title: "🎉 New Group Chat Created!",
        status: "success",
        duration: 4000,
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
      <span onClick={onOpen}>{children}</span>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl">
          <ModalHeader
            fontSize="22px"
            fontWeight="700"
            display="flex"
            justifyContent="center"
            bg="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
            color="white"
            py={4}
          >
            👥 Create New Group Chat
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody display="flex" flexDir="column" p={6}>
            <FormControl mb={3} isRequired>
              <Text fontSize="xs" fontWeight="700" color="gray.600" mb={1} textTransform="uppercase">
                Group Name
              </Text>
              <Input
                placeholder="e.g. Design Team, Study Group, Project Chatt"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                borderRadius="xl"
              />
            </FormControl>

            <FormControl mb={3}>
              <Text fontSize="xs" fontWeight="700" color="gray.600" mb={1} textTransform="uppercase">
                Add Members
              </Text>
              <Input
                placeholder="Search user by name or email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                borderRadius="xl"
              />
            </FormControl>

            {selectedUsers.length > 0 && (
              <Box w="100%" display="flex" flexWrap="wrap" mb={3} p={2} bg="purple.50" borderRadius="xl">
                {selectedUsers.map((u) => (
                  <UserBadgeItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleDelete(u)}
                  />
                ))}
              </Box>
            )}

            <Box maxH="220px" overflowY="auto" mt={1}>
              {loading ? (
                <Box textAlign="center" py={4}>
                  <Spinner size="md" color="purple.500" />
                </Box>
              ) : (
                searchResult?.slice(0, 5).map((u) => (
                  <UserListItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleGroup(u)}
                  />
                ))
              )}
            </Box>
          </ModalBody>
          <ModalFooter bg="gray.50" px={6} py={4}>
            <Button variant="ghost" mr={3} onClick={onClose} borderRadius="lg">
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleSubmit}
              isLoading={submitting}
              borderRadius="lg"
            >
              Create Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupChatModal;