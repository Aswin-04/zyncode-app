
export type signupActionState = {
  success: boolean
  name?: string,
  email?: string,
  password?: string,
  errors?: {
    name?: string[],
    email?: string[],
    password?: string[],
    submissionError?: string[]
  } 
  message?: string[]
} 