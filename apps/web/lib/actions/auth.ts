  'use server'
  import axios from '@/lib/axios'
import { AxiosError } from 'axios'

  export const loginAction = async (prevState:any, formData: FormData) =>  {
    const email = formData.get('email')
    const password = formData.get('password')
    try {
      const res = await axios.post('/auth/login', {email, password})
      return {
        success: true,
        ...res.data
      }
    }
    catch(err:any) {
      console.log(err.response.data)
      if(err instanceof AxiosError) {
        return {
          success: false,
          email,
          password,
          fieldErrors: err.response?.data.error?.fieldErrors 
        }
      }

      else {
        console.log("internal server error")
      }
    }
  }

  export const signupAction = async (prevState:any, formData: FormData) => {
    const name = formData.get('name')
    const email = formData.get('email')
    const password = formData.get('password')
    console.log({name, email, password})

    try {
      const res = await axios.post('/auth/signup', {name, email, password})
      console.log(res.data)
      return {
        success: true,
        ...res.data
      }
    }

    catch(err:any) {
      console.log(err)
      return {
        success: false,
        name,
        email, 
        password,
        fieldErrors: err?.response?.data?.error?.fieldErrors
      }
    }
    
  }   