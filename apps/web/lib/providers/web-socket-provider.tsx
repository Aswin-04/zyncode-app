"use client";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "./current-user-provider";
import { WSResponse } from "@repo/shared/types";
import { toast } from "sonner";
import { useEditor } from "./editor-provider";
import { useExecutionResult } from "./execution-result-provider";
import { useRoomId } from "./roomId-provider";

const HEARTBEAT_INTERVAL = 9 * 1000;
const MAX_RECONNECT_ATTEMPTS = 10
const BASE_DELAY = 500 // ms
const MAX_DELAY = 30000 // ms

const isBinary = (message: any) => {
  return (
    typeof message === "object" &&
    Object.prototype.toString.call(message) === "[object Blob]" &&
    message instanceof Blob
  );
};

const heartbeat = (ws: WebSocketExt) => {
  clearTimeout(ws.pingTimeout);

  ws.pingTimeout = setTimeout(() => {
    const data = new Uint8Array(1);
    data[0] = 1;
    ws.send(data);
  }, HEARTBEAT_INTERVAL);
};

const WebSocketContext = createContext<{ ws: WebSocketExt | null } | undefined>(undefined)

const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {

  const user = useCurrentUser();
  const {setCode, setLanguage} = useEditor()
  const {setExecutionResult} = useExecutionResult()
  const {setRoomId} = useRoomId()
  const [ws, setWs] = useState<WebSocketExt | null>(null);

  const attemptRef = useRef(0)
  const connectRef = useRef<() => void>(() => {})
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  const getBackoffDealy = (attempt: number) => {
    const jitter = Math.random() * 1000 
    const exponentialDelay = BASE_DELAY * 2 ** attempt
    return Math.min(MAX_DELAY, exponentialDelay + jitter)
  }

  const scheduleReconnect = useCallback( () => {
    if(attemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached.')
      toast.error('Failed to connect to server. Please refresh the page.', {
        position: 'bottom-right',
        duration: Infinity
      })
      return
    }

    const delay = getBackoffDealy(attemptRef.current)
    console.log(`Reconnecting in ${Math.round(delay)}ms attempt (${attemptRef.current+1})`)

    reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current)
    reconnectTimerRef.current = setTimeout(() => {
      attemptRef.current++;
      connectRef.current()
    }, delay)
  }, [])

  const connect = useCallback( () => {

    if (!user) return;

    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && !WEBSOCKET_URL)
      throw new Error("Failed to load env secretes");

    const socket = new WebSocket(
      `${isProd ? WEBSOCKET_URL : "ws://localhost:8080"}`
    ) as WebSocketExt;
    if (!socket) {
      throw new Error("unable to connect to wss");
    }

    setWs(socket);

    socket.onopen = () => {
      console.log("connected to Websocket server");
      attemptRef.current = 0
      heartbeat(socket);
    };

    socket.onclose = (event: CloseEvent) => {
      console.warn("ws connection closed");
      if(event.code === 1000) return
      scheduleReconnect()
    };

    socket.onerror = (err) => {
      console.log("Websocket err: ", err);
      socket.close()
    };

    socket.onmessage = (event:MessageEvent<unknown>) => {
      if (isBinary(event.data)) {
        heartbeat(socket);
        return;
      }
      const response:WSResponse = JSON.parse(event.data as string)

      switch(response.eventType) {

        case 'room:create':
        case 'room:join':
          if(!response.success) {
            console.error(response.error.message)
            break;
          }
          const roomId = response.data.roomId 
          setRoomId(roomId);
          setCode(response.data.latestCode)
          toast.success(response.data.message);
          break

        case 'room:leave':
          if(!response.success) {
            toast.error(response.error.message)
            break
          }
          setRoomId('')
          toast.success(response.data.message)
          break

        case 'session:init':
          if(response.success) toast.success(response.data.message)
          break

        
        case 'room:code-update':
          if(!response.success) {
            console.error(response.error.message)
            break 
          }
          setCode(response.data.latestCode)
          break

        case 'room:language-update':
          if(!response.success) {
            toast.error(response.error.message)
            break 
          }
          setLanguage(response.data.language)
          break;

        case 'room:user-join':
        case 'room:user-leave':
          if(response.success) toast.info(response.data.message)
          break 


        case 'execution:result':
          if(response.success) {
            setExecutionResult(response.data.executionResult)
            break
          }
      }
    };
  }, [user, setCode, setLanguage, setExecutionResult, setRoomId, scheduleReconnect])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    connect()

    return () => {
      if(reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      setWs(currentWs => {
        currentWs?.close(1000)
        return null
      })
    }
  }, [connect])

  const value = useMemo(() => ({ws}), [ws])

  return <WebSocketContext value={value}>{children}</WebSocketContext>;
};

export const useWebSocket = () => {
  const ws = use(WebSocketContext)
  if (ws === undefined) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return ws;
};


export default WebSocketProvider