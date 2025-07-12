import crypto from 'crypto'
import {getRedisClient} from '@repo/redis'
import { cookies } from 'next/headers'

const COOKIE_SESSION_KEY = 'sessionToken'
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7

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
    await redis.set(`session:${sessionToken}`, JSON.stringify({userId, name, email}), {'expiration': {type: 'EX', 'value': SESSION_EXPIRATION_SECONDS}})
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_SESSION_KEY, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000 // in ms
    })
  }

  catch(err) {
    throw err 
  }
}

export async function removeUserSession() {

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

export async function getUserSession() {

  try {
    const cookieStore = await cookies()
    const redis = await getRedisClient()
    const sessionToken = cookieStore.get(COOKIE_SESSION_KEY)?.value
    const data = await redis.get(`session:${sessionToken}`)
    if(!data) return null
    return JSON.parse(data)
  }
  
  catch(err) {
    console.error('from getUserSession', err)
    throw err 
  }
} 
