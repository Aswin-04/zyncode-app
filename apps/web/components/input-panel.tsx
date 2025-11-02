'use client';

import React from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useCurrentUser } from "@/lib/providers/current-user-provider";
import { useEditor } from "@/lib/providers/editor-provider";
import { useInput } from "@/lib/providers/input-provider";
import { useRoomId } from "@/lib/providers/roomId-provider";
import { toast } from "sonner";
import { workerLanguage } from "@/constants/constants";


const InputPanel = () => {

  const { input, setInput } = useInput();

  return (
    <div className="bg-background flex flex-col gap-2 h-60 md:h-1/2 border pt-2 rounded-xl">
      <div className="flex items-center justify-between px-4">
        <h3 className="font-semibold">Input</h3>
        <RunButton></RunButton>
      </div>
      <Textarea
        className="
          text-secondary-foreground flex-1 resize-none border-none  p-4 font-mono outline-none  focus-visible:ring-0
          scrollbar-thin 
          scrollbar-thumb-primary/50 
          scrollbar-track-transparent 
          scrollbar-thumb-rounded-md'
        "
        placeholder="Enter your input here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
};

const RunButton = () => {

  const user = useCurrentUser();
  const { codeRef, languageRef } = useEditor();
  const { roomId } = useRoomId();
  const { input } = useInput();

  const executeCode = async () => {
    if (!user) {
      toast.error("User should login/signup to execute the code.", {position: "top-center"})
      return;
    }
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          username: user.name,
          roomId: roomId,
          language: workerLanguage[languageRef.current], 
          code: codeRef.current,
          stdin: input,
        }),
      });
    } catch (err) {
      console.error("Failed to execute code:", err);
    }
  };

  return (
    <Button onClick={executeCode} variant={'primary'} >Run</Button>
  )
}

export default InputPanel;