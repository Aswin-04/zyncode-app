'use client'
import React, { createContext, use, useState } from 'react'

type InputState = {
  input: string, 
  setInput: React.Dispatch<React.SetStateAction<string>>
}

const InputContext = createContext<InputState | undefined>(undefined)

const InputProvider = ({children}: {children: React.ReactNode}) => {
  const [input, setInput] = useState('') 
  return (
    <InputContext value={{input, setInput}} >{children}</InputContext>
  )
}

export const useInput = () => {
  const context = use(InputContext)
  if(context === undefined) {
    throw new Error(`useInput must be used within a InputProvider`)
  }
  return context
}

export default InputProvider