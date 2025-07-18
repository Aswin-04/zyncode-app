import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { WSClientRequest } from '@repo/shared/types'

type User = |
  {
    id: string, 
    name: string, 
    email: string
  } | null

export function DialogJoinButton({user, ws}: {user: User, ws: WebSocketExt | null}) {

  const [roomId, setRoomId] = useState<string>('')

  const handleJoin = () => {
    if(!user) {
      toast.error('You must either Signup or Login to Join room', {position: 'top-center'})
      return
    }

    if(!ws) {
      toast.error('Something went wrong, Please try again later', {position: 'top-center'})
      return 
    }

    const requestPayload: WSClientRequest = {
      type: 'join',
      payload: {
        roomId: roomId.trim()
      }
    }
    ws.send(JSON.stringify(requestPayload))

  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Join</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Room</DialogTitle>
          <DialogDescription>
            Enter a valid room id
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Enter room id:
            </Label>
            <Input
              id="link"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="destructive">
              Close
            </Button>
          </DialogClose>
          <Button onClick={handleJoin} type='button' variant={'secondary'}>Join</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export default DialogJoinButton