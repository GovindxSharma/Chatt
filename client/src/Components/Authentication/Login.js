import { FormControl, FormLabel, VStack,Input ,InputGroup,InputRightElement,Button, useToast} from '@chakra-ui/react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {


  const toast = useToast();
  const navigate=useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)


    
  const handleClick = () => setShow(!show);
  
    const submitHandler = async() =>  {
      setLoading(true)
      if (!email || !password) {
          toast({
            title: "Fill the Required Fields",
            status: "warning",
            duration: 3000,
            isClosable: true,
            position: "bottom",
          });
        setLoading(false)
        return
      }
      try {
        const config = {
          headers: {
            "Content-type":"application/json",
          },
        }

        const { data } = await axios.post('/api/user/login',
          { email, password }, config)
        
          toast({
            title: "Login SuccessFull",
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "bottom",
          });
        
        
        localStorage.setItem('userInfo', JSON.stringify(data))
        setLoading(false);
        navigate('/chats')
      } catch (error) {
        
          toast({
            title: "Error Ocurred",
            description:error.response.data.message,
            status: "error",
            duration: 3000,
            isClosable: true,
            position: "bottom",
          });
      }
    
    }
    
    

  return (
    <VStack>
      <FormControl isRequired>
        <FormLabel>Email Address</FormLabel>
        <Input
          placeholder="Enter Your Email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
      </FormControl>

      <FormControl  isRequired>
        <FormLabel>Password</FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter Password"
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
          />
          <InputRightElement>
            <Button h="1.75rem" size="sm" onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
          </FormControl>
          
          <Button colorScheme='blue' width='100%' color='white' style={{ marginTop: 15 }}
        onClick={submitHandler}
        isLoading={loading}
      >
              
              Login
          </Button>

          <Button variant='solid'
              colorScheme='red'
              width='100%'
              onClick={() => {
                  setEmail('guest@example.com')
                  setPassword('123456')
              }}>
              Guest User
          </Button>

    </VStack>
  );
}

export default Login