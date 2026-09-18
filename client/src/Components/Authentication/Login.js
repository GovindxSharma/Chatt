import React, { useState } from "react";
import {
  FormControl,
  FormLabel,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  useToast,
  Divider,
  Box,
  Text,
  HStack,
  Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";
import { useServerWarmup, getBackendEndpoint } from "../../utils/serverWarmup";

const Login = () => {
  const { isDark } = ChatState() || {};
  const { isReady } = useServerWarmup();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wakingWait, setWakingWait] = useState(false);

  const handleClick = () => setShow(!show);

  const submitHandler = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({
        title: "Fill the Required Fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }

    if (!isReady) {
      setWakingWait(true);
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
        timeout: 45000, // 45s for Render standby cold boots
      };

      const endpoint = getBackendEndpoint();
      const loginUrl = `${endpoint.replace(/\/+$/, "")}/api/user/login`;

      const { data } = await axios.post(
        loginUrl,
        { email: email.trim().toLowerCase(), password },
        config
      );

      toast({
        title: "Login Successful",
        status: "success",
        duration: 2500,
        isClosable: true,
        position: "bottom",
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      setWakingWait(false);
      navigate("/chats");
    } catch (error) {
      setLoading(false);
      setWakingWait(false);
      toast({
        title: "Error Occurred",
        description:
          error.response?.data?.message ||
          (error.code === "ECONNABORTED"
            ? "Server is still waking up. Please try again in 5 seconds."
            : error.message || "Invalid Email or Password"),
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <VStack
      spacing={4}
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        submitHandler();
      }}
    >
      <FormControl id="login-email" isRequired>
        <FormLabel
          fontSize="xs"
          fontWeight="700"
          color={isDark ? "gray.200" : "gray.700"}
          mb={1.5}
        >
          Email Address
        </FormLabel>
        <InputGroup>
          <InputLeftElement
            pointerEvents="none"
            color={isDark ? "gray.400" : "gray.400"}
          >
            <i className="fa-solid fa-envelope" style={{ fontSize: "14px" }} />
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
            _focus={{
              bg: isDark ? "gray.800" : "white",
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px #3b82f6",
            }}
            _placeholder={{ color: isDark ? "gray.500" : "gray.400" }}
            aria-label="Email Address"
            autoComplete="email"
          />
        </InputGroup>
      </FormControl>

      <FormControl id="login-password" isRequired>
        <FormLabel
          fontSize="xs"
          fontWeight="700"
          color={isDark ? "gray.200" : "gray.700"}
          mb={1.5}
        >
          Password
        </FormLabel>
        <InputGroup>
          <InputLeftElement
            pointerEvents="none"
            color={isDark ? "gray.400" : "gray.400"}
          >
            <i className="fa-solid fa-lock" style={{ fontSize: "14px" }} />
          </InputLeftElement>
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            borderRadius="xl"
            bg={isDark ? "gray.800" : "gray.50"}
            color={isDark ? "white" : "gray.900"}
            borderWidth="1px"
            borderColor={isDark ? "gray.700" : "gray.200"}
            _focus={{
              bg: isDark ? "gray.800" : "white",
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px #3b82f6",
            }}
            _placeholder={{ color: isDark ? "gray.500" : "gray.400" }}
            aria-label="Password"
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && submitHandler()}
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

      {/* Standby Warmup Notice */}
      {wakingWait && (
        <Box
          w="100%"
          p={2.5}
          bg={isDark ? "blue.950" : "blue.50"}
          borderWidth="1px"
          borderColor={isDark ? "blue.900" : "blue.200"}
          borderRadius="xl"
        >
          <HStack spacing={2}>
            <Spinner size="xs" color="blue.500" />
            <Text fontSize="11px" color={isDark ? "blue.200" : "blue.700"} fontWeight="600">
              Waking up cloud service... Connection established shortly.
            </Text>
          </HStack>
        </Box>
      )}

      <Button
        type="submit"
        colorScheme="blue"
        bg="blue.600"
        _hover={{ bg: "blue.700" }}
        width="100%"
        onClick={submitHandler}
        isLoading={loading}
        loadingText={wakingWait ? "Waking Cloud..." : "Signing In..."}
        borderRadius="xl"
        py={6}
        fontSize="sm"
        fontWeight="600"
        boxShadow="sm"
        mt={1}
      >
        Sign In to Chatt
      </Button>

      <Divider my={1} borderColor={isDark ? "gray.700" : "gray.200"} />

      <Button
        variant="outline"
        colorScheme="blue"
        borderColor={isDark ? "gray.700" : "gray.300"}
        bg={isDark ? "gray.800" : "transparent"}
        color={isDark ? "gray.200" : "gray.700"}
        _hover={{ bg: isDark ? "gray.700" : "gray.50" }}
        width="100%"
        borderRadius="xl"
        size="md"
        py={5}
        fontWeight="600"
        fontSize="xs"
        leftIcon={
          <i
            className="fa-solid fa-wand-magic-sparkles"
            style={{ color: "#2563eb" }}
          />
        }
        onClick={() => {
          setEmail("guest@example.com");
          setPassword("123456");
          toast({
            title: "Guest Credentials Filled",
            description: "Click 'Sign In' or submit to continue as guest.",
            status: "info",
            duration: 2000,
            isClosable: true,
          });
        }}
      >
        Quick Fill Demo / Guest User
      </Button>
    </VStack>
  );
};

export default Login;