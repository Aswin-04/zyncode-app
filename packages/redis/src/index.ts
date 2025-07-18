import { createClient, RedisClientType } from "redis";
import "dotenv/config"

let redisClient: RedisClientType | null = null

export async function getRedisClient(): Promise<RedisClientType> {

  const redisUrl = process.env.REDIS_URL

  if(!redisUrl) {
    throw new Error('REDIS_URL is not defined in env')
  }

  if(redisClient && redisClient.isOpen) {
    return redisClient
  }

  redisClient = createClient({
    url: redisUrl  
    
  })
  
  redisClient.on('error', (err) => {
    console.log('redis error', err)
  })
  
  redisClient.on('connect', () => {
    console.log('redis connected')
  })
  
  redisClient.on('reconnecting', () => {
    console.log('redisClient reconnecting')
  })
  
  redisClient.on('end', () => {
    console.log('redis connection closed')
  })
  
  try {
    await redisClient.connect()
  }
  catch(err) {
    console.error('Error connecting to redis', err)
    throw err
  }

  return redisClient
}



  
