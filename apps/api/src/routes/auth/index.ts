import express, { Router } from 'express'
import SignupRouter from './signup'
import LoginRouter from './login'

const router:Router  = express.Router()

router.use('/signup', SignupRouter)
router.use('/login', LoginRouter)

export default router