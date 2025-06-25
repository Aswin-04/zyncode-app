import 'dotenv/config'
import jwt from 'jsonwebtoken'

const verifyJwt = (token: string) : jwt.JwtPayload | string => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } 

  catch(err) {
    console.log("JWT verify error", err)
    throw new Error("Failed to verify JWT")
  }
}

export default verifyJwt