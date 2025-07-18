'use server'
import * as db from '@repo/db'
import { z } from "zod/v4";
import { signupActionState } from "./types";
import { signinSchema, signupSchema } from "./schema";
import { comparePasswords, generateSalt, hashPassword } from "./hash";
import { createUserSession, revokeUserSession } from './session';

export async function signupAction(
  _prevState: signupActionState,
  formData: FormData
): Promise<signupActionState> {

  const name = formData.get("name")?.toString().trim()  as string
  const email = formData.get("email")?.toString().toLowerCase().trim() as string
  const password = formData.get("password") as string;

  const validatedFields = signupSchema.safeParse({ name, email, password });

  if (!validatedFields.success) {
    return {
      success: false,
      name,
      email,
      password,
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  try {
    await db.query({text: 'BEGIN'})
    const salt = generateSalt()
    const hashedPassword = await hashPassword(password, salt)
  
    const data = await db.query({
      text: `
        INSERT INTO users(
          name, 
          email_address, 
          password_hashed, 
          password_salt
        ) VALUES($1, $2, $3, $4)
        RETURNING id;
      `,
      values: [name, email, hashedPassword, salt]
    })
  
    const userId = data.rows[0].id
    await createUserSession({userId, name, email})
    await db.query({text: 'COMMIT'})
      
    return {
      success: true,
      message: ['Account created successfully']
    }
  } 
  
  catch(err: any) {
    try {
      await db.query({text: 'ROLLBACK'})
    } 

    catch(dbErr) {
      console.log('db is down', dbErr)
      return { success: false, errors: { submissionError: ['Something went wrong. Please try again shortly.']}}
    }

    if(err.code === 'ECONNREFUSED') {
      return { success: false, errors: { submissionError: ['Something went wrong. Please try again shortly.']}}
    }

    if(err.code === '23505') {
      return { success: false, errors: { submissionError: ['An account with this email already exists. Try logging in instead.']}}
    }

    console.error('Unexpected error in signup:', err)
    return {
      success: false,
      errors: {
        submissionError: ['Something went wrong. Please try again shortly.'],
      }
    }
  }
}

export async function signinAction(
  _prevState: signupActionState,
  formData: FormData
): Promise<signupActionState> {
  const email = formData.get("email")?.toString().toLowerCase().trim() as string
  const password = formData.get("password") as string;

  const validatedFields = signinSchema.safeParse({ email, password });

  if (!validatedFields.success) {
    return {
      success: false,
      email,
      password,
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  try {
    const data = await db.query({
      text: `SELECT id, name, password_hashed, password_salt FROM users WHERE email_address=$1;`,
      values: [email]
    })
    
    if(data.rowCount === 0) return {success: false, email, password, errors: {email: ["This email address doesn't exist"]}}
    const salt = data.rows[0].password_salt as string
    const hashedPassword = data.rows[0].password_hashed as string
    const isValidPassword = await comparePasswords({inputPassword: password, salt: salt, hashedPassword: hashedPassword})
    
    if(!isValidPassword) {
      return {success: false, email, password, errors: { password: ['Password is incorrect']}}
    }
    
    const userId = data.rows[0].id as string
    const name = data.rows[0].name as string
    
    await createUserSession({userId, name, email})
    return {success: true, message: ['Login successful']}
  }
  
  catch(err: any) {
    return {success: false, errors: {submissionError: ['Something went wrong, please try again shortly.']}}
  }
}


export async function logoutAction() {
  try {
    await revokeUserSession()
    return {
      success: true,
      message: ['You have been logged out successfully']
    }
  }

  catch(err) {
    return {
      success: false,
      message: ['Something went wrong, please try again shortly']
    }
  }
}
