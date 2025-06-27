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

export const comparePassword = (userPassword: string, hashedPassword: string) => {
  bcrypt.compare(userPassword, hashedPassword, (err, same) => {
    if(err) {
      throw new Error("Error while comparing password", err)
    }
    return same;
  })
}



