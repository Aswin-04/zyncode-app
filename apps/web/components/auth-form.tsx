
'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signupAction, loginAction } from "@/lib/actions/auth"
import { useActionState, useEffect } from "react"
import { redirect } from "next/navigation"


type  AuthFormProps = {
  hasName?: boolean,
  formType: "login" | "signup",
} & React.ComponentProps<"div">



export function AuthForm({
  className,
  hasName=false,
  formType,
  ...props
}: AuthFormProps) {

  const action = formType === "login" ? loginAction : signupAction
  const [prevState, formAction] = useActionState(action, undefined)

  useEffect(() => {
    if(prevState?.success) {
      localStorage.setItem('auth_token', prevState.token)
      alert(prevState.message)
      redirect('/')
    }
  }, [prevState?.success])
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{
            formType === "login"
            ? "Login to your account"
            : "Create an account"   
            }</CardTitle>
          <CardDescription className="text-center">{
            formType === "login"
            ? "Enter your email and password to login"
            : "Fill in your details to sign up and get started"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              {hasName && <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter you name"
                  required
                />
              </div>
              }
              {prevState?.fieldErrors?.name && (
                <p className="text-sm text-red-500">
                  {prevState.fieldErrors.name[0]}
                </p>
              )}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                />
              </div>
              {prevState?.fieldErrors?.email && (
                <p className="text-sm text-red-500">
                  {prevState.fieldErrors.email[0]}
                </p>
              )}
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  name="password"
                  placeholder="Enter your password"
                  required 
                />
              </div>
              {prevState?.fieldErrors?.password && (
                <p className="text-sm text-red-500">
                  {prevState.fieldErrors.password[0]}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  {formType === "login" ? "Login" : "Sign up"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                {formType === "login" ? "Sign up" : "Login"}
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
