"use client";
import React from "react";
import RoomIdProvider from "./roomId-provider";
import EditorProvider from "./editor-provider";
import InputProvider from "./input-provider";
import ExecutionResultProvider from "./execution-result-provider";
import WebSocketProvider from "./web-socket-provider";

const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <RoomIdProvider>
      <EditorProvider>
        <InputProvider>
          <ExecutionResultProvider>
            <WebSocketProvider>
              {children}
            </WebSocketProvider>
          </ExecutionResultProvider>
        </InputProvider>
      </EditorProvider>
    </RoomIdProvider>
  );
};

export default WorkspaceProvider;
