"use client"

import React from 'react'
import { Button } from './ui/button'
import { useCurrentUser } from '@/lib/auth/context'
import Link from 'next/link'
import { revokeUserSession } from '@/lib/auth/session'

const Header = () => {
  const user = useCurrentUser()
  return (
    <div className=' border-b-1'>
      <div className='max-w-[1440px] mx-auto flex justify-between py-4 px-10'>
        <div className='text-2xl font-semibold'>
          Zyncode
        </div>
        <div className='flex gap-4'>
          <Button variant={'outline'}>Create</Button>
          <Button variant={'outline'}>Join</Button>
          {!user && (
            <>
              <Link href={'signup'}>
                <Button variant={'outline'}>Signup</Button>
              </Link>
              <Link href={'login'}>
                <Button>Login</Button>
              </Link>
            </>
          )}
          {user && (
            <form action={revokeUserSession}>
              <Button type={'submit'} variant={'destructive'}>Logout</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header