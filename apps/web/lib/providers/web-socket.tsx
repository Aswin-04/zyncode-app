'use client'

import { createContext, use, useEffect, useRef, useState } from "react";
import { useCurrentUser } from "./current-user";

const HEARTBEAT_INTERVAL = 9 * 1000

const isBinary = (message: any) => {
  return typeof message === 'object' && Object.prototype.toString.call(message) === '[object Blob]' && message instanceof Blob
}

const heartbeat = (ws: WebSocketExt) => {
  clearTimeout(ws.pingTimeout)

  ws.pingTimeout = setTimeout(() => {
    const data = new Uint8Array(1)
    data[0] = 1
    ws.send(data)
  }, HEARTBEAT_INTERVAL);
}

const WebSocketContext = createContext<{ws: WebSocketExt | null} | undefined>(undefined)

export const WebSocketProvider = ({children}: {children: React.ReactNode} )  => {

  const user = useCurrentUser()

  const [ws, setWs] = useState<WebSocketExt | null>(null)
    
    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    if(!WEBSOCKET_URL) throw new Error('Failed to load env secretes')
    
    useEffect(() => {
      if(!user) return
      const ws = new WebSocket(WEBSOCKET_URL) as WebSocketExt
      if(!ws) {
        throw new Error('unable to connect to wss')
      }

      setWs(ws)

      ws.onopen = () => {
        heartbeat(ws)    
        console.log('connected to wss')
      }

      ws.onclose = () => {
        console.log('ws connection closed')
      }

      ws.onerror = (err) => {
        console.log('Websocket err: ', err)
      }

      ws.onmessage = (event) => {
        const message = event.data
        if(isBinary(message)) {
          heartbeat(ws)
        }
      }

      return () => {
        ws.close()
        setWs(null)
      }

    }, [user])

  return <WebSocketContext value={{ws}}>{children}</WebSocketContext>
}

export const useWebSocket = () => {
  const ws = use(WebSocketContext)

  if(ws === undefined) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return ws
}