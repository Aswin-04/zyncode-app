import {z} from 'zod/v4'

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, {error: 'Name must be at least 2 characters long.'})
    .trim(),
  email: z
    .email({error: 'Please enter a valid email.'})
    .trim()
    .toLowerCase(),
  password: z 
    .string()
    .min(8, {error: 'Be at least 8 characters long.'})
    .regex(/[a-zA-Z]/, {error: 'Contain at least 1 letter'}) 
    .regex(/[0-9]/, {error: 'Contain at least 1 number'}) 
    .regex(/[^a-zA-Z0-9]/, {error: 'Contain at least 1 special character'})
    .trim()
})

export const signinSchema = z.object({
  email: z
    .email({error: 'Please enter a valid email.'})
    .trim()
    .toLowerCase(),
  password: z 
    .string()
    .min(1, {error: 'Please enter your password'})
})