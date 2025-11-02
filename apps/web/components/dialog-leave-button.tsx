import React from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { WSClientRequest } from '@repo/shared/types'
import { useCurrentUser } from '@/lib/providers/current-user-provider'
import { useWebSocket } from '@/lib/providers/web-socket-provider'
import { useRoomId } from '@/lib/providers/roomId-provider'


export function DialogLeaveButton() {

  const user = useCurrentUser()
  const {ws} = useWebSocket()
  const { roomId } = useRoomId()

  const handleLeave = () => {
    if(!user) {
      toast.error('You must either Signup or Login to Join room')
      return
    }

    if(!ws) {
      toast.error('Something went wrong, Please try again later')
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