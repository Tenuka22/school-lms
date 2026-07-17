"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useNavigate, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { registerAction } from "@/lib/server/auth"
import { vRegisterRequest } from "@/lib/api-client/valibot.gen"
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

export function SignupForm({ className }: { className?: string }) {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const result = await registerAction({ data: values })
      if (!result.ok) throw new Error("Registration failed")
    },
    onSuccess: () => {
      toast.success("Account created successfully!")
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
      onSubmit: vRegisterRequest,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card className="w-full sm:max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="signup-form"
            onSubmit={(e) => {
              console.log("Form onSubmit triggered")
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              {mutation.error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {mutation.error.error}
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
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
              form="signup-form"
              className="w-full"
              disabled={mutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              {mutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
            <FieldDescription className="w-full text-center">
              Already have an account?{" "}
              <Link to="/auth/sign-in" className="underline underline-offset-4">
                Sign in
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
