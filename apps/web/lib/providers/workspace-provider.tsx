"use client";
import React from "react";
import RoomIdProvider from "./roomId-provider";
import CodeProvider from "./code-provider";
import InputProvider from "./input-provider";
import ExectuionResultProvider from "./execution-result-provider";

const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <RoomIdProvider>
      <CodeProvider>
        <InputProvider>
          <ExectuionResultProvider>{children}</ExectuionResultProvider>
        </InputProvider>
      </CodeProvider>
    </RoomIdProvider>
  );
};

export default WorkspaceProvider;
