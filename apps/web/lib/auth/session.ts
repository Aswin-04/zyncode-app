'use server'

import crypto from 'crypto'
import {getRedisClient} from '@repo/redis'
import { cookies } from 'next/headers'
import { UserSession, UserSessionResult } from './types'
import { cache } from 'react'

const COOKIE_SESSION_KEY = process.env.COOKIE_SESSION_KEY ?? "0"
const SESSION_EXPIRATION_SECONDS = parseInt(process.env.SESSION_EXPIRATION_SECONDS || '604800', 10)


export async function createUserSession({
  userId, 
  name, 
  email
}: {
  userId: string,
  name: string,
  email: string
}) {
  const sessionToken = crypto.randomBytes(64).toString("hex").normalize()
  console.log(sessionToken)

    try {
      const redis = await getRedisClient()
        if (!redis.isOpen) {
        throw new Error('Redis client is not connected')
      }
      await redis.set(`session:${sessionToken}`, JSON.stringify({userId, name, email, sessionToken}), {'expiration': {type: 'EX', 'value': SESSION_EXPIRATION_SECONDS}})
      const cookieStore = await cookies()
      cookieStore.set(COOKIE_SESSION_KEY, sessionToken, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        domain: process.env.NODE_ENV === 'production' ? '.aswincodes.in' : undefined,
        expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000 // in ms
      })
    }

  catch(err) {
    throw err 
  }
}

export async function revokeUserSession() {

  try {
    const cookieStore = await cookies()
    const redis = await getRedisClient()
    const sessionToken = cookieStore.get(COOKIE_SESSION_KEY)?.value
    
    await redis.del(`session:${sessionToken}`)
    cookieStore.delete(COOKIE_SESSION_KEY) 
  }

  catch(err) {
    console.error('from removeUserSession', err)
    throw err
  }
}

export const getCurrentUser = cache(async function (): Promise<UserSessionResult> {

  try {
    const cookieStore = await cookies()
    const redis = await getRedisClient()
    const sessionToken = cookieStore.get(COOKIE_SESSION_KEY)?.value
    const data = await redis.get(`session:${sessionToken}`)
    if(!data) return {status: "unauthorized", user: null, }
    const user: UserSession = JSON.parse(data)
    return {status: "authorized", user: user}
  }
  
  catch(err) {
    console.error('from getUserSession', err)
    return {status: "error", user: null}
  }
}) 



