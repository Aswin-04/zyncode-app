import 'dotenv/config'
import * as db from '@repo/db'
import { signJwt } from '@repo/auth'
import { loginSchema } from '@repo/zod/schemas'
import express, { Router } from 'express'
import { comparePassword} from '@repo/auth/password'

const router:Router = express.Router()

router.post('/',async (req, res) => {
  const payload = req.body
  const result = loginSchema.safeParse(payload)
  if(!result.success) {
    res.status(401).json({message: "invalid credentials"})
    return
  }
  const {email, password} = result.data
  const query1 = {
    text: 'SELECT id, name, email_address, password_hashed FROM users WHERE email_address=$1 LIMIT 1;',
    values: [email]
  }

  try {
    const select = await db.query(query1)
    if(select.rowCount == 0) {
      res.status(401).json({message: "invalid credentials"})
      return
    }
    const hashedPassword = select.rows[0].password_hashed
    const isPasswordValid = await comparePassword(password, hashedPassword)
    if(!isPasswordValid) {
      res.status(401).json({message: "invalid credentials"})
      return
    }
    
    const id = select.rows[0].id
    const name = select.rows[0].name
    const token = signJwt({id, name, email}, {expiresIn: "7d"})
  
    res.status(200).json({message: "logged in successfully", token})
  }

  catch(err) {
    console.log(err)
    res.status(500).json({message: "internal server error"})
  }
})

export default router