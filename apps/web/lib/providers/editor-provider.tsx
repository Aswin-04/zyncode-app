'use client'
import React, { createContext, use, useEffect, useRef, useState } from 'react'
import { SupportedLanguage } from '@repo/shared/types'


interface EditorState {
  code: string,
  language: SupportedLanguage
  setCode: React.Dispatch<React.SetStateAction<string>>
  setLanguage: React.Dispatch<React.SetStateAction<SupportedLanguage>>
  codeRef: React.RefObject<string>
  languageRef: React.RefObject<SupportedLanguage>
}

const EditorContext = createContext<EditorState | undefined>(undefined)

const EditorProvider = ({children}: {children: React.ReactNode}) => {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<SupportedLanguage>('JavaScript')
  const codeRef = useRef(code)
  const languageRef = useRef(language)

  useEffect(() => {
    codeRef.current = code 
    languageRef.current = language 
  }, [code, language])

  return (
    <EditorContext value={{code, setCode, language, setLanguage, codeRef, languageRef}} >{children}</EditorContext>
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