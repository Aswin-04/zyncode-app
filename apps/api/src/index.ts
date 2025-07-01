import "dotenv/config"
import cors from 'cors'
import express from "express";
import AuthRouter from './routes/auth'
import { errorMiddleware } from "./error";

const PORT = process.env.PORT || 3001

const app = express()

app.get('/', (req, res) => {
  res.send("Hello, from server")
})

app.use(cors())
app.use(express.json())
app.use('/api/v1/auth', AuthRouter)
app.use(errorMiddleware)

app.listen(PORT, () => {
  console.log(`Listening on port (${PORT})`)
})
