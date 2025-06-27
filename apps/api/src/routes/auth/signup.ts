import express, { Router } from 'express'
import * as db from '@repo/db'
import { hashPassword } from '@repo/auth/password'
import { signJwt } from '@repo/auth'
import * as z from 'zod/v4'

const UserSchema = z.object({
  name: z.string().min(1).max(50).nonempty(),
  email: z.email().nonempty(),
  password: z.string().nonempty().min(8).max(50)
})

const router:Router = express.Router()

router.post('/', async (req, res) => {

  const payload = req.body;
  const result = UserSchema.safeParse(payload)
  if(!result.success) {
    res.status(403).json({message: "invalid credentials"})
    return 
  }

  const {name, email, password} = result.data

  const query1 = {
    text: 'SELECT email_address FROM users WHERE email_address=$1 LIMIT 1;',
    values: [email]
  }

  const select = await db.query(query1)
  if(select.rowCount && select.rowCount > 0) {
    res.status(400).json({message: "Email already exists, please try logging in"})
    return
  }

  try {  
    await db.query({text: 'BEGIN;'})

    const passwordHashed = await hashPassword(password)
    const query2 = {
      text: 'INSERT INTO users (name, email_address, password_hashed) VALUES ($1, $2, $3) RETURNING id;',
      values: [name, email, passwordHashed]
    }
    const insert = await db.query(query2);
    const userId = insert.rows[0].id
    const token = signJwt({userId, name, email})
    res.status(201).json({message: "user created successfully", token})

    await db.query({text: 'COMMIT'})
  }

  catch(err) {
    await db.query({text: 'ROLLBACK;'})
    console.log("signup error", err)
    res.status(500).json({message: "failed to signup"})
    return
  }
})

export default router