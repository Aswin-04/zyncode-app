import * as z from 'zod/v4'

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(50, "Password must be less than 50 characters")


const emailSchema = z
  .email()
  .min(1)
  .transform((email) => email.toLowerCase())
  

const nameSchema = z 
  .string()
  .min(1)
  .max(50)


export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
}) 