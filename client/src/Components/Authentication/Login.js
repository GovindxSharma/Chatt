import React, { useState } from "react";
import {
  FormControl,
  FormLabel,
  VStack,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  useToast,
  Divider,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => setShow(!show);

  const submitHandler = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({
        title: "Please enter both Email and Password",
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
        "/api/user/login",
        { email: email.trim().toLowerCase(), password },
        config
      );

      toast({
        title: "Welcome back!",
        status: "success",
        duration: 2500,
        isClosable: true,
        position: "bottom",
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      navigate("/chats");
    } catch (error) {
      setLoading(false);
      toast({
        title: "Login Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Invalid email or password",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <VStack spacing={4}>
      <FormControl isRequired>
        <FormLabel fontSize="sm" fontWeight="600">
          Email Address
        </FormLabel>
        <Input
          placeholder="your.email@example.com"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          borderRadius="xl"
          focusBorderColor="purple.400"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel fontSize="sm" fontWeight="600">
          Password
        </FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            borderRadius="xl"
            focusBorderColor="purple.400"
            onKeyDown={(e) => e.key === "Enter" && submitHandler()}
          />
          <InputRightElement width="4.5rem">
            <Button
              h="1.75rem"
              size="xs"
              onClick={handleClick}
              borderRadius="md"
              variant="ghost"
            >
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <Button
        colorScheme="purple"
        width="100%"
        onClick={submitHandler}
        isLoading={loading}
        borderRadius="xl"
        py={5}
        boxShadow="0 4px 14px rgba(99, 102, 241, 0.4)"
      >
        Sign In
      </Button>

      <Divider />

      <Button
        variant="outline"
        colorScheme="red"
        width="100%"
        borderRadius="xl"
        size="sm"
        onClick={() => {
          setEmail("guest@example.com");
          setPassword("123456");
        }}
      >
        ⚡ Quick Guest Credentials
      </Button>
    </VStack>
  );
};

export default Login;