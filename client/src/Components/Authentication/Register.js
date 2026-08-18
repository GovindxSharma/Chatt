import React, { useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
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
    <VStack spacing={2.5}>
      <FormControl id="name" isRequired>
        <FormLabel fontSize="xs" fontWeight="600" mb={1}>
          Name
        </FormLabel>
        <Input
          placeholder="Enter Your Name"
          onChange={(e) => setName(e.target.value)}
          value={name}
          borderRadius="xl"
        />
      </FormControl>

      <FormControl id="email" isRequired>
        <FormLabel fontSize="xs" fontWeight="600" mb={1}>
          Email Address
        </FormLabel>
        <Input
          placeholder="Enter Your Email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          borderRadius="xl"
        />
      </FormControl>

      <FormControl id="bio">
        <FormLabel fontSize="xs" fontWeight="600" mb={1}>
          Bio / Status (Optional)
        </FormLabel>
        <Input
          placeholder="Status message..."
          onChange={(e) => setBio(e.target.value)}
          value={bio}
          borderRadius="xl"
        />
      </FormControl>

      <FormControl id="password" isRequired>
        <FormLabel fontSize="xs" fontWeight="600" mb={1}>
          Password
        </FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter Password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            borderRadius="xl"
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

      <FormControl id="confirmPassword" isRequired>
        <FormLabel fontSize="xs" fontWeight="600" mb={1}>
          Confirm Password
        </FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            borderRadius="xl"
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

      <FormControl id="pic">
        <FormLabel fontSize="xs" fontWeight="600" mb={1}>
          Upload Your Picture
        </FormLabel>
        <Input
          type="file"
          p={1}
          accept="image/*"
          borderRadius="xl"
          onChange={(e) => postDetails(e.target.files[0])}
        />
      </FormControl>

      <Button
        colorScheme="blue"
        width="100%"
        style={{ marginTop: 10 }}
        onClick={submitHandler}
        isLoading={loading || uploadingPic}
        borderRadius="xl"
        py={5}
      >
        Register
      </Button>
    </VStack>
  );
};

export default Register;