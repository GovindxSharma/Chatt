import React, { useEffect } from "react";
import {
  Box,
  Container,
  Text,
  Tab,
  TabPanels,
  TabPanel,
  TabList,
  Tabs,
  Badge,
  HStack,
} from "@chakra-ui/react";
import Login from "../Components/Authentication/Login.js";
import Register from "../Components/Authentication/Register.js";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("userInfo"));
      if (user) navigate("/chats");
    } catch (e) {}
  }, [navigate]);

  return (
    <Container maxW="lg" centerContent py={10}>
      {/* Brand Header Card */}
      <Box
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        p={5}
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(20px)"
        w="100%"
        mb={4}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="whiteAlpha.500"
        boxShadow="0 10px 30px rgba(0, 0, 0, 0.1)"
        textAlign="center"
      >
        <HStack spacing={2} mb={1}>
          <Text
            fontSize={{ base: "3xl", md: "4xl" }}
            fontWeight="800"
            bgGradient="linear(to-r, #6366f1, #a855f7, #ec4899)"
            bgClip="text"
            letterSpacing="-0.5px"
          >
            💬 Chatt
          </Text>
          <Badge
            colorScheme="purple"
            variant="subtle"
            borderRadius="full"
            px={2.5}
            py={0.5}
            fontSize="10px"
          >
            v2.0
          </Badge>
        </HStack>
        <Text fontSize="sm" color="gray.500" fontWeight="500">
          Fast, Real-time & Secure Messaging
        </Text>
      </Box>

      {/* Tabs Container */}
      <Box
        bg="rgba(255, 255, 255, 0.95)"
        backdropFilter="blur(20px)"
        w="100%"
        p={6}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="whiteAlpha.500"
        boxShadow="0 15px 35px rgba(0, 0, 0, 0.1)"
      >
        <Tabs isFitted variant="soft-rounded" colorScheme="purple">
          <TabList mb={4} p={1} bg="gray.100" borderRadius="xl">
            <Tab fontWeight="600" borderRadius="lg">
              Sign In
            </Tab>
            <Tab fontWeight="600" borderRadius="lg">
              Register
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <Login />
            </TabPanel>
            <TabPanel p={0}>
              <Register />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default HomePage;