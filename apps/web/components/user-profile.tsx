'use client'
import React, { useActionState, useEffect, useRef, useState } from 'react'
import { useCurrentUser } from '@/lib/providers/current-user-provider'
import { ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { logoutAction } from '@/lib/auth/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRoomId } from '@/lib/providers/roomId-provider'
import DialogLeaveButton from './dialog-leave-button'

const UserProfile = () => {
  const currentUser = useCurrentUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [state, action] = useActionState(logoutAction, undefined)

  useEffect(() => {
    if(!state) return

    if(state.success === true) {
      toast.success(state.message, {position: "bottom-center"})
      setIsMenuOpen(false)
    }

    else if(state.success === false) {
      toast.error(state?.message, {position: 'bottom-center'})
    }
  }, [state])

  useEffect(() => {
    if(!isMenuOpen) return 

    const handleClickOutside = (event: MouseEvent) => {
      if(menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('click', handleClickOutside)

    return () => window.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen])

  return (
    <div
      ref={menuRef} 
      onClick={() => setIsMenuOpen(prev => (!prev))} 
      className='relative cursor-pointer font-montserrat flex justify-center items-center p-1  rounded-3xl bg-secondary-foreground' >
      <Avatar initial={currentUser?.name[0] || 'G'}></Avatar>
      <div className='text-black flex justify-center items-center gap-1 px-1'>
        <span 
          className='text-sm font-bold max-md:hidden truncate max-w-24' 
          title={currentUser?.name || 'Guest'}
        >{currentUser?.name || 'Guest'}</span>
        <ChevronDown size={"18"} strokeWidth={"3px"} ></ChevronDown>
      </div>
      <DropdownMenu isOpen={isMenuOpen} action={action} ></DropdownMenu>
    </div>
  )
}

export const Avatar = ({initial}: {initial: string}) => {
  return (
    <div className='font-montserrat uppercase bg-background text-xl flex justify-center items-center font-semibold size-8 rounded-full'>
      {initial}
    </div>
  )
}

const DropdownMenu = ({isOpen, action}: {isOpen: boolean, action: (formData: FormData) => void}) => {
  const currentUser = useCurrentUser()
  const {roomId} = useRoomId()
  return (
    <div 
      onClick={(e) => e.stopPropagation()}
       className={cn('z-100 absolute border-2 top-[2.6rem] px-2 py-4 min-w-full w-fit bg-secondary backdrop-blur-2xl rounded-md',
        'transition-all ease-out duration-300',
        isOpen 
          ? 'translate-y-0 opacity-100 visible'
          : '-translate-y-4 opacity-0 invisible',
        !currentUser && 'md:hidden'
      )}>
        <div className='flex flex-col gap-2 justify-center items-center'>
          {roomId && 
            <DialogLeaveButton/>
          }
          {currentUser 
            ?  <LogoutButton action={action}></LogoutButton> 
            :  <div className='flex flex-col justify-center items-center gap-2 md:hidden'>
                <Link href={'/signup'}>
                  <Button>Signup</Button>
                </Link>
                <Link href={'/login'}>
                  <Button variant={'outline'}>login</Button>
                </Link>
              </div>
          }
        </div>
    </div>
  )
}

const LogoutButton = ({action}: {action: (formData: FormData) => void} ) => {
  return (
    <form action={action}>
      <Button type='submit' >Logout</Button>
    </form>
  )
}

export default UserProfile