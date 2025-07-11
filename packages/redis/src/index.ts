import { createClient, RedisClientType } from "redis";
import "dotenv/config"

const redisClient:RedisClientType = createClient({
  url: process.env.REDIS_URL || "" 
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


redisClient.connect()
  .then(() => console.log('Redis connected'))
  .catch((err) => console.log('Failed to connect to redis', err))

export default redisClient 
  
