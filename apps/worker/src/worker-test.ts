import {Job, Worker} from 'bullmq'
import Redis from 'ioredis'
import fs, { existsSync } from 'node:fs'
import {spawn, exec} from 'node:child_process'
import 'dotenv/config'
import path from 'node:path'
import util from 'util'

const TIME_LIMIT_MS = 5 * 1000
const MAX_CONCURRENT_JOBS = 2
const MAX_OUTPUT_SIZE = 100 * 1024
const execPromise = util.promisify(exec)

type Language = "js" | "cpp" | "c" | "java" | "py"

interface JobPayload {
  jobId: string,
  roomId: string | null,
  userId: string,
  username: string, 
  language: Language
  code: string,
  stdin: string
}

interface executionResult {
  userId: string, 
  username: string, 
  roomId: string | null, 
  stdin: string, 
  stdout: string, 
  stderr:string, 
  verdict: string
}

interface RunnerConfig {
  tag: string
  dockerfile: string
  filename: string
  runCmd: string
}

const RUNNERS: Record<Language, RunnerConfig> = {
  'py' : {
    tag: 'zyncode-py-runner',
    dockerfile: 'docker/py.Dockerfile',
    filename: 'main.py',
    runCmd: 'python3 -u main.py < input.txt'
  },

  'js' : {
    tag: 'zyncode-js-runner',
    dockerfile: 'docker/js.Dockerfile',
    filename: 'main.js',
    runCmd: 'node main.js < input.txt'
  },

  'cpp' : {
    tag: 'zyncode-cpp-runner',
    dockerfile: 'docker/cpp.Dockerfile',
    filename: 'main.cpp',
    runCmd: 'g++ -o main main.cpp && ./main < input.txt'
  },

  'c' : {
    tag: 'zyncode-c-runner',
    dockerfile: 'docker/c.Dockerfile',
    filename: 'main.c',
    runCmd: 'gcc -o main main.c && ./main < input.txt'
  },

  'java' : {
    tag: 'zyncode-java-runner',
    dockerfile: 'docker/java.Dockerfile',
    filename: 'Main.java',
    runCmd: 'javac Main.java && java Main < input.txt'
  }
} 

const warmup = async () => {
  console.log('Warming up execution environments...')

  for(const [lang, config] of Object.entries(RUNNERS)) {
    console.log(`Building/Checking ${config.tag}...`)
    await execPromise(
      `docker build -t ${config.tag} -f ${config.dockerfile}`
    )
  }

  console.log(`All runners are ready!`)
}

const executeCode = (jobPayload: JobPayload): Promise<executionResult> => {
  return new Promise((resolve, reject) => {
    
    console.log(jobPayload)
    const {jobId, roomId, userId, username, language, code, stdin} = jobPayload
    const runner = RUNNERS[language]
    
    const jobDir = path.join(process.cwd(), 'tmp', 'jobs', jobId)
    fs.mkdirSync(jobDir, {recursive: true})
    
    
    fs.writeFileSync(path.join(jobDir, runner.filename), code)
    fs.writeFileSync(path.join(jobDir, 'input.txt'), stdin || '')
    const stdoutStream = fs.createWriteStream(path.join(jobDir, 'output.txt'))
    const stderrStream = fs.createWriteStream(path.join(jobDir, 'error.txt'))
    
    console.log(`Running Job ${jobId} (${language})`)
    
    const child = spawn("docker", [
      "run", 
      "--rm",
      "-v", `${jobDir}:/app`, 
      "-w", "/app",
      "--memory=512m",
      "--cpu=0.5",
      "--network=none",
      "--pids-limit=64",
      "--read-only",
      runner.tag,
      "sh", "-c", runner.runCmd
    ])
    
    let outputSize = 0
    let killedBySize = false
    
    child.stdout.on('data', (chunk) => {
      outputSize += chunk.length
      if(outputSize > MAX_OUTPUT_SIZE) {
        killedBySize = true 
        child.kill()
      }
      else {
        stdoutStream.write(chunk)
      }
    })
    
    child.stderr.pipe(stderrStream)
    
    let killedByTimeout = false 
    const timer = setTimeout(() => {
      killedByTimeout = true 
      console.log(`Job ${jobId} Timed Out`)
      child.kill()
    }, TIME_LIMIT_MS)
    
    child.on('close', (code) => {
      clearTimeout(timer)
      stdoutStream.end()
      stderrStream.end()
      
      let verdict = 'Unknown'
      if(killedByTimeout) verdict = 'Time Limit Exceeded'
      else if(killedBySize) verdict = 'Output Limit Exceeded'
      else if(code == 0) verdict = 'Success'
      else verdict = 'Runtime Error'
      
      let stdout = ''
      let stderr = ''
      try {
        stdout = fs.readFileSync(path.join(jobDir, 'output.txt'), 'utf-8')
        stderr = fs.readFileSync(path.join(jobDir, 'error.txt'), 'utf-8')
      } catch (e) {
        console.error('Error reading output files', e)
      }
      
      try { fs.rmSync(jobDir, {recursive: true, force: true}) } catch (e) {}
      console.log(`Job ${jobId} Finished: ${verdict}`)
      resolve({userId, username, stdin, roomId, stdout, stderr, verdict})
      
      child.on('error', (err) => {
        reject(err)
      })
    })
  })  
}

const startWorker = async () => {
  if(!existsSync('./tmp')) {
    fs.mkdirSync('./tmp', {recursive: true})
  }
  await warmup()

  const redisUrl = process.env.REDIS_URL || ""
  if(!redisUrl) throw new Error('Failed to update env')

  const redis = new Redis(redisUrl, {tls: redisUrl.startsWith('rediss://') ? {} : undefined, maxRetriesPerRequest: null})
  const worker = new Worker('jobQueue', async (job) => {
    const {userId, username, stdin, roomId, stdout, stderr, verdict} = await executeCode(job.data)
    const channel = roomId ? `room:${roomId}` : `user:${userId}`
    await redis.publish(channel, JSON.stringify({username, stdin, stdout, stderr, verdict}))
  }, {connection: redis, removeOnComplete: {age: 0}, removeOnFail: {age: 0}, concurrency: MAX_CONCURRENT_JOBS})

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed: `, err)
  })

  console.log('Worker Listening for jobs...')
}

startWorker()