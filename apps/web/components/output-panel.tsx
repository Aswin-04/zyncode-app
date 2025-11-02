'use client';

import React from "react";
import { useWebSocket } from "@/lib/providers/web-socket-provider";
import { useExecutionResult } from "@/lib/providers/execution-result-provider";

interface ExecutionResultData {
  username: string;
  stdin: string;
  stdout: string;
  stderr: string;
}

const OutputPanel = () => {
  const { ws } = useWebSocket();
  const { executionResult } = useExecutionResult();

  return (
    <div className=" bg-background flex flex-col h-60 md:h-1/2 border rounded-xl ">
       <div className="p-4">
        <h3 className="font-semibold">Output</h3>
      </div>
      <div className="
        flex-1 p-4 bg-[#0b0d18] text-gray-200 overflow-y-auto font-mono font-medium text-sm
        scrollbar-thin 
        scrollbar-thumb-primary/50 
        scrollbar-track-transparent 
        scrollbar-thumb-rounded-md
      ">
        {executionResult ? (
          <OutputDisplay {...executionResult} />
        ) : (
          <span className="text-gray-500 ">Execution output will appear here...</span>
        )}
      </div>
    </div>
  );
};

const OutputDisplay = ({ username, stdin, stdout, stderr }: ExecutionResultData) => {
  return (
    <div className="space-y-4 text-primary">
      <div className="">
        Executed by: <span className="font-semibold text-secondary-foreground truncate">{username}</span>
      </div>

      {stdin && (
        <div>
          <div className="font-medium mb-1">Input:</div>
          <pre className="text-base bg-[#10121e] text-secondary-foreground p-2 rounded whitespace-pre-wrap">{stdin}</pre>
        </div>
      )}

      {stdout && (
      <div>
        <div className="font-medium mb-1">Output:</div>
        <pre className="text-base bg-[#10121e] text-secondary-foreground p-2 rounded  whitespace-pre-wrap">{stdout}</pre>
      </div>
      )}
      {stderr && (
      <div>
        <div className="font-medium mb-1">Output:</div>
        <pre className="text-base bg-[#10121e] text-secondary-foreground p-2 rounded  whitespace-pre-wrap">{stderr}</pre>
      </div>
      )}
    </div>
  );
};

export default OutputPanel;
