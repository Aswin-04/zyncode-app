'use client'
import React, { createContext, use, useState } from 'react'

interface ExecutionResult {
  username: string;
  stdin: string;
  stdout: string;
}

type ExectuionResultState = {
  executionResult: ExecutionResult | null,
  setExecutionResult: React.Dispatch<React.SetStateAction<ExecutionResult | null>>
}

const ExecutionResultContext = createContext<ExectuionResultState | undefined>(undefined)

const ExectuionResultProvider = ({children}: {children: React.ReactNode}) => {
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  return (
    <ExecutionResultContext value={{executionResult, setExecutionResult}} >{children}</ExecutionResultContext>
  )
}

export const useExecutionResult = () => {
  const context = use(ExecutionResultContext)
  if(context === undefined) {
    throw new Error('useExecutionResult must be used within the ExecutionResultProvider')
  }
  return context
}

export default ExectuionResultProvider