'use client'
import React, { createContext, use, useState } from 'react'

type RoomIdState = {
  roomId: string | null,
  setRoomId: React.Dispatch<React.SetStateAction<string | null>>
}

const RoomIdContext = createContext<RoomIdState | undefined>(undefined)

const RoomIdProvider = ({children}: {children: React.ReactNode}) => {
  const [roomId, setRoomId] = useState<string | null>(null)
  return (
    <RoomIdContext value={{roomId, setRoomId}} >{children}</RoomIdContext>
  )
}

export const useRoomId = () => {
  const context = use(RoomIdContext)
  if(context === undefined) {
    throw new Error('useRoom must be used within the RoomProvider')
  }

  return context
}

export default RoomIdProvider