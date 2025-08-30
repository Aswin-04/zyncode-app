import {Queue} from 'bullmq'
import { getRedisClient } from '@repo/redis'
import { NextRequest } from 'next/server'
import crypto from 'crypto'


export async function POST(req: NextRequest) {
  const redis = await getRedisClient()
  const redisQueue = new Queue('jobQueue', {connection: redis})
  const body = await req.json()

  const {roomId, language, code, stdin} = body 
  const jobId = `job-${crypto.randomUUID()}`
  redisQueue.add('', {roomId, jobId, language, code, stdin})
  return new Response(
    JSON.stringify({message: "success",}), {
      status: 200
    }
  )
}
