import { AuthForm } from "@/components/auth-form";

import React from 'react'

const Signup = () => {
  return (
    <div className="flex w-full min-h-svh justify-center items-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthForm formType="signup" hasName={true}></AuthForm>
      </div>
    </div>
  )
}

export default Signup