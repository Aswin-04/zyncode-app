'use client'

import { createContext, use, useState } from "react";

interface User {
  id: string, 
  name: string, 
  email: string
}

const CurrentUserContext = createContext<User | null | undefined>(undefined)  


export const CurrentUserProvider = ({currentUser, children}: {
  currentUser: User | null,
  children: React.ReactNode
}) => {
  return <CurrentUserContext value={currentUser}>{children}</CurrentUserContext>
}

export const useCurrentUser = () => {
  const currentUser = use(CurrentUserContext)
  if(currentUser === undefined) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return currentUser
}