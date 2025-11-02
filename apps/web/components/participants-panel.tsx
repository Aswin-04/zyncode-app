import { useCurrentUser } from '@/lib/providers/current-user-provider'
import { useWebSocket } from '@/lib/providers/web-socket-provider'
import { isBinary } from '@/lib/ws-client/utils'
import { WSResponse } from '@repo/shared/types'
import React, { useEffect, useMemo, useState } from 'react'
import { Avatar } from './user-profile'
import { useRoomId } from '@/lib/providers/roomId-provider'

interface Member {
  username: string,
  userId: string
}

interface ParticipantsPanelProps {
  isPanelOpen: boolean 
  setIsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const ParticipantsPanel = ({isPanelOpen, setIsPanelOpen}: ParticipantsPanelProps) => {
  
  const currentUser = useCurrentUser()
  const {ws} = useWebSocket()
  const {roomId} = useRoomId()
  const [roomMembers, setRoomMembers] = useState<Member[] | []>([])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if(isBinary(event.data)) return
      const message:WSResponse = JSON.parse(event.data as string)

      if(message.success && message.eventType === 'room:members-update') {
        const members:Member[] | [] = message.data.members
        const me = members.filter((member: Member) => member.userId === currentUser?.userId)
        const others = (members.filter((member:Member) => member.userId !== currentUser?.userId)).sort((a, b) => a.username.localeCompare(b.username))
        setRoomMembers([
          ...me, 
          ...others
        ])
      }
    }

    ws?.addEventListener('message', handleMessage)

    return () => ws?.removeEventListener('message', handleMessage)
  }, [ws, currentUser])

  const sortedMembers = useMemo(() => {
    if(!currentUser) return roomMembers
    const me = roomMembers.find((member) => member.userId === currentUser.userId)
    const others = roomMembers
      .filter((member) => member.userId !== currentUser.userId)
      .sort((a, b) => a.username.localeCompare(b.username))
    
    return me ? [me, ...others] : others
  }, [roomMembers, currentUser])

  if(!isPanelOpen) return null 

  return (
    <div className='absolute inset-0 z-50 flex justify-end mt-[75px]' >
      <div className='relative flex flex-col h-[calc(100vh-75px)] bg-secondary/1 backdrop-blur-2xl  border-gray-700 shadow-lg transition-transform duration-300 ease-in-out w-[85%] sm:w-[60%] lg:w-[25%]' >
        <div className="flex justify-between items-center px-4 pt-4  border-gray-700">
          <h2 className="text-xl text-primary font-semibold">Participants</h2>
        </div>

        <div className='flex-1 flex flex-col gap-2 p-4 overflow-y-auto
          scrollbar-thin 
          scrollbar-thumb-primary/50 
          scrollbar-track-transparent 
          scrollbar-thumb-rounded-md'
        >
          {sortedMembers.map((member) => (
            <MemberProfile
              key={member.userId}
              username={member.username}
              isCurrentUser={member.userId === currentUser?.userId}
            />
          ))}
        </div>

      </div>

    </div>
  )
}

const MemberProfile = ({username, isCurrentUser}: {
  username: string, 
  isCurrentUser: boolean
}) => {
  return (
    <div className='p-4 flex items-center gap-4 border border-primary/25 rounded'>
      <span className='rounded-full size-9 flex justify-center items-center bg-primary'>
        <Avatar initial={username[0]}></Avatar>
      </span>

      <div className='flex-1 min-w-0'>
        <div className='flex items-baseline gap-2'>
          <span className='font-semibold text-md capitalize truncate' >{username}</span>
          {isCurrentUser &&
            <span className='text-sm font-semibold text-primary flex-shrink-0'>(You)</span> 
          }
        </div>
      </div>
    </div>
  )
}


export default ParticipantsPanel