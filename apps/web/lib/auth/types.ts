
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


export interface UserSession {
  userId: string, 
  name: string,
  email: string,
  sessionToken: string
} 


export type UserSessionResult = 
  | {status: "authorized", user: UserSession}
  | {status: "unauthorized", user: null}
  | {status: "error", user: null}
