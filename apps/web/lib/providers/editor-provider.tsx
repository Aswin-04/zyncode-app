'use client'
import React, { createContext, use, useState } from 'react'

export type SupportedLanguage = "js" | "cpp" | "c" | "java" | "py";

interface EditorState {
  code: string,
  language: SupportedLanguage
  setCode: React.Dispatch<React.SetStateAction<string>>
  setLanguage: React.Dispatch<React.SetStateAction<SupportedLanguage>>
}

const EditorContext = createContext<EditorState | undefined>(undefined)

const EditorProvider = ({children}: {children: React.ReactNode}) => {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<SupportedLanguage>('js')
  return (
    <EditorContext value={{code, setCode, language, setLanguage}} >{children}</EditorContext>
  )
}

export const useEditor = () => {
  const context = use(EditorContext)
  if(context === undefined) {
    throw new Error('useCode must be used within a EditorProvider');
  }
  return context
}

export default EditorProvider