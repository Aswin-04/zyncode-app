export const dynamic = "force-dynamic";

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-svh flex justify-center items-center p-10 bg-background">
      <div className="w-full max-w-sm p-10 border-2 rounded-xl bg-card">
        <LoginForm />
      </div>
    </div>

  )
}
