import express, { Router } from 'express'
import * as db from '@repo/db'
import { hashPassword } from '@repo/auth/password'
import { signJwt } from '@repo/auth'
import {signUpSchema} from '@repo/zod/schemas'
import { ApiError } from '../../error'


const router:Router = express.Router()

router.post('/', async (req, res, next) => {

  try {  
    const payload = req.body;
    const result = signUpSchema.safeParse(payload)
    if(!result.success) {
      throw result.error
    }

    const {name, email, password} = result.data

    const query1 = {
      text: 'SELECT email_address FROM users WHERE email_address=$1 LIMIT 1;',
      values: [email]
    }

    const select = await db.query(query1)
    if(select.rowCount && select.rowCount > 0) {
      throw new ApiError({
        code: "conflict",
        message: "Email already exists",
        fieldErrors: {
          "email": ["Email already exists"]
        }
      })
    }

    await db.query({text: 'BEGIN;'})

    const passwordHashed = await hashPassword(password)
    const query2 = {
      text: 'INSERT INTO users (name, email_address, password_hashed) VALUES ($1, $2, $3) RETURNING id;',
      values: [name, email, passwordHashed]
    }
    const insert = await db.query(query2);
    const userId = insert.rows[0].id
    const token = signJwt({userId, name, email})
    res.status(201).json({
      message: "user created successfully",
      token
      })
    await db.query({text: 'COMMIT'})
  }

  catch(err) {
    await db.query({text: 'ROLLBACK;'})
    console.log("signup error", err)
    next(err)
  }
})

export default router