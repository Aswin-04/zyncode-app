import React, { useEffect, useRef } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useState } from "react";
import { useWebSocket } from "@/lib/providers/web-socket-provider";
import { WSResponse } from "@repo/shared/types";
import { useCurrentUser } from "@/lib/providers/current-user-provider";
import { useCode } from "@/lib/providers/code-provider";
import { useInput } from "@/lib/providers/input-provider";
import { useExecutionResult } from "@/lib/providers/execution-result-provider";
import { useRoomId } from "@/lib/providers/roomId-provider";

interface ExecutionResult {
  username: string;
  stdin: string;
  stdout: string;
}

const isBinary = (message: unknown): message is Blob => {
  return (
    typeof message === "object" &&
    Object.prototype.toString.call(message) === "[object Blob]" &&
    message instanceof Blob
  );
};

const IOPanel = () => {
  const user = useCurrentUser();
  const { ws } = useWebSocket();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { code } = useCode();
  const { roomId } = useRoomId();
  const { input, setInput } = useInput();
  const { executionResult, setExecutionResult } = useExecutionResult();

  const executeCode = async () => {
    if (!user) {
      console.error("User should login/signup to execute the code.");
      return;
    }
    try {
      console.log(code);
      const response = await fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify({
          userId: user.userId,
          username: user.name,
          roomId: roomId,
          language: "cpp",
          code,
          stdin: input,
        }),
      });
    } catch (err) {
      console.error("Failed to execute code");
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (isBinary(event.data)) return;
      const message: WSResponse = JSON.parse(event.data as string);
      if (!message.success) {
        console.log(message.error.message);
        return;
      }

      if (message.eventType === "execution:result") {
        console.log(message.data);
        const { username, stdin, stdout }: ExecutionResult = message.data;
        setExecutionResult({ username, stdin, stdout });
      }
    };

    ws?.addEventListener("message", handleMessage);

    return () => {
      if (ws) ws.removeEventListener("message", handleMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [ws]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2">
        <Button onClick={executeCode}>Run</Button>
      </div>
      {/* Input + Output split equally */}
      <div className="flex-1 flex flex-col">
        <Textarea
          className="flex-1 resize-none"
          placeholder="Program input..."
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="p-10 bg-input/30 text-gray-50 flex-1 border">
          {executionResult ? (
            <OutputDisplay {...executionResult}></OutputDisplay>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
};

const OutputDisplay = ({
  username,
  stdin,
  stdout,
}: {
  username: string;
  stdin: string;
  stdout: string;
}) => {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Executed by: <span className="font-medium text-white">{username}</span>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Input:</div>
        <pre className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
          {stdin}
        </pre>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Output:</div>
        <pre className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
          {stdout}
        </pre>
      </div>
    </div>
  );
};

export default IOPanel;
