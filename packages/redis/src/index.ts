import Redis from "ioredis";
import "dotenv/config";

let redisClient: Redis | null = null;

export async function getRedisClient(): Promise<Redis> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not defined in env");
  }

  if (redisClient) {
    return redisClient;
  }

  
  redisClient = new Redis(redisUrl, {
    tls: redisUrl.startsWith("rediss://") ? {} : undefined, 
  });

  redisClient.on("connect", () => {
    console.log("redis connected");
  });

  redisClient.on("error", (err) => {
    console.error("redis error", err);
  });

  return redisClient;
}
