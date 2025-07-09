import 'dotenv/config'
import jwt from 'jsonwebtoken'

const verifyJwt = (token: string) : jwt.JwtPayload | string => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string);
  } 

  catch(err) {
    throw new Error("Invalid or expired token")
  }
}

export default verifyJwt