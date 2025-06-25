import 'dotenv/config'
import {Pool} from 'pg'

if(!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in the environment");
}

const pool = new Pool({connectionString: process.env.DATABASE_URL})

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params)
}
