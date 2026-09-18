import React, { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  VStack,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";

const Register = () => {
  const { isDark } = ChatState() || {};
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pic, setPic] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  const handleClick = () => setShow(!show);

  const postDetails = (pics) => {
    if (!pics) return;
    if (
      pics.type === "image/jpeg" ||
      pics.type === "image/png" ||
      pics.type === "image/webp"
    ) {
      setUploadingPic(true);
      const data = new FormData();
      data.append("file", pics);
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
              duration: 2500,
              isClosable: true,
            });
          }
          setUploadingPic(false);
        })
        .catch(() => {
          setUploadingPic(false);
          toast({
            title: "Upload Failed",
            description: "Default picture will be used",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        });
    } else {
      toast({
        title: "Please Select an Image",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const submitHandler = async () => {
    setLoading(true);
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Fill Required Fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password Doesn't Match",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/api/user",
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          pic: pic || undefined,
          bio: bio.trim() || undefined,
        },
        config
      );

      toast({
        title: "Registration Successful",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      navigate("/chats");
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Occurred",
        description:
          error.response?.data?.message ||
          error.message ||
          "Registration failed",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <VStack spacing={3} as="form" onSubmit={(e) => { e.preventDefault(); submitHandler(); }}>
      <FormControl id="register-name" isRequired>
        <FormLabel fontSize="xs" fontWeight="700" color={isDark ? "gray.200" : "gray.700"} mb={1}>
          Name
        </FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color={isDark ? "gray.400" : "gray.400"}>
            <i className="fa-solid fa-user" style={{ fontSize: "13px" }}></i>
          </InputLeftElement>
          <Input
            placeholder="Your display name"
            onChange={(e) => setName(e.target.value)}
            value={name}
            borderRadius="xl"
            bg={isDark ? "gray.800" : "gray.50"}
            color={isDark ? "white" : "gray.900"}
            borderWidth="1px"
            borderColor={isDark ? "gray.700" : "gray.200"}
            _focus={{ bg: isDark ? "gray.800" : "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3b82f6" }}
            _placeholder={{ color: isDark ? "gray.500" : "gray.400" }}
            aria-label="Name"
          />
        </InputGroup>
      </FormControl>

      <FormControl id="register-email" isRequired>
        <FormLabel fontSize="xs" fontWeight="700" color={isDark ? "gray.200" : "gray.700"} mb={1}>
          Email Address
        </FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color={isDark ? "gray.400" : "gray.400"}>
            <i className="fa-solid fa-envelope" style={{ fontSize: "13px" }}></i>
          </InputLeftElement>
          <Input
            type="email"
            placeholder="name@example.com"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            borderRadius="xl"
            bg={isDark ? "gray.800" : "gray.50"}
            color={isDark ? "white" : "gray.900"}
            borderWidth="1px"
            borderColor={isDark ? "gray.700" : "gray.200"}
            _focus={{ bg: isDark ? "gray.800" : "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3b82f6" }}
            _placeholder={{ color: isDark ? "gray.500" : "gray.400" }}
            aria-label="Email Address"
            autoComplete="email"
          />
        </InputGroup>
      </FormControl>

      <FormControl id="register-bio">
        <FormLabel fontSize="xs" fontWeight="700" color={isDark ? "gray.200" : "gray.700"} mb={1}>
          Bio / Status (Optional)
        </FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color={isDark ? "gray.400" : "gray.400"}>
            <i className="fa-solid fa-pen-fancy" style={{ fontSize: "13px" }}></i>
          </InputLeftElement>
          <Input
            placeholder="Status or quote..."
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            borderRadius="xl"
            bg={isDark ? "gray.800" : "gray.50"}
            color={isDark ? "white" : "gray.900"}
            borderWidth="1px"
            borderColor={isDark ? "gray.700" : "gray.200"}
            _focus={{ bg: isDark ? "gray.800" : "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3b82f6" }}
            _placeholder={{ color: isDark ? "gray.500" : "gray.400" }}
            aria-label="Bio or status"
          />
        </InputGroup>
      </FormControl>

      <FormControl id="register-password" isRequired>
        <FormLabel fontSize="xs" fontWeight="700" color={isDark ? "gray.200" : "gray.700"} mb={1}>
          Password
        </FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color={isDark ? "gray.400" : "gray.400"}>
            <i className="fa-solid fa-lock" style={{ fontSize: "13px" }}></i>
          </InputLeftElement>
          <Input
            type={show ? "text" : "password"}
            placeholder="Create password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            borderRadius="xl"
            bg={isDark ? "gray.800" : "gray.50"}
            color={isDark ? "white" : "gray.900"}
            borderWidth="1px"
            borderColor={isDark ? "gray.700" : "gray.200"}
            _focus={{ bg: isDark ? "gray.800" : "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3b82f6" }}
            _placeholder={{ color: isDark ? "gray.500" : "gray.400" }}
            aria-label="Password"
            autoComplete="new-password"
          />
          <InputRightElement width="4.5rem">
            <Button
              h="1.75rem"
              size="xs"
              onClick={handleClick}
              borderRadius="md"
              variant="ghost"
              aria-label={show ? "Hide password" : "Show password"}
              fontWeight="600"
              color={isDark ? "gray.300" : "gray.600"}
            >
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <FormControl id="register-confirm-password" isRequired>
        <FormLabel fontSize="xs" fontWeight="700" color={isDark ? "gray.200" : "gray.700"} mb={1}>
          Confirm Password
        </FormLabel>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color={isDark ? "gray.400" : "gray.400"}>
            <i className="fa-solid fa-shield-check" style={{ fontSize: "13px" }}></i>
          </InputLeftElement>
          <Input
            type={show ? "text" : "password"}
            placeholder="Re-enter password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            borderRadius="xl"
            bg={isDark ? "gray.800" : "gray.50"}
            color={isDark ? "white" : "gray.900"}
            borderWidth="1px"
            borderColor={isDark ? "gray.700" : "gray.200"}
            _focus={{ bg: isDark ? "gray.800" : "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3b82f6" }}
            _placeholder={{ color: isDark ? "gray.500" : "gray.400" }}
            aria-label="Confirm Password"
            autoComplete="new-password"
          />
          <InputRightElement width="4.5rem">
            <Button
              h="1.75rem"
              size="xs"
              onClick={handleClick}
              borderRadius="md"
              variant="ghost"
              aria-label={show ? "Hide password" : "Show password"}
              fontWeight="600"
              color={isDark ? "gray.300" : "gray.600"}
            >
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <FormControl id="register-pic">
        <FormLabel fontSize="xs" fontWeight="700" color={isDark ? "gray.200" : "gray.700"} mb={1}>
          Avatar / Profile Picture (Optional)
        </FormLabel>
        <Input
          type="file"
          p={1}
          accept="image/*"
          borderRadius="xl"
          bg={isDark ? "gray.800" : "gray.50"}
          color={isDark ? "white" : "gray.900"}
          borderWidth="1px"
          borderColor={isDark ? "gray.700" : "gray.200"}
          aria-label="Upload profile picture"
          onChange={(e) => postDetails(e.target.files[0])}
        />
      </FormControl>

      <Button
        type="submit"
        colorScheme="blue"
        bg="blue.600"
        _hover={{ bg: "blue.700" }}
        width="100%"
        style={{ marginTop: 12 }}
        onClick={submitHandler}
        isLoading={loading || uploadingPic}
        borderRadius="xl"
        py={6}
        fontSize="sm"
        fontWeight="600"
        boxShadow="sm"
      >
        Create Chatt Account
      </Button>
    </VStack>
  );
};

export default Register;