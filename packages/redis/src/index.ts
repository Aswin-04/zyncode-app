import { Redis } from "ioredis";
import "dotenv/config";

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

async function createRedisClient(): Promise<Redis> {

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not defined in env");
  }

  return new Redis(
    redisUrl,
    {tls: redisUrl.startsWith("rediss://") ? {} : undefined}
  )
}

export async function getRedisClient(): Promise<Redis> {


  if (redisClient) {
    return redisClient;
  }

  redisClient = await createRedisClient()

  redisClient.on("connect", () => {
    console.log("redis connected");
  });

  redisClient.on("error", (err) => {
    console.error("redis error", err);
  });

  return redisClient;
}

export async function getRedisSubscriber(): Promise<Redis> {


  if (redisSubscriber) {
    return redisSubscriber;
  }

  redisSubscriber = await createRedisClient()

  redisSubscriber.on("connect", () => {
    console.log("redis subscriber connected");
  });

  redisSubscriber.on("error", (err) => {
    console.error("redis subscriber error", err);
  });

  return redisSubscriber;
}
