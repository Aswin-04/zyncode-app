'use client'

import { createContext, use } from "react";

import { UserSession } from "../auth/types";

const CurrentUserContext = createContext<UserSession | null | undefined>(undefined)  


export const CurrentUserProvider = ({currentUser, children}: {
  currentUser: UserSession | null,
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