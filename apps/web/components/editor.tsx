"use client"

import { useWebSocket } from '@/lib/providers/web-socket'
import Editor, { OnChange } from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'
import { WSClientRequest, WSResponse} from "@repo/shared/types"

const isBinary = (message: any) => {
  return typeof message === 'object' && Object.prototype.toString.call(message) === '[object Blob]' && message instanceof Blob
}

const CodeEditor = () => {
  const { ws } =  useWebSocket()
  const [code, setCode] = useState<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const onChangeHandler:OnChange = (latestCode: string | undefined) => {
    if(timeoutRef.current) clearTimeout(timeoutRef.current)

    if(latestCode ===undefined || !ws) return

    timeoutRef.current = setTimeout(() => {
      const payload: WSClientRequest = {
        type: 'codeChange',
        payload: {
          code: latestCode || ''
        } 
      }
      ws.send(JSON.stringify(payload))
    }, 100)
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if(isBinary(event.data)) return
      const message: WSResponse<{latestCode: string}>  = JSON.parse(event.data)
      if(!message.success) {
        console.log(message.error.message)
        return
      } 
      
      if(message.eventType === 'room:codeChange') {
        setCode(message.data.latestCode)
      }
    }

    ws?.addEventListener('message', handleMessage)

    return () => {
      if(ws) ws.removeEventListener('message', handleMessage)
      if(timeoutRef.current) clearTimeout(timeoutRef.current)
    }

  }, [ws])


  return (
    <div className='max-w-3xl h-[calc(100vh-70px)] p-10 border-1'>
      <Editor 
        language='javascript' 
        height={'100%'} 
        theme={'vs-dark'}
        options={
          {minimap: {enabled: false}} 
        }
        value={code}
        onChange={onChangeHandler}
      />
    </div>
  )
}

export default CodeEditor