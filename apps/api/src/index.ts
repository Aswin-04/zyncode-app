import "dotenv/config"
import express from "express";
import AuthRouter from './routes/auth'

const PORT = process.env.PORT || 3001

const app = express()

app.get('/', (req, res) => {
  res.send("Hello, from server")
})

app.use(express.json())
app.use('/api/v1/auth', AuthRouter)

app.listen(PORT, () => {
  console.log(`Listening on port (${PORT})`)
})
