import { createClient, RedisClientType } from "redis";
import "dotenv/config"

let redisClient: RedisClientType | null = null

export async function getRedisClient() {

  if(redisClient && redisClient.isOpen) {
    return redisClient
  }

  redisClient = createClient({
    url: process.env.REDIS_URL || "" ,   
    
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



  
