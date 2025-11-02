"use client";
import { createContext, use, useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "./current-user-provider";
import { WSResponse } from "@repo/shared/types";
import { toast } from "sonner";
import { useEditor } from "./editor-provider";
import { useExecutionResult } from "./execution-result-provider";
import { useRoomId } from "./roomId-provider";

const HEARTBEAT_INTERVAL = 9 * 1000;

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

  useEffect(() => {
    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && !WEBSOCKET_URL)
      throw new Error("Failed to load env secretes");

    if (!user) return;
    const ws = new WebSocket(
      `${isProd ? WEBSOCKET_URL : "ws://localhost:8080"}`
    ) as WebSocketExt;
    if (!ws) {
      throw new Error("unable to connect to wss");
    }

    setWs(ws);

    ws.onopen = () => {
      heartbeat(ws);
      console.log("connected to wss");
    };

    ws.onclose = () => {
      console.log("ws connection closed");
    };

    ws.onerror = (err) => {
      console.log("Websocket err: ", err);
    };

    ws.onmessage = (event:MessageEvent<unknown>) => {
      if (isBinary(event.data)) {
        heartbeat(ws);
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
          if(response.success) toast.success(response.data.message)
          break 


        case 'execution:result':
          if(response.success) {
            setExecutionResult(response.data.executionResult)
            break
          }
      }
    };

    return () => {
      ws.close();
      setWs(null);
    };
  }, [user]);

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