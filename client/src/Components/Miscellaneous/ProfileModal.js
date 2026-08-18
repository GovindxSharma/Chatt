import React, { useState } from "react";
import {
  IconButton,
  useDisclosure,
  Modal,
  ModalBody,
  ModalHeader,
  Button,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  ModalCloseButton,
  Image,
  Text,
  Box,
  Input,
  FormControl,
  FormLabel,
  Badge,
  useToast,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { ViewIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";

const ProfileModal = ({ user: profileUser, children, isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const internalDisclosure = useDisclosure();
  
  // Support both uncontrolled (with children or icon button) and controlled mode
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalDisclosure.isOpen;
  const onOpen = internalDisclosure.onOpen;
  const onClose = externalOnClose !== undefined ? externalOnClose : internalDisclosure.onClose;

  const { user: currentUser, setUser: setCurrentUser, onlineUsers } = ChatState();
  const toast = useToast();

  const isSelf = currentUser?._id === profileUser?._id;
  const isOnline = onlineUsers?.includes(profileUser?._id);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profileUser?.name || "");
  const [bio, setBio] = useState(profileUser?.bio || "Hey there! I am using Chat-To-Talk.");
  const [status, setStatus] = useState(profileUser?.status || "Available");
  const [pic, setPic] = useState(profileUser?.pic || "");
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setName(profileUser?.name || "");
    setBio(profileUser?.bio || "Hey there! I am using Chat-To-Talk.");
    setStatus(profileUser?.status || "Available");
    setPic(profileUser?.pic || "");
    setIsEditing(false);
    onOpen();
  };

  const uploadImage = (file) => {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      setLoading(true);
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "ddnwjdqbf");
      fetch("https://api.cloudinary.com/v1_1/ddnwjdqbf/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.url) {
            setPic(data.url.toString());
            toast({
              title: "Picture Uploaded",
              status: "success",
              duration: 2000,
              isClosable: true,
            });
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          toast({
            title: "Upload Failed",
            description: "Could not upload image",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        });
    } else {
      toast({
        title: "Please Select an Image File",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({
        title: "Name cannot be empty",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
      };

      const { data } = await axios.put(
        "/api/user/profile",
        { name, bio, status, pic },
        config
      );

      const updatedUser = { ...data, token: currentUser.token };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setLoading(false);
      setIsEditing(false);

      toast({
        title: "Profile Updated Successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Updating Profile",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      {children ? (
        <span onClick={handleOpen} style={{ cursor: "pointer", width: "100%", display: "block" }}>
          {children}
        </span>
      ) : externalIsOpen === undefined ? (
        <IconButton
          display={{ base: "flex" }}
          icon={<ViewIcon />}
          onClick={handleOpen}
          aria-label="View Profile"
          variant="ghost"
          colorScheme="blue"
          borderRadius="full"
        />
      ) : null}

      <Modal size="md" isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
        <ModalContent
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="2xl"
          borderWidth="1px"
          borderColor="gray.100"
          mx={4}
        >
          <Box
            bg="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
            p={6}
            textAlign="center"
            color="white"
            position="relative"
          >
            <ModalCloseButton color="white" top={4} right={4} />
            <Box position="relative" display="inline-block">
              <Image
                borderRadius="full"
                boxSize="110px"
                src={isEditing ? pic || profileUser?.pic : profileUser?.pic}
                alt={profileUser?.name}
                border="4px solid white"
                boxShadow="lg"
                objectFit="cover"
                mx="auto"
                fallbackSrc="https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
              />
              <Box
                position="absolute"
                bottom="4px"
                right="8px"
                className={isOnline ? "online-dot" : "offline-dot"}
              />
            </Box>
            <ModalHeader fontSize="22px" fontWeight="700" p={0} mt={3} color="white">
              {isEditing ? "Edit Profile" : profileUser?.name}
            </ModalHeader>
            <HStack justify="center" spacing={2} mt={1}>
              <Badge
                colorScheme={isOnline ? "green" : "gray"}
                variant="solid"
                fontSize="11px"
                borderRadius="full"
                px={2.5}
              >
                {isOnline ? "Active" : "Offline"}
              </Badge>
              {profileUser?.status && !isEditing && (
                <Badge colorScheme="blue" variant="solid" fontSize="11px" borderRadius="full" px={2.5}>
                  {profileUser.status}
                </Badge>
              )}
            </HStack>
          </Box>

          <ModalBody p={6}>
            {isEditing ? (
              <VStack spacing={4} align="stretch">
                <FormControl id="name" isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">Display Name</FormLabel>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    borderRadius="lg"
                  />
                </FormControl>
                <FormControl id="bio">
                  <FormLabel fontSize="sm" fontWeight="600">Bio / About</FormLabel>
                  <Input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Status / Bio..."
                    borderRadius="lg"
                  />
                </FormControl>
                <FormControl id="status">
                  <FormLabel fontSize="sm" fontWeight="600">Status</FormLabel>
                  <Input
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="Available, Busy, Away..."
                    borderRadius="lg"
                  />
                </FormControl>
                <FormControl id="pic">
                  <FormLabel fontSize="sm" fontWeight="600">Change Picture</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    p={1}
                    borderRadius="lg"
                    onChange={(e) => uploadImage(e.target.files[0])}
                  />
                </FormControl>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                <Box p={3.5} bg="gray.50" borderRadius="xl">
                  <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                    Email Address
                  </Text>
                  <Text fontSize="md" fontWeight="600" color="gray.800">
                    {profileUser?.email}
                  </Text>
                </Box>
                <Box p={3.5} bg="gray.50" borderRadius="xl">
                  <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase">
                    About / Bio
                  </Text>
                  <Text fontSize="sm" color="gray.700">
                    {profileUser?.bio || "Hey there! I am using Chat-To-Talk."}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter bg="gray.50" px={6} py={4} display="flex" justifyContent="space-between">
            {isSelf && (
              <>
                {isEditing ? (
                  <HStack spacing={2} w="100%" justify="flex-end">
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      leftIcon={<CloseIcon boxSize="10px" />}
                      borderRadius="lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme="blue"
                      onClick={handleSaveProfile}
                      isLoading={loading}
                      leftIcon={<CheckIcon boxSize="12px" />}
                      borderRadius="lg"
                    >
                      Save
                    </Button>
                  </HStack>
                ) : (
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<EditIcon />}
                    borderRadius="lg"
                  >
                    Edit Profile
                  </Button>
                )}
              </>
            )}
            {!isEditing && (
              <Button colorScheme="gray" onClick={onClose} borderRadius="lg" ml="auto">
                Close
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
