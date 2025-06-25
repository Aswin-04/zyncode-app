import 'dotenv/config'
import jwt from 'jsonwebtoken'

const signJwt =  (payload: object, options?:jwt.SignOptions): string => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {expiresIn: "7d", ...options})
    return token
  }
  
  catch(err) {
    console.log("JWT sign error", err)
    throw new Error("Failed to sign JWT")
  }
}

export default signJwt