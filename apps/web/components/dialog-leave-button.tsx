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
import { toast } from 'sonner'
import { WSClientRequest } from '@repo/shared/types'
import { UserSession } from '@/lib/auth/types'

type User = UserSession | null

export function DialogLeaveButton({user, ws, roomId}: {user: User, ws: WebSocketExt | null, roomId: string}) {


  const handleLeave = () => {
    if(!user) {
      toast.error('You must either Signup or Login to Join room', {position: 'top-center'})
      return
    }

    if(!ws) {
      toast.error('Something went wrong, Please try again later', {position: 'top-center'})
      return 
    }

    const requestPayload: WSClientRequest = {
      type: 'leave',
      payload: {
        roomId: roomId.trim()
      }
    }
    ws.send(JSON.stringify(requestPayload))

  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Leave</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
        </DialogHeader>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="destructive">
              Close
            </Button>
          </DialogClose>
          <Button onClick={handleLeave} type='button' variant={'outline'}>Leave room</Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export default DialogLeaveButton