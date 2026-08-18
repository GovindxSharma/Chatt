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
    <Container maxW="lg" centerContent py={{ base: 6, md: 10 }}>
      {/* Brand Header */}
      <Box
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        p={4}
        bg="white"
        w="100%"
        mb={4}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
        textAlign="center"
      >
        <HStack spacing={2} justify="center">
          <i className="fa-solid fa-comments" style={{ color: "#3b82f6", fontSize: "28px" }}></i>
          <Text
            fontSize={{ base: "3xl", md: "4xl" }}
            fontFamily="Work sans"
            fontWeight="700"
            color="gray.800"
          >
            Chat-To-Talk
          </Text>
        </HStack>
        <Text fontSize="xs" color="gray.500" fontWeight="500" mt={1}>
          Real-time, Instant & Secure Messaging
        </Text>
      </Box>

      {/* Tabs Container */}
      <Box
        bg="white"
        w="100%"
        p={{ base: 5, md: 6 }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <Tabs isFitted variant="soft-rounded" colorScheme="blue">
          <TabList mb={4} p={1} bg="gray.100" borderRadius="xl">
            <Tab fontWeight="600" borderRadius="lg">
              Login
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