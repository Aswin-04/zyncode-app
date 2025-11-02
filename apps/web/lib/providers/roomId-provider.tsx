'use client'
import React, { createContext, use, useState } from 'react'

type RoomIdState = {
  roomId: string,
  setRoomId: React.Dispatch<React.SetStateAction<string>>
}

const RoomIdContext = createContext<RoomIdState | undefined>(undefined)

const RoomIdProvider = ({children}: {children: React.ReactNode}) => {
  const [roomId, setRoomId] = useState<string>("")
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