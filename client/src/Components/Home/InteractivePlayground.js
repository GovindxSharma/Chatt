import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Input,
  Button,
  Avatar,
  AvatarBadge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
} from "@chakra-ui/react";
import TypingDots from "../../animations/TypingDots";
import { encryptText, decryptText } from "../../config/cryptoLogics";

const TYPING_SENTENCES = [
  "End to end encrypted messaging gives you full privacy and security.",
  "WebSockets enable real-time bidirectional communication with low latency.",
  "Chatt delivers instant audio notes with live waveform rendering.",
  "Zero plaintext data is ever stored on the server database.",
  "Sub-50ms latency makes team communication completely frictionless.",
];

const TECH_FACTS = [
  {
    icon: "fa-shield-halved",
    color: "#3b82f6",
    title: "Zero-Knowledge Encryption",
    text: "Messages are encrypted using AES-256-GCM in your browser before ever reaching the network.",
  },
  {
    icon: "fa-bolt",
    color: "#eab308",
    title: "Full-Duplex WebSockets",
    text: "Socket.IO maintains persistent TCP channels, eliminating 90% of traditional HTTP overhead.",
  },
  {
    icon: "fa-microphone-lines",
    color: "#10b981",
    title: "Lossless Audio Streaming",
    text: "Web Audio API synthesizes chimes and processes audio voice notes locally with live waveforms.",
  },
  {
    icon: "fa-cloud",
    color: "#8b5cf6",
    title: "Automated Standby Awakening",
    text: "Render cloud services auto-warm in the background so your chat session is instantly ready.",
  },
];

