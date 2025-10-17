'use client'
import CodeEditor from "@/components/editor";
import Header from "@/components/header";
import { useCurrentUser } from "@/lib/providers/current-user";
import { useEffect, useRef, useState, memo } from "react";
import { Textarea } from "@/components/ui/textarea";
import IOPanel from "@/components/io-panel";

import { useWebSocket } from '@/lib/providers/web-socket'
import Editor, { OnChange } from '@monaco-editor/react'
import { WSClientRequest, WSResponse} from "@repo/shared/types"
import { Button } from "@/components/ui/button";


export default function Home() {

  const [code, setCode] = useState<string>('')
  const [input, setInput] = useState<string>('')
  const [executionResult, setExecutionResult] = useState<{username: string, stdin: string, stdout: string} | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)


  return (
    <div>
      <Header roomId={roomId} setRoomId={setRoomId} ></Header>
      <div className="flex">
        <div className=" flex-1 border-rose-500">
          <CodeEditor code={code} setCode={setCode}></CodeEditor>
        </div>
        <div className="flex-1 h-[90vh]">
          <IOPanel 
            code={code}
            input={input}
            executionResult={executionResult}
            roomId={roomId}
            setInput={setInput}
            setExecutionResult={setExecutionResult}
          ></IOPanel>
        </div>
      </div>
    </div>
  );
}
