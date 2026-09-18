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
  VStack,
  Badge,
  Flex,
  Avatar,
  AvatarBadge,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import Login from "../Components/Authentication/Login.js";
import Register from "../Components/Authentication/Register.js";
import TypingDots from "../animations/TypingDots.js";
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
      py={{ base: 6, md: 10, lg: 12 }}
      px={{ base: 4, sm: 6, lg: 8 }}
      position="relative"
    >
      {/* Top Floating Theme Toggle */}
      {toggleTheme && (
        <Box position="absolute" top={{ base: 3, md: 5 }} right={{ base: 3, md: 6 }} zIndex={20}>
          <Tooltip label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} hasArrow>
            <IconButton
              size="sm"
              variant="outline"
              borderColor={isDark ? "gray.700" : "gray.300"}
              bg={isDark ? "gray.800" : "white"}
              borderRadius="full"
              aria-label="Toggle theme mode"
              icon={
                isDark ? (
                  <i className="fa-solid fa-sun" style={{ color: "#facc15", fontSize: "15px" }} />
                ) : (
                  <i className="fa-solid fa-moon" style={{ color: "#64748b", fontSize: "15px" }} />
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
          align="center"
          justify="space-between"
          gap={{ base: 8, lg: 12 }}
        >
          {/* ================= LEFT COLUMN: HERO SHOWCASE (Desktop & Tablet) ================= */}
          <Box
            flex={{ base: "1", lg: "1.15" }}
            w="100%"
            textAlign={{ base: "center", lg: "left" }}
            display="flex"
            flexDir="column"
            alignItems={{ base: "center", lg: "flex-start" }}
          >
            {/* Top Security Status Pill */}
            <HStack
              mb={4}
              px={3.5}
              py={1.5}
              borderRadius="full"
              bg={isDark ? "gray.800" : "white"}
              borderWidth="1px"
              borderColor={isDark ? "gray.700" : "gray.200"}
              boxShadow="sm"
              spacing={2}
            >
              <Box as="span" className="online-dot" boxSize="7px" />
              <Text fontSize={{ base: "10px", sm: "11px" }} fontWeight="600" color={isDark ? "gray.300" : "gray.700"} letterSpacing="0.03em">
                END-TO-END ENCRYPTED • WEBSOCKETS
              </Text>
            </HStack>

            {/* Brand Logo & Heading */}
            <HStack spacing={3} justify={{ base: "center", lg: "flex-start" }} align="center" mb={3}>
              <Box
                w={{ base: "44px", md: "50px" }}
                h={{ base: "44px", md: "50px" }}
                borderRadius="xl"
                bg="blue.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="sm"
                flexShrink={0}
              >
                <i className="fa-solid fa-comments" style={{ color: "white", fontSize: "22px" }}></i>
              </Box>
              <Heading
                as="h1"
                fontSize={{ base: "3xl", sm: "4xl", md: "5xl" }}
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
              fontSize={{ base: "2xl", sm: "3xl", md: "4xl", lg: "4xl" }}
              fontFamily="Outfit, sans-serif"
              fontWeight="800"
              letterSpacing="-0.02em"
              lineHeight="1.2"
              color={isDark ? "white" : "gray.900"}
              maxW={{ base: "100%", lg: "540px" }}
              mt={2}
            >
              Real-time messaging,{" "}
              <Text as="span" color="blue.500">
                built for teams & friends.
              </Text>
            </Heading>

            {/* Subtitle */}
            <Text
              fontSize={{ base: "sm", sm: "md", md: "lg" }}
              color={isDark ? "gray.400" : "gray.600"}
              fontWeight="400"
              maxW={{ base: "100%", lg: "520px" }}
              mt={3.5}
              lineHeight="tall"
            >
              Instant messaging with full-duplex WebSockets, client-side AES-256-GCM encryption,
              lossless audio voice notes, and seamless multi-user group channels.
            </Text>

            {/* Interactive Live Message Mockup Card (Desktop only) */}
            <Box
              display={{ base: "none", lg: "flex" }}
              flexDir="column"
              w="100%"
              maxW="510px"
              mt={6}
              p={5}
              bg={isDark ? "gray.900" : "white"}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={isDark ? "gray.800" : "gray.200"}
              boxShadow="sm"
            >
              {/* Mockup Chat Header */}
              <Flex justify="space-between" align="center" pb={3} borderBottom="1px solid" borderColor={isDark ? "gray.800" : "gray.100"}>
                <HStack spacing={3}>
                  <Avatar size="sm" name="Sarah Jenkins" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100">
                    <AvatarBadge boxSize="1em" bg="green.500" borderColor={isDark ? "gray.800" : "white"} />
                  </Avatar>
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color={isDark ? "white" : "gray.800"}>
                      Sarah Jenkins
                    </Text>
                    <Text fontSize="10px" color="green.500" fontWeight="600">
                      ● Active now
                    </Text>
                  </Box>
                </HStack>
                <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={2.5} py={0.5} fontSize="10px">
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: "4px" }}></i> AES-256 E2EE
                </Badge>
              </Flex>

              {/* Mockup Messages Flow */}
              <VStack spacing={3} align="stretch" py={3}>
                {/* Receiver Bubble */}
                <Box alignSelf="flex-start" maxW="85%" p={3} bg={isDark ? "gray.800" : "gray.100"} borderRadius="16px 16px 16px 4px">
                  <Text fontSize="xs" color={isDark ? "gray.200" : "gray.800"} fontWeight="500">
                    Hey! Have you tested the new audio voice notes with live waveforms? 🎙️
                  </Text>
                  <Text fontSize="9px" color={isDark ? "gray.400" : "gray.400"} mt={1} textAlign="right">
                    11:42 AM
                  </Text>
                </Box>

                {/* Sender Bubble with Voice Note Simulation */}
                <Box alignSelf="flex-end" maxW="88%" p={3} bg="blue.600" color="white" borderRadius="16px 16px 4px 16px">
                  <Text fontSize="xs" fontWeight="500" mb={2}>
                    Just tried it! Sub-50ms latency is super fast ⚡
                  </Text>
                  <HStack bg="whiteAlpha.200" px={3} py={1.5} borderRadius="full" spacing={2.5}>
                    <i className="fa-solid fa-play" style={{ fontSize: "11px", color: "white" }}></i>
                    <HStack spacing={1}>
                      <Box className="sound-bar" bg="white" style={{ animationDelay: "0.1s" }} />
                      <Box className="sound-bar" bg="white" style={{ animationDelay: "0.3s" }} />
                      <Box className="sound-bar" bg="white" style={{ animationDelay: "0.2s" }} />
                      <Box className="sound-bar" bg="white" style={{ animationDelay: "0.4s" }} />
                      <Box className="sound-bar" bg="white" style={{ animationDelay: "0.15s" }} />
                      <Box className="sound-bar" bg="white" style={{ animationDelay: "0.35s" }} />
                    </HStack>
                    <Text fontSize="10px" fontWeight="600" opacity={0.9}>
                      0:18 • 1.5x
                    </Text>
                  </HStack>
                  <Text fontSize="9px" color="whiteAlpha.800" mt={1} textAlign="right">
                    11:43 AM ✓
                  </Text>
                </Box>

                {/* Live Typing Indicator */}
                <Box alignSelf="flex-start" p={2} px={3} bg={isDark ? "gray.800" : "gray.100"} borderRadius="full">
                  <TypingDots />
                </Box>
              </VStack>
            </Box>

            {/* Feature Highlights Grid */}
            <Flex
              wrap="wrap"
              justify={{ base: "center", lg: "flex-start" }}
              gap={2}
              mt={5}
              w="100%"
            >
              <Badge colorScheme="blue" variant="subtle" borderRadius="lg" px={3} py={1.5} fontSize="11px" fontWeight="600">
                <i className="fa-solid fa-shield-halved" style={{ marginRight: "6px" }}></i> AES-256 E2EE
              </Badge>
              <Badge colorScheme="gray" variant="subtle" borderRadius="lg" px={3} py={1.5} fontSize="11px" fontWeight="600">
                <i className="fa-solid fa-bolt" style={{ marginRight: "6px" }}></i> &lt;50ms Latency
              </Badge>
              <Badge colorScheme="gray" variant="subtle" borderRadius="lg" px={3} py={1.5} fontSize="11px" fontWeight="600">
                <i className="fa-solid fa-microphone" style={{ marginRight: "6px" }}></i> Voice Notes
              </Badge>
              <Badge colorScheme="gray" variant="subtle" borderRadius="lg" px={3} py={1.5} fontSize="11px" fontWeight="600">
                <i className="fa-solid fa-users" style={{ marginRight: "6px" }}></i> Group Chats
              </Badge>
            </Flex>
          </Box>

          {/* ================= RIGHT COLUMN: AUTHENTICATION PORTAL (Both Desktop & Mobile) ================= */}
          <Box
            flex={{ base: "1", lg: "0.85" }}
            w="100%"
            maxW={{ base: "100%", sm: "460px", lg: "440px" }}
            bg={isDark ? "gray.900" : "white"}
            p={{ base: 6, sm: 8 }}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={isDark ? "gray.800" : "gray.200"}
            boxShadow="sm"
          >
            <Tabs isFitted variant="soft-rounded" colorScheme="blue">
              <TabList mb={5} p={1} bg={isDark ? "gray.800" : "gray.100"} borderRadius="xl">
                <Tab
                  fontWeight="600"
                  fontSize="sm"
                  borderRadius="lg"
                  color={isDark ? "gray.400" : "gray.600"}
                  _selected={{ bg: isDark ? "gray.700" : "white", color: isDark ? "blue.300" : "blue.600", boxShadow: "sm" }}
                >
                  Sign In
                </Tab>
                <Tab
                  fontWeight="600"
                  fontSize="sm"
                  borderRadius="lg"
                  color={isDark ? "gray.400" : "gray.600"}
                  _selected={{ bg: isDark ? "gray.700" : "white", color: isDark ? "blue.300" : "blue.600", boxShadow: "sm" }}
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
            <HStack justify="center" spacing={1.5} mt={5} pt={4} borderTop="1px solid" borderColor={isDark ? "gray.800" : "gray.100"}>
              <i className="fa-solid fa-lock" style={{ fontSize: "10px", color: "#16a34a" }}></i>
              <Text fontSize="11px" color={isDark ? "gray.400" : "gray.500"} fontWeight="500">
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