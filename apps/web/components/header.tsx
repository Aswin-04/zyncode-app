"use client";

import React, { useActionState, useEffect, useState, memo } from "react";
import { Button } from "./ui/button";
import { useCurrentUser } from "@/lib/providers/current-user-provider";
import Link from "next/link";
import { useWebSocket } from "@/lib/providers/web-socket-provider";
import DialogJoinButton from "./dialog-join-button";
import DialogCreateButton from "./dialog-create-button";
import { logoutAction } from "@/lib/auth/actions";
import { useRoomId } from "@/lib/providers/roomId-provider";
import UserProfile from "./user-profile";
import { cn } from "@/lib/utils";
import RoomIdDisplay from "./room-id-display";
import { Users } from 'lucide-react';

interface HeaderProps {
  isPanelOpen: boolean,
  setIsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const Header = ({isPanelOpen, setIsPanelOpen}: HeaderProps) => {
  const currentUser = useCurrentUser();
  const { ws } = useWebSocket();
  const { roomId, setRoomId } = useRoomId();

  const [state, action] = useActionState(logoutAction, undefined);

  useEffect(() => {
    if (state?.success == true || state?.success == false) {
      window.location.href = "/";
    }
  }, [state?.success]);


  return (
    
    <div className="bg-background  px-8 lg:px-24 py-4">
      <div className="mx-auto flex justify-between">
        <div className="font-montserrat text-3xl font-bold my-auto">
          zyn<span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-800 via-primary to-blue-800" >code</span>
        </div>
        {roomId 
          ? <div className="max-md:hidden">
              <RoomIdDisplay roomId={roomId}></RoomIdDisplay> 
            </div>
          : <div className="space-x-4 my-auto max-md:hidden" >
              <DialogCreateButton></DialogCreateButton>
              <DialogJoinButton></DialogJoinButton>
            </div>
          }
        <div className="space-x-4 flex justify-center items-center">
          <div className={cn(
            "space-x-4 max-md:hidden",
            currentUser && 'md:hidden'
          )}>
            <Link href={'/signup'}>
              <Button>Signup</Button>
            </Link>
            <Link href={'/login'}>
              <Button variant={'outline'}>login</Button>
            </Link>
          </div>
          {roomId &&
            <button 
              className={cn("border p-2 rounded-full cursor-pointer", isPanelOpen ? 'bg-secondary-foreground' : '' )}
              onClick={() => setIsPanelOpen(prev => !prev)} >
              <Users className={cn(isPanelOpen ? 'text-secondary' : '')} strokeWidth="2.5"  />
            </button>
          }
          <UserProfile/>
        </div>
      </div>
    </div>
  );
};

export default memo(Header);
