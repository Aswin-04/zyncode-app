
import crypto from 'crypto'

export function hashPassword(password: string, salt: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    crypto.scrypt(password.normalize(), salt, 64, (err, derivedKey) => {
      if(err) {
        reject(err)
      }
      resolve(derivedKey.toString('hex').normalize())
    })
  })
}

export async function comparePasswords({
  inputPassword, 
  salt,
  hashedPassword
} : {
  inputPassword: string,
  salt: string,
  hashedPassword: string
}) {
  const inputHashedPassword = await hashPassword(inputPassword, salt)
  return crypto.timingSafeEqual(Buffer.from(hashedPassword), Buffer.from(inputHashedPassword))
}


export function generateSalt() {
  return crypto.randomBytes(16).toString('hex').normalize()
}