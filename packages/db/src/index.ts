import 'dotenv/config'
import {Pool, QueryConfig} from 'pg'

if(!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in the environment");
}

const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}})

export const query = (config: QueryConfig) => {
  return pool.query(config)
}
