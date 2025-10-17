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
import { UserSession } from '@/lib/auth/types'

type User = UserSession | null

export function DialogCreateButton({user, ws}: {user: User, ws: WebSocketExt | null}) {

  const handleCreate = () => {
    if(!user) {
      toast.error('You must either Signup or Login to Join room', {position: 'top-center'})
      return
    }

    if(!ws) {
      toast.error('Something went wrong, Please try again later', {position: 'top-center'})
      return 
    }

    const requestPayload: WSClientRequest = {
      type: 'create',
    }
    ws.send(JSON.stringify(requestPayload))

  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create</Button>
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
          <Button onClick={handleCreate} type='button' variant={'secondary'}>Create room</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export default DialogCreateButton