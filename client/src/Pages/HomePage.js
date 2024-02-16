import React, { useEffect } from 'react'
import { Box, Container, Text, Tab, TabPanels, TabPanel, TabList, Tabs, } from '@chakra-ui/react'
import Login from '../Components/Authentication/Login.js'
import Register from '../Components/Authentication/Register.js'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {

  const navigate = useNavigate()
  useEffect(() => {
    const user=JSON.parse(localStorage.getItem("userInfo"))
    if(user)navigate('chats')
  },[navigate])


  return (
    <Container maxW="xl" centerContent>
      <Box
        display="flex"
        justifyContent="center"
        p={3}
        bg="white"
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
      >
        <Text fontSize="4xl" fontFamily="Work sans">
          Chat-To-Talk
        </Text>
      </Box>
      <Box bg="white" w="100%" p={4} borderRadius="lg" borderWidth="1px">
        <Tabs isFitted variant="soft-rounded">
          <TabList mb="1em">
            <Tab>Login</Tab>
            <Tab>Register</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Register />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

export default HomePage