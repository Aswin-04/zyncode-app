import bcrypt from 'bcrypt'

export const hashPassword = async (userPassword: string) =>  {
  try {
    const hash = await bcrypt.hash(userPassword, 10)
    return hash
  }

  catch(err) {
    throw new Error("Error while hashing password")
  }
}

export const comparePassword = async (userPassword: string, hashedPassword: string) => {
  try {
    const isPasswordValid = await bcrypt.compare(userPassword, hashedPassword)
    return isPasswordValid
  }

  catch(err) {
    throw new Error("Error while comparing password", {cause: err})
  }
}



