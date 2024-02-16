import React, { useState } from 'react'
import { Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, VStack } from '@chakra-ui/react'
import { useToast } from "@chakra-ui/react";
import axios from 'axios'
import {useNavigate} from 'react-router-dom'

const Register = () => {

  const toast = useToast()
  const navigate=useNavigate()

    const[name,setName]=useState('')
    const [email, setEmail] = useState('')
    const[show,setShow]=useState(false)
    const[password,setPassword]=useState('')
    const[confirmPassword,setConfirmPassword]=useState('')
    const [pic, setPic] = useState('')
    const [loading,setLoading]=useState(false)
    

    const handleClick = () => setShow(!show)
    
     const postDetails = (pics) => {
       setLoading(true);
       if (pic === undefined) {
         toast({
           title: "Please Select an Image",
           status: "warning",
           duration: 3000,
           isClosable: true,
           position: "bottom",
         });
         return;
       }

       if (pics.type === "image/jpeg" || pics.type === "image/png") {
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
             setPic(data.url.toString());
             setLoading(false);
           })
           .catch((err) => {
             console.log(err);
             setLoading(false);
           });
       } else {
         toast({
           title: "Please Select an Image",
           status: "warning",
           duration: 3000,
           isClosable: true,
           position: "bottom",
         });
         setLoading(false);
         return;
       }
     };

  const submitHandler =async () => {
    setLoading(true)
    if (!name || !email || !password || !confirmPassword) {
       toast({
         title: "Fill Required Fields",
         status: "warning",
         duration: 3000,
         isClosable: true,
         position: "bottom",
       });
      setLoading(false)
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password Doesn't Match",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      })
      navigate('/')
      return
    }

    try {
      const config = {
        headers: {
          "Content-type":"application/json"
        }
      }

      const { data } = await axios.post('/api/user', { name, email, password, pic }, config)
          toast({
            title: "Registration Successful",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
      localStorage.setItem('userInfo', JSON.stringify(data))
      setLoading(false)
      navigate('/chats')
      
    } catch (error) {
        toast({
          title: "Error Ocurred",
          description:error.response.data.message,
          status: "warning",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
    }
    }

  return (
    <VStack spacing="5px">
      <FormControl id="name" isRequired>
        <FormLabel>Name</FormLabel>
        <Input
          placeholder="Enter Your Name"
                  onChange={(e) => setName(e.target.value)}
                  
        />
      </FormControl>

      <FormControl id="email" isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          placeholder="Enter Your Email"
                  onChange={(e) => setEmail(e.target.value)}
                  
        />
      </FormControl>

      <FormControl id="password" isRequired>
        <FormLabel>Password</FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter Password"
                      onChange={(e) => setPassword(e.target.value)}
                    
          />
          <InputRightElement>
            <Button h="1.75rem" size="sm" onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <FormControl id="confirmPassword" isRequired>
        <FormLabel> Confirm Password</FormLabel>
        <InputGroup>
          <Input
            type={show ? "text" : "password"}
            placeholder="Confirm Password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    
          />
          <InputRightElement>
            <Button h="1.75rem" size="sm" onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
          </FormControl>
          

          <FormControl>
              <FormLabel>Upload Your Picture</FormLabel>
              <Input type='file' p={1.5} accept='image/*'
                  onChange={(e)=>postDetails(e.target.files[0])}
              />
          </FormControl>

          <Button colorScheme='blue' width='100%' style={{ marginTop: 15 }}
          onClick={submitHandler} isLoading={loading}>
              Register
          </Button>
    </VStack>
  );
}

export default Register