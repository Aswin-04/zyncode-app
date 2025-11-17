import { Job, Worker } from "bullmq";
import Redis from 'ioredis'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from "node:child_process";
import 'dotenv/config'

interface JobPayload {
  jobId: string,
  roomId: string | null,
  userId: string,
  username: string, 
  language: "js" | "cpp" | "c" | "java" | "py"
  code: string,
  stdin: string
}

const executeCode = (jobPayload: JobPayload): Promise<{userId: string, username: string, roomId: string | null, stdin: string, stdout: string, stderr:string, verdict: string}> =>  {
  return new Promise((resolve, reject) => {
    const {jobId, userId, username, roomId, language, code, stdin} = jobPayload
    console.log(jobPayload)
  
    const containerJobDir = path.join(process.cwd(), 'tmp', 'jobs', jobId)
    const hostTmpDir = process.env.HOST_TMP_PATH
    if(!hostTmpDir) {
      return reject(new Error(`FATAL: HOST_TMP_PATH is not set.`))
    }
    const hostJobDir = path.join(hostTmpDir, 'jobs', jobId)
    fs.mkdirSync(containerJobDir, {recursive: true})
    fs.writeFileSync(`${containerJobDir}/input.txt`, stdin)
    fs.writeFileSync(`${containerJobDir}/output.txt`, "")
    fs.writeFileSync(`${containerJobDir}/error.txt`, "")
  
    switch(language) {
      case 'c':
        fs.writeFileSync(`${containerJobDir}/main.c`, code)
        break;
  
      case 'cpp':
        fs.writeFileSync(`${containerJobDir}/main.cpp`, code)
        break;
  
      case 'py':
        fs.writeFileSync(`${containerJobDir}/main.py`, code)
        break;
  
      case 'java':
        fs.writeFileSync(`${containerJobDir}/Main.java`, code)
        break;
  
      case 'js':
        fs.writeFileSync(`${containerJobDir}/main.js`, code)
        break; 
    }
  
    const jobContainer = spawn("docker", [
      "run", 
      "--rm", 
      "-v", `${hostJobDir}:/app`, 
      "--read-only",
      "--memory=512m",
      "--memory-swap=512m",
      "--tmpfs", "/tmp:rw,size=64m",
      "--pids-limit=64",
      "--ulimit", "cpu=6",
      "--network", "none",
      `zyncode-${language}-runner`
    ])
    jobContainer.on('close', (code, signal) => {

      try {
        const stdout = fs.readFileSync(`${containerJobDir}/output.txt`, 'utf-8') 
        const stderr =  fs.readFileSync(`${containerJobDir}/error.txt`, 'utf-8')
        let verdict = 'Unknown Error'
        if(signal) {
          if(signal == 'SIGKILL') verdict = 'Memory Limit Exceeded'
          else if(signal == 'SIGXCPU') verdict = 'Time Limit Exceeded'
          else verdict = `Killed ${signal}`
        }
        
        else if(code !== null) {
          if(code == 0) verdict = 'Success'
          else if(code == 124) verdict = 'Time Limit Exceeded'
          else if(code == 137) verdict = 'Memory Limit Exceeded' 
          else verdict = 'Compile/Runtime Error'
        }
        console.log(`return-code: ${code}, signal: ${signal}, verdict: ${verdict}`)
        resolve({userId, username, roomId, stdin, stdout, stderr, verdict})
      } 
      
      finally {
        fs.rmSync(containerJobDir, {recursive: true, force: true})
      }
    })
  
    jobContainer.on('error', (err) => {
      console.log('Failed to start code execution', err)
      reject(new Error('Container error', err))
    }) 
  
  })
}

const startWorker = async () => {
  const redisUrl = process.env.REDIS_URL || ""
  if(!redisUrl) throw new Error("Failed to update env")
  const redis = new Redis(redisUrl, {tls: redisUrl.startsWith('rediss://') ? {} : undefined, maxRetriesPerRequest: null})
  const worker = new Worker('jobQueue', async (job: Job) => {
    const {userId, username, roomId, stdin, stdout, stderr, verdict} = await executeCode(job.data)

    const channel = roomId ? `room:${roomId}` : `user:${userId}`
    await redis.publish(`${channel}`, JSON.stringify({username, stdin, stdout, stderr, verdict}))
  }, {connection: redis, removeOnComplete: {age: 0}, removeOnFail: {age: 0}})

  worker.on('failed', (err) => {
    console.log(`Error: ${err?.failedReason}\n`)
  })
}

startWorker()
