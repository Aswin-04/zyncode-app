"use client"

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { signinAction } from "@/lib/auth/actions";
import { toast } from "sonner";
import { redirect } from "next/navigation";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [state, action] = useActionState(signinAction, {success: false});
  useEffect(() => {
    if(state.success) {
      toast(state.message)
      redirect('/')
    }
    if(state.errors?.submissionError) {
      toast(state.errors.submissionError[0])
    }
  }, [state.success, state.message,  state.errors?.submissionError])

  return (
    <form
      action={action}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
      </div>
      <div className="grid gap-6">
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
          Login
        </Button>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Signup
        </Link>
      </div>
    </form>
  );
}
