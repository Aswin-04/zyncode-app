"use client";

import React, { useActionState, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useCurrentUser } from "@/lib/providers/current-user";
import Link from "next/link";
import { useWebSocket } from "@/lib/providers/web-socket";
import { WSResponse } from "@repo/shared/types";
import { toast } from "sonner";
import DialogJoinButton from "./dialog-join-button";
import DialogCreateButton from "./dialog-create-button";
import { logoutAction } from "@/lib/auth/actions";
import DialogLeaveButton from "./dialog-leave-button";

  
const isBinary = (message: any) => {
  return typeof message === 'object' && Object.prototype.toString.call(message) === '[object Blob]' && message instanceof Blob
}

const Header = () => {
    const user = useCurrentUser();
    const { ws } = useWebSocket()
    const [roomId, setRoomId] = useState<string | null>(null)

    const [state, action] = useActionState(logoutAction, undefined)

    useEffect(() => {
      if(state?.success || state?.success == false) {
        window.location.href = '/'
      }

    }, [state?.success])

    useEffect(() => {
      if(!ws) {
        console.warn('WebSocket not connected');
        return
      }

      const handleMessage = (event: MessageEvent) => {
        if(isBinary(event.data)) return 
        const response: WSResponse = JSON.parse(event.data)
        if(!response.success) {
          console.log('failed to create room');
          return;
        }
        switch(response.eventType) {
          case 'room:create': 
            const roomId = response.data.roomId as string 
            setRoomId(roomId)
            toast.success(response.data.message, {position: 'top-center'})
            break;

          case 'room:join':
            setRoomId(response.data.roomId)
            toast.success(response.data.message, {position: 'top-center'})
            break;

          case 'room:leave':
            setRoomId(null)
            toast.success(response.data.message, {position: 'top-center'})
            break;
          
          default:
            return;
        }
      }
      ws?.addEventListener('message', handleMessage)

      return () => {
        if(ws) ws.removeEventListener('message', handleMessage)
      }
    }, [ws])

    return (
      <div className=" border-b-1">
        <div className="max-w-[1440px] mx-auto flex justify-between py-4 px-10">
          <div className="text-2xl font-semibold">Zyncode</div>
          <div className="flex gap-8">
            {!roomId && <div className="flex gap-4">
              <DialogCreateButton user={user} ws={ws} ></DialogCreateButton>
              <DialogJoinButton user={user} ws={ws}></DialogJoinButton>
            </div>}
            {roomId && <div className="flex gap-4">
              <div className="text-lg font-medium text-blue-500 mr-10">Room id: {roomId}</div>
              <DialogLeaveButton user={user} ws= {ws} roomId={roomId} ></DialogLeaveButton>
            </div>}
            {!user && (
              <div className="flex gap-4 border-1">
                <Link href={"signup"}>
                  <Button variant={"outline"}>Signup</Button>
                </Link>
                <Link href={"login"}>
                  <Button>Login</Button>
                </Link>
              </div>
            )}
            {user && (
              <form action={action}>
                <Button type={"submit"} variant={"destructive"}>
                  Logout
                </Button>
              </form>
            )}
            {user && 
              <div className="flex justify-center items-center  gap-4">
                <div className="flex justify-center items-center text-xl  w-10 h-10 rounded-full border-1 bg-blue-600">{user?.name[0]}</div>
                <p className="text-lg font-semibold">{user?.name}</p>
              </div>

            }
          </div>
        </div>
      </div>
    );
  };

  export default Header;
