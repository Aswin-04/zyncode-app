import express, { Router } from 'express'
import SignupRouter from './signup'

const router:Router  = express.Router()

router.use('/signup', SignupRouter)

export default router