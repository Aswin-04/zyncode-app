"use client";
import React from "react";
import RoomIdProvider from "./roomId-provider";
import EditorProvider from "./editor-provider";
import InputProvider from "./input-provider";
import ExectuionResultProvider from "./execution-result-provider";

const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <RoomIdProvider>
      <EditorProvider>
        <InputProvider>
          <ExectuionResultProvider>{children}</ExectuionResultProvider>
        </InputProvider>
      </EditorProvider>
    </RoomIdProvider>
  );
};

export default WorkspaceProvider;
