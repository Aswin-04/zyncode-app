'use client'
import React, { createContext, use, useState } from 'react'

type CodeState =  {
  code: string,
  setCode: (latestCode: string) => void
}

const CodeContext = createContext<CodeState | undefined>(undefined)

const CodeProvider = ({children}: {children: React.ReactNode}) => {
  const [code, setCode] = useState('')
  return (
    <CodeContext value={{code, setCode}} >{children}</CodeContext>
  )
}

export const useCode = () => {
  const context = use(CodeContext)
  if(context === undefined) {
    throw new Error('useCode must be used within a CodeProvider');
  }
  return context
}

export default CodeProvider