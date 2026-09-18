import React, { useEffect } from "react";
import {
  Box,
  Container,
  Text,
  Heading,
  Tab,
  TabPanels,
  TabPanel,
  TabList,
  Tabs,
  HStack,
  Flex,
  IconButton,
  Tooltip,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import Login from "../Components/Authentication/Login.js";
import Register from "../Components/Authentication/Register.js";
import ServerStatusPill from "../Components/Home/ServerStatusPill.js";
import InteractivePlayground from "../Components/Home/InteractivePlayground.js";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../Context/ChatProvider.js";

const HomePage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = ChatState() || {};

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("userInfo"));
      if (user) navigate("/chats");
    } catch (e) {}
  }, [navigate]);

  return (
    <Box
      minH="100vh"
      w="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={isDark ? "#090d16" : "#f8fafc"}
      py={{ base: 6, md: 8, lg: 10 }}
      px={{ base: 4, sm: 6, lg: 8 }}
      position="relative"
    >
      {/* Top Floating Theme Toggle */}
      {toggleTheme && (
        <Box
          position="absolute"
          top={{ base: 3, md: 5 }}
          right={{ base: 3, md: 6 }}
          zIndex={20}
        >
          <Tooltip
            label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            hasArrow
          >
            <IconButton
              size="sm"
              variant="outline"
              borderColor={isDark ? "gray.700" : "gray.300"}
              bg={isDark ? "gray.800" : "white"}
              borderRadius="full"
              aria-label="Toggle theme mode"
              icon={
                isDark ? (
                  <i
                    className="fa-solid fa-sun"
                    style={{ color: "#facc15", fontSize: "15px" }}
                  />
                ) : (
                  <i
                    className="fa-solid fa-moon"
                    style={{ color: "#64748b", fontSize: "15px" }}
                  />
                )
              }
              onClick={toggleTheme}
              boxShadow="sm"
            />
          </Tooltip>
        </Box>
      )}

      <Container maxW="container.xl" p={0}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          align={{ base: "center", lg: "flex-start" }}
          justify="space-between"
          gap={{ base: 8, lg: 10 }}
        >
          {/* ================= LEFT COLUMN: HERO & ENGAGING INTERACTIVE PLAYGROUND ================= */}
          <Box
            flex={{ base: "1", lg: "1.2" }}
            w="100%"
            textAlign={{ base: "center", lg: "left" }}
            display="flex"
            flexDir="column"
            alignItems={{ base: "center", lg: "flex-start" }}
          >
            {/* Top Status & Security Badges Row */}
            <Wrap
              spacing={2}
              mb={3}
              justify={{ base: "center", lg: "flex-start" }}
              align="center"
            >
              <WrapItem>
                <ServerStatusPill isDark={isDark} />
              </WrapItem>
              <WrapItem>
                <HStack
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  bg={isDark ? "gray.800" : "white"}
                  borderWidth="1px"
                  borderColor={isDark ? "gray.700" : "gray.200"}
                  boxShadow="sm"
                  spacing={2}
                >
                  <Box as="span" className="online-dot" boxSize="6px" />
                  <Text
                    fontSize={{ base: "10px", sm: "11px" }}
                    fontWeight="600"
                    color={isDark ? "gray.300" : "gray.700"}
                    letterSpacing="0.03em"
                  >
                    AES-256 E2EE • WEBSOCKETS
                  </Text>
                </HStack>
              </WrapItem>
            </Wrap>

            {/* Brand Logo & Heading (h1 for SEO) */}
            <HStack
              spacing={3}
              justify={{ base: "center", lg: "flex-start" }}
              align="center"
              mb={2}
            >
              <Box
                w={{ base: "42px", md: "48px" }}
                h={{ base: "42px", md: "48px" }}
                borderRadius="xl"
                bg="blue.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="sm"
                flexShrink={0}
              >
                <i
                  className="fa-solid fa-comments"
                  style={{ color: "white", fontSize: "20px" }}
                />
              </Box>
              <Heading
                as="h1"
                fontSize={{ base: "3xl", sm: "4xl", md: "4.5xl" }}
                fontFamily="Outfit, sans-serif"
                fontWeight="800"
                letterSpacing="-0.03em"
                color={isDark ? "white" : "gray.900"}
                lineHeight="1"
              >
                Chatt
              </Heading>
            </HStack>

            {/* Clean Headline */}
            <Heading
              as="h2"
              fontSize={{ base: "2xl", sm: "3xl", md: "3.5xl" }}
              fontFamily="Outfit, sans-serif"
              fontWeight="800"
              letterSpacing="-0.02em"
              lineHeight="1.2"
              color={isDark ? "white" : "gray.900"}
              maxW={{ base: "100%", lg: "540px" }}
              mt={1}
            >
              Real-time messaging,{" "}
              <Text as="span" color="blue.500">
                built for teams & friends.
              </Text>
            </Heading>

            {/* Subtitle */}
            <Text
              fontSize={{ base: "xs", sm: "sm", md: "md" }}
              color={isDark ? "gray.400" : "gray.600"}
              fontWeight="400"
              maxW={{ base: "100%", lg: "530px" }}
              mt={2}
              lineHeight="tall"
            >
              Instant messaging with full-duplex WebSockets, zero-knowledge AES-256-GCM encryption,
              and lossless voice notes.
            </Text>

            {/* Interactive Feature Playground (Live Chat, Cipher Tester, Synth, Speed Typing) */}
            <InteractivePlayground isDark={isDark} />
          </Box>

          {/* ================= RIGHT COLUMN: AUTHENTICATION PORTAL ================= */}
          <Box
            flex={{ base: "1", lg: "0.8" }}
            w="100%"
            maxW={{ base: "100%", sm: "460px", lg: "430px" }}
            bg={isDark ? "gray.900" : "white"}
            p={{ base: 6, sm: 7 }}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={isDark ? "gray.800" : "gray.200"}
            boxShadow="sm"
            alignSelf={{ base: "center", lg: "flex-start" }}
          >
            <Tabs isFitted variant="soft-rounded" colorScheme="blue">
              <TabList
                mb={4}
                p={1}
                bg={isDark ? "gray.800" : "gray.100"}
                borderRadius="xl"
              >
                <Tab
                  fontWeight="600"
                  fontSize="sm"
                  borderRadius="lg"
                  color={isDark ? "gray.400" : "gray.600"}
                  _selected={{
                    bg: isDark ? "gray.700" : "white",
                    color: isDark ? "blue.300" : "blue.600",
                    boxShadow: "sm",
                  }}
                >
                  Sign In
                </Tab>
                <Tab
                  fontWeight="600"
                  fontSize="sm"
                  borderRadius="lg"
                  color={isDark ? "gray.400" : "gray.600"}
                  _selected={{
                    bg: isDark ? "gray.700" : "white",
                    color: isDark ? "blue.300" : "blue.600",
                    boxShadow: "sm",
                  }}
                >
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

            {/* Privacy Guarantee Note */}
            <HStack
              justify="center"
              spacing={1.5}
              mt={4}
              pt={3.5}
              borderTop="1px solid"
              borderColor={isDark ? "gray.800" : "gray.100"}
            >
              <i
                className="fa-solid fa-lock"
                style={{ fontSize: "10px", color: "#16a34a" }}
              />
              <Text
                fontSize="11px"
                color={isDark ? "gray.400" : "gray.500"}
                fontWeight="500"
              >
                End-to-end encrypted • Zero plaintext stored
              </Text>
            </HStack>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default HomePage;