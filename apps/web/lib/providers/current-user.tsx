'use client'

import { createContext, use } from "react";

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
    throw new Error('useCurrentUser must be used within SessionProvider')
  }
  return currentUser
}