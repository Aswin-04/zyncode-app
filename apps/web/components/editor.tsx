"use client";

import { useWebSocket } from "@/lib/providers/web-socket-provider";
import Editor, { OnChange } from "@monaco-editor/react";
import { useEffect, useRef, useState, memo } from "react";
import { WSClientRequest, WSResponse } from "@repo/shared/types";
import { useEditor } from "@/lib/providers/editor-provider";

const isBinary = (message: unknown): message is Blob => {
  return (
    typeof message === "object" &&
    Object.prototype.toString.call(message) === "[object Blob]" &&
    message instanceof Blob
  );
};

const CodeEditor = () => {
  const { ws } = useWebSocket();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { code, setCode, language, setLanguage } = useEditor();
  const onChangeHandler: OnChange = (latestCode: string | undefined) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (latestCode === undefined || !ws) return;

    setCode(latestCode);

    timeoutRef.current = setTimeout(() => {
      const payload: WSClientRequest = {
        type: "codeChange",
        payload: {
          code: latestCode || "",
        },
      };
      ws.send(JSON.stringify(payload));
    }, 100);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (isBinary(event.data)) return;
      const message: WSResponse<{ latestCode: string }> = JSON.parse(
        event.data as string
      );
      if (!message.success) {
        console.log(message.error.message);
        return;
      }

      if (message.eventType === "room:code-update") {
        setCode(message.data.latestCode);
      }
    };

    ws?.addEventListener("message", handleMessage);

    return () => {
      if (ws) ws.removeEventListener("message", handleMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [ws]);
  return (
    <div className="h-[calc(100vh-70px)] p-10 border-1">
      <Editor
        language={language}
        height={"100%"}
        theme={"vs-dark"}
        options={{ minimap: { enabled: false } }}
        value={code}
        onChange={onChangeHandler}
      />
    </div>
  );
};

export default memo(CodeEditor);
