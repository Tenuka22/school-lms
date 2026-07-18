"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useNavigate, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { loginAction } from "@/lib/server/auth"
import { vLoginRequest } from "@/lib/api-client/valibot.gen"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({ className }: { className?: string }) {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const result = await loginAction({ data: values })
      if (!result.ok) throw new Error("Login failed")
    },
    onSuccess: () => {
      toast.success("Welcome back! Logging you in...")
      navigate({ to: "/" })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: vLoginRequest,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card className="w-full sm:max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="login-form"
            onSubmit={(e) => {
              console.log("Form onSubmit triggered")
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              {mutation.error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {mutation.error.message}
                </div>
              )}
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        placeholder="m@example.com"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <div className="flex items-center">
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                        <a
                          href="#"
                          className="ms-auto text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Field className="w-full">
            <Button
              type="submit"
              form="login-form"
              className="w-full"
              disabled={mutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              {mutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <FieldDescription className="w-full text-center">
              Don&apos;t have an account?{" "}
              <Link to="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </FieldDescription>
          </Field>
        </CardFooter>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
