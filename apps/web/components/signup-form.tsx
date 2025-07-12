"use client"

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { signupAction } from "@/lib/auth/actions";
import { toast } from "sonner";
import { redirect } from "next/navigation";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, action] = useActionState(signupAction, {success: false});
  useEffect(() => {
    if(state.success) {
      toast(state.message?.at(0))
      redirect('/')
    }
    if(state?.errors?.submissionError) {
      toast(state?.errors?.submissionError, {position: 'top-center', duration: 2000})
    }
  }, [state?.errors?.submissionError, state?.message])
  return (
    <form
      action={action}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={state.name}
            required
          />
          {state?.errors?.name && (
            <p className="text-sm text-red-500">{state.errors.name}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            name="email"
            defaultValue={state.email}
            required
          />
          {state?.errors?.email && (
            <p className="text-sm text-red-500">{state.errors.email}</p>
          )}
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            defaultValue={state.password}
            required
          />
          {state?.errors?.password && (
            <div>
              {state.errors.password.map((error) => (
                <p key={error} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" className="w-full">
          Signup
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Login
        </Link>
      </div>
    </form>
  );
}
