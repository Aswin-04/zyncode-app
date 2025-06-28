import 'dotenv/config'
import * as db from '@repo/db'
import { signJwt } from '@repo/auth'
import { signUpSchema } from '@repo/zod/schemas'
import express, { Router } from 'express'

const router:Router = express.Router()

router.post('/', (req, res) => {
  const payload = req.body

})

export default router