const InteractivePlayground = ({ isDark }) => {
  // Active sub-tab
  const [activeTab, setActiveTab] = useState(0);

  // 1. E2EE Cipher Tester State
  const [plainInput, setPlainInput] = useState("Hello from Chatt! 🔒");
  const [cipherOutput, setCipherOutput] = useState("");
  const [decryptedView, setDecryptedView] = useState("");

  useEffect(() => {
    let isCancelled = false;
    const runCipher = async () => {
      if (!plainInput) {
        setCipherOutput("");
        setDecryptedView("");
        return;
      }
      try {
        const encrypted = await encryptText(plainInput, "demo-room-key-789");
        if (!isCancelled) {
          setCipherOutput(encrypted);
          const decrypted = await decryptText(encrypted, "demo-room-key-789");
          setDecryptedView(decrypted);
        }
      } catch (e) {
        // Fallback
      }
    };

    const timer = setTimeout(runCipher, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [plainInput]);

  // 2. Interactive Sandbox Chat State
  const [sandboxMessages, setSandboxMessages] = useState([
    {
      id: 1,
      sender: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      content: "Hey! Welcome to Chatt. Test our real-time AES-256 encrypted chat! 👋",
      time: "Just now",
      isSelf: false,
    },
    {
      id: 2,
      sender: "You",
      avatar: "",
      content: "Fast and sleek! Are voice notes and group channels supported? ⚡",
      time: "Just now",
      isSelf: true,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);

  const handleSendSandboxMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "You",
      content: chatInput.trim(),
      time: "Just now",
      isSelf: true,
    };
    setSandboxMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    // Simulate instant bot response
    setIsBotTyping(true);
    setTimeout(() => {
      setIsBotTyping(false);
      const botReplies = [
        "🔒 Message received & decrypted locally with AES-256-GCM!",
        "⚡ Sub-50ms delivery verified over WebSockets!",
        "🎙️ Tap the Audio tab to test live waveform visualization!",
        "🚀 Backend is fully warm and ready for sign-in or guest demo!",
      ];
      const reply =
        botReplies[Math.floor(Math.random() * botReplies.length)];
      setSandboxMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "Sarah Jenkins",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          content: reply,
          time: "Just now",
          isSelf: false,
        },
      ]);
    }, 900);
  };

  // 3. Audio Synth / Waveform Visualizer
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState("1.0x");
  const audioIntervalRef = useRef(null);
  const [waveHeights, setWaveHeights] = useState([12, 24, 18, 28, 16, 22, 30, 14, 20]);

  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    } else {
      setIsPlayingAudio(true);
      // Play web audio chime
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (e) {}

      audioIntervalRef.current = setInterval(() => {
        setWaveHeights(
          Array.from({ length: 9 }, () => Math.floor(Math.random() * 26) + 8)
        );
      }, 120);

      setTimeout(() => {
        setIsPlayingAudio(false);
        if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      }, 4000);
    }
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  // 4. Speed-Typing Mini Challenge
  const [targetSentenceIndex, setTargetSentenceIndex] = useState(0);
  const [typeInput, setTypeInput] = useState("");
  const [isTypingGameActive, setIsTypingGameActive] = useState(false);
  const [typingGameFinished, setTypingGameFinished] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [wpmScore, setWpmScore] = useState(0);

  const currentSentence = TYPING_SENTENCES[targetSentenceIndex];

  const handleTypeInputChange = (e) => {
    const val = e.target.value;
    if (!isTypingGameActive && val.length === 1) {
      setIsTypingGameActive(true);
      setGameStartTime(Date.now());
      setTypingGameFinished(false);
    }

    setTypeInput(val);

    if (val === currentSentence) {
      const elapsedMinutes = (Date.now() - gameStartTime) / 60000 || 0.05;
      const wordsCount = currentSentence.split(" ").length;
      const computedWpm = Math.round(wordsCount / elapsedMinutes);
      setWpmScore(computedWpm > 0 ? computedWpm : 65);
      setIsTypingGameActive(false);
      setTypingGameFinished(true);
    }
  };

  const resetTypingGame = () => {
    setTargetSentenceIndex((prev) => (prev + 1) % TYPING_SENTENCES.length);
    setTypeInput("");
    setIsTypingGameActive(false);
    setTypingGameFinished(false);
    setGameStartTime(null);
    setWpmScore(0);
  };

  // 5. Tech Fact Rotator
  const [factIndex, setFactIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % TECH_FACTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const activeFact = TECH_FACTS[factIndex];

  return (
    <Box
      w="100%"
      maxW="540px"
      bg={isDark ? "gray.900" : "white"}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={isDark ? "gray.800" : "gray.200"}
      boxShadow="sm"
      p={{ base: 4, sm: 5 }}
      mt={4}
    >
      {/* Interactive Tabs Header */}
      <Tabs
        variant="soft-rounded"
        colorScheme="blue"
        size="sm"
        index={activeTab}
        onChange={(idx) => setActiveTab(idx)}
      >
        <TabList
          bg={isDark ? "gray.800" : "gray.100"}
          p={1}
          borderRadius="xl"
          overflowX="auto"
          flexWrap="nowrap"
        >
          <Tab
            fontSize="xs"
            fontWeight="600"
            borderRadius="lg"
            whiteSpace="nowrap"
            _selected={{
              bg: isDark ? "gray.700" : "white",
              color: isDark ? "blue.300" : "blue.600",
              boxShadow: "sm",
            }}
          >
            <i className="fa-solid fa-comments" style={{ marginRight: "6px" }} />
            Live Chat
          </Tab>
          <Tab
            fontSize="xs"
            fontWeight="600"
            borderRadius="lg"
            whiteSpace="nowrap"
            _selected={{
              bg: isDark ? "gray.700" : "white",
              color: isDark ? "blue.300" : "blue.600",
              boxShadow: "sm",
            }}
          >
            <i className="fa-solid fa-shield-halved" style={{ marginRight: "6px" }} />
            E2EE Cipher
          </Tab>
          <Tab
            fontSize="xs"
            fontWeight="600"
            borderRadius="lg"
            whiteSpace="nowrap"
            _selected={{
              bg: isDark ? "gray.700" : "white",
              color: isDark ? "blue.300" : "blue.600",
              boxShadow: "sm",
            }}
          >
            <i className="fa-solid fa-waveform-lines" style={{ marginRight: "6px" }} />
            Audio Wave
          </Tab>
          <Tab
            fontSize="xs"
            fontWeight="600"
            borderRadius="lg"
            whiteSpace="nowrap"
            _selected={{
              bg: isDark ? "gray.700" : "white",
              color: isDark ? "blue.300" : "blue.600",
              boxShadow: "sm",
            }}
          >
            <i className="fa-solid fa-keyboard" style={{ marginRight: "6px" }} />
            Speed Type
          </Tab>
        </TabList>

        <TabPanels mt={3}>
          {/* ================= PANEL 1: LIVE CHAT SANDBOX ================= */}
          <TabPanel p={0}>
            <Box>
              {/* Header */}
              <Flex
                justify="space-between"
                align="center"
                pb={2.5}
                borderBottom="1px solid"
                borderColor={isDark ? "gray.800" : "gray.100"}
              >
                <HStack spacing={2.5}>
                  <Avatar
                    size="xs"
                    name="Sarah Jenkins"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                  >
                    <AvatarBadge boxSize="1em" bg="green.500" />
                  </Avatar>
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color={isDark ? "white" : "gray.800"}>
                      Sarah Jenkins
                    </Text>
                    <Text fontSize="9px" color="green.500" fontWeight="600">
                      ● Active Sandbox
                    </Text>
                  </Box>
                </HStack>
                <Badge
                  colorScheme="blue"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="9px"
                >
                  <i className="fa-solid fa-lock" style={{ marginRight: "3px" }} /> E2EE Encrypted
                </Badge>
              </Flex>

              {/* Message Feed */}
              <VStack
                spacing={2.5}
                align="stretch"
                py={3}
                maxH="170px"
                minH="170px"
                overflowY="auto"
              >
                {sandboxMessages.map((msg) => (
                  <Box
                    key={msg.id}
                    alignSelf={msg.isSelf ? "flex-end" : "flex-start"}
                    maxW="88%"
                    p={2.5}
                    px={3}
                    bg={
                      msg.isSelf
                        ? "blue.600"
                        : isDark
                        ? "gray.800"
                        : "gray.100"
                    }
                    color={
                      msg.isSelf
                        ? "white"
                        : isDark
                        ? "gray.200"
                        : "gray.800"
                    }
                    borderRadius={
                      msg.isSelf
                        ? "14px 14px 2px 14px"
                        : "14px 14px 14px 2px"
                    }
                    boxShadow="xs"
                  >
                    <Text fontSize="xs" fontWeight="500">
                      {msg.content}
                    </Text>
                    <Text
                      fontSize="8px"
                      color={msg.isSelf ? "whiteAlpha.700" : "gray.400"}
                      mt={1}
                      textAlign="right"
                    >
                      {msg.time} {msg.isSelf && "✓✓"}
                    </Text>
                  </Box>
                ))}

                {isBotTyping && (
                  <Box
                    alignSelf="flex-start"
                    p={2}
                    px={3}
                    bg={isDark ? "gray.800" : "gray.100"}
                    borderRadius="full"
                  >
                    <TypingDots />
                  </Box>
                )}
              </VStack>

              {/* Chat Input Bar */}
              <HStack
                as="form"
                onSubmit={handleSendSandboxMessage}
                spacing={2}
                pt={2}
                borderTop="1px solid"
                borderColor={isDark ? "gray.800" : "gray.100"}
              >
                <Input
                  size="sm"
                  placeholder="Send a simulated encrypted message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  borderRadius="xl"
                  bg={isDark ? "gray.800" : "gray.50"}
                  color={isDark ? "white" : "gray.900"}
                  borderWidth="1px"
                  borderColor={isDark ? "gray.700" : "gray.200"}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3b82f6",
                  }}
                  fontSize="xs"
                />
                <IconButton
                  size="sm"
                  colorScheme="blue"
                  bg="blue.600"
                  aria-label="Send message"
                  icon={<i className="fa-solid fa-paper-plane" />}
                  type="submit"
                  borderRadius="xl"
                />
              </HStack>
            </Box>
          </TabPanel>

          {/* ================= PANEL 2: E2EE CIPHER TESTER ================= */}
          <TabPanel p={0}>
            <VStack spacing={2.5} align="stretch">
              <Box>
                <Text fontSize="10px" fontWeight="700" color={isDark ? "gray.400" : "gray.600"} mb={1}>
                  PLAINTEXT INPUT (CLIENT SIDE)
                </Text>
                <Input
                  size="sm"
                  value={plainInput}
                  onChange={(e) => setPlainInput(e.target.value)}
                  placeholder="Type anything to watch real-time encryption..."
                  borderRadius="xl"
                  bg={isDark ? "gray.800" : "gray.50"}
                  fontSize="xs"
                />
              </Box>

              <Box>
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="10px" fontWeight="700" color="blue.400">
                    <i className="fa-solid fa-lock" style={{ marginRight: "4px" }} />
                    AES-256-GCM CIPHERTEXT (NETWORK PAYLOAD)
                  </Text>
                  <Badge colorScheme="purple" fontSize="9px">
                    256-bit Key
                  </Badge>
                </Flex>
                <Box
                  p={2.5}
                  borderRadius="xl"
                  bg={isDark ? "blackAlpha.700" : "gray.900"}
                  color="green.400"
                  fontFamily="monospace"
                  fontSize="10px"
                  minH="50px"
                  maxH="50px"
                  overflowY="auto"
                  wordBreak="break-all"
                  borderWidth="1px"
                  borderColor={isDark ? "gray.700" : "gray.800"}
                >
                  {cipherOutput || "Waiting for input..."}
                </Box>
              </Box>

              <Box
                p={2}
                borderRadius="xl"
                bg={isDark ? "blue.950" : "blue.50"}
                borderWidth="1px"
                borderColor={isDark ? "blue.900" : "blue.100"}
              >
                <Text fontSize="10px" color={isDark ? "blue.200" : "blue.800"} fontWeight="600">
                  ✓ Decrypted in browser: "{decryptedView || "..."}"
                </Text>
              </Box>
            </VStack>
          </TabPanel>

          {/* ================= PANEL 3: AUDIO WAVEFORM SYNTH ================= */}
          <TabPanel p={0}>
            <VStack spacing={3} align="stretch" py={1}>
              <Flex
                justify="space-between"
                align="center"
                p={3}
                bg={isDark ? "gray.800" : "gray.50"}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={isDark ? "gray.700" : "gray.200"}
              >
                <HStack spacing={3}>
                  <IconButton
                    size="sm"
                    colorScheme="blue"
                    borderRadius="full"
                    aria-label="Play audio sample"
                    icon={
                      <i
                        className={
                          isPlayingAudio
                            ? "fa-solid fa-pause"
                            : "fa-solid fa-play"
                        }
                      />
                    }
                    onClick={togglePlayAudio}
                  />
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color={isDark ? "white" : "gray.800"}>
                      Live Waveform Demo 🎙️
                    </Text>
                    <Text fontSize="10px" color={isDark ? "gray.400" : "gray.500"}>
                      Web Audio API Synthesizer
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={1} align="center" h="36px" px={2}>
                  {waveHeights.map((h, i) => (
                    <Box
                      key={i}
                      w="4px"
                      h={`${h}px`}
                      bg={isPlayingAudio ? "blue.500" : isDark ? "gray.600" : "gray.300"}
                      borderRadius="full"
                      transition="height 0.1s ease"
                    />
                  ))}
                </HStack>

                <Button
                  size="xs"
                  variant="outline"
                  borderRadius="lg"
                  onClick={() => {
                    const speeds = ["1.0x", "1.5x", "2.0x"];
                    const nextIdx = (speeds.indexOf(audioSpeed) + 1) % speeds.length;
                    setAudioSpeed(speeds[nextIdx]);
                  }}
                >
                  {audioSpeed}
                </Button>
              </Flex>

              <Text fontSize="10px" color={isDark ? "gray.400" : "gray.500"} textAlign="center">
                Chatt voice notes use client-side Opus compression with sub-50ms rendering.
              </Text>
            </VStack>
          </TabPanel>

          {/* ================= PANEL 4: 10-SECOND SPEED TYPING ================= */}
          <TabPanel p={0}>
            <VStack spacing={2.5} align="stretch">
              <Box
                p={2.5}
                borderRadius="xl"
                bg={isDark ? "gray.800" : "gray.50"}
                borderWidth="1px"
                borderColor={isDark ? "gray.700" : "gray.200"}
              >
                <Text fontSize="11px" fontWeight="600" color={isDark ? "gray.200" : "gray.800"} lineHeight="tall">
                  "{currentSentence}"
                </Text>
              </Box>

              <Input
                size="sm"
                placeholder="Type the sentence above to test your speed..."
                value={typeInput}
                onChange={handleTypeInputChange}
                borderRadius="xl"
                bg={isDark ? "gray.800" : "white"}
                fontSize="xs"
                disabled={typingGameFinished}
              />

              {typingGameFinished ? (
                <HStack
                  justify="space-between"
                  p={2}
                  px={3}
                  bg="green.50"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="green.200"
                >
                  <Text fontSize="xs" fontWeight="700" color="green.700">
                    🔥 Score: {wpmScore} WPM! Outstanding speed!
                  </Text>
                  <Button size="xs" colorScheme="green" onClick={resetTypingGame}>
                    Next Sentence
                  </Button>
                </HStack>
              ) : (
                <Flex justify="space-between" align="center">
                  <Text fontSize="10px" color={isDark ? "gray.400" : "gray.500"}>
                    {isTypingGameActive ? "⚡ Timing in progress..." : "Start typing to begin!"}
                  </Text>
                  <Button size="xs" variant="ghost" onClick={resetTypingGame}>
                    Skip
                  </Button>
                </Flex>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Dynamic Engineering Insights Carousel */}
      <HStack
        mt={3.5}
        pt={2.5}
        borderTop="1px solid"
        borderColor={isDark ? "gray.800" : "gray.100"}
        spacing={2.5}
        align="center"
      >
        <Box
          boxSize="24px"
          borderRadius="md"
          bg={activeFact.color}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <i
            className={`fa-solid ${activeFact.icon}`}
            style={{ color: "white", fontSize: "11px" }}
          />
        </Box>
        <Box flex="1" overflow="hidden">
          <Text fontSize="10px" fontWeight="700" color={isDark ? "white" : "gray.800"} noOfLines={1}>
            {activeFact.title}
          </Text>
          <Text fontSize="9px" color={isDark ? "gray.400" : "gray.500"} noOfLines={1}>
            {activeFact.text}
          </Text>
        </Box>
        <Badge
          colorScheme="blue"
          variant="outline"
          fontSize="8px"
          borderRadius="full"
          px={1.5}
        >
          TIP {factIndex + 1}/{TECH_FACTS.length}
        </Badge>
      </HStack>
    </Box>
  );
};

export default InteractivePlayground;
