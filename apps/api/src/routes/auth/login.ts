import 'dotenv/config'
import * as db from '@repo/db'
import { signJwt } from '@repo/auth'
import { loginSchema } from '@repo/zod/schemas'
import express, { Router } from 'express'
import { comparePassword} from '@repo/auth/password'
import { ApiError } from '../../error'


const router:Router = express.Router()

router.post('/',async (req, res, next) => {
  const payload = req.body
  const result = loginSchema.safeParse(payload)
  if(!result.success) {
    throw result.error
  }
  const {email, password} = result.data
  const query1 = {
    text: 'SELECT id, name, email_address, password_hashed FROM users WHERE email_address=$1 LIMIT 1;',
    values: [email]
  }
  
  try {
    const select = await db.query(query1)
    if(select.rowCount == 0) {
      throw new ApiError({
        code: "conflict",
        message: "Invalid email address",
        fieldErrors: {
          email: ["email doesn't exists"]
        }
      })
    }

    const hashedPassword = select.rows[0].password_hashed
    const isPasswordValid = await comparePassword(password, hashedPassword)
    if(!isPasswordValid) {
      throw new ApiError({
        code: "bad_request",
        message: "Incorrect password",
        fieldErrors: {
          password: ["Password is incorrect"]
        }
      })
    }
    
    const id = select.rows[0].id
    const name = select.rows[0].name
    const token = signJwt({id, name, email}, {expiresIn: "7d"})
  
    res.status(200).json({message: "logged in successfully", token})
  }

  catch(err) {
    console.log(err)
    next(err)
  }
})

export default router