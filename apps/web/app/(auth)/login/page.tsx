import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-svh flex justify-center items-center p-10">
      <div className="w-full max-w-sm p-10 border-1 rounded-xl">
        <LoginForm />
      </div>
    </div>

  )
}
