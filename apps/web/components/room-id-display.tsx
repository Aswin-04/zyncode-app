"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"
import { Button } from "./ui/button"


function RoomIdDisplay({ roomId }: { roomId: string }) {

  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setIsCopied(true)
      toast.success('Room ID copied to clipboard!')

      setTimeout(() => {
        setIsCopied(false)  
      }, 2000);
    }

    catch(e) {
      toast.error("Failed to copy Room ID")
    }
  } 

  return (
    <div className="flex justify-center items-center border rounded max-md:w-fit max-md:mx-auto">
      <span className="bg-primary text-black font-semibold p-2 rounded" >Room ID</span>
      <span className="font-semibold p-2" >{roomId}</span>
      <Button
        variant="ghost" 
        size="icon" 
        className="size-7" 
        onClick={handleCopy}
      >
        {isCopied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4" />
        )}
        <span className="sr-only">Copy Room ID</span>
      </Button>
    </div>
  )
}

export default RoomIdDisplay