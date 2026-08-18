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
        title: "Fill the Required Fields",
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
        title: "Login Successful",
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
        title: "Error Occurred",
        description:
          error.response?.data?.message ||
          error.message ||
          "Invalid Email or Password",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <VStack spacing={3.5}>
      <FormControl isRequired>
        <FormLabel fontSize="sm" fontWeight="600">
          Email Address
        </FormLabel>
        <Input
          placeholder="Enter Your Email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          borderRadius="xl"
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel fontSize="sm" fontWeight="600">
          Password
        </FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter Password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            borderRadius="xl"
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
        colorScheme="blue"
        width="100%"
        onClick={submitHandler}
        isLoading={loading}
        borderRadius="xl"
        py={5}
        mt={2}
      >
        Login
      </Button>

      <Divider my={1} />

      <Button
        variant="solid"
        colorScheme="red"
        width="100%"
        borderRadius="xl"
        size="sm"
        onClick={() => {
          setEmail("guest@example.com");
          setPassword("123456");
        }}
      >
        Guest User
      </Button>
    </VStack>
  );
};

export default Login;