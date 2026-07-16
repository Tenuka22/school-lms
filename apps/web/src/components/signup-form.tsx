"use client"

import { useForm } from "@tanstack/react-form"
import { valibotValidator } from "@tanstack/valibot-form-adapter"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { registerMutation } from "@/lib/api-client/@tanstack/react-query.gen"
import { type RegisterError } from "@/lib/api-client/types.gen"
import { useAuth } from "@/lib/auth"
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
import { Link } from "@tanstack/react-router"

export function SignupForm({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const mutation = useMutation({
    ...registerMutation(),
    onSuccess: (data) => {
      login(data.access_token, data.refresh_token, Number(data.expires_at))
      toast.success("Account created successfully!")
      navigate({ to: "/" })
    },
    onError: (error: RegisterError) => {
      toast.error(error.error)
    },
  })

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validatorAdapter: valibotValidator,
    validators: {
      onSubmit: vRegisterRequest,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate({
        body: { email: value.email, password: value.password },
      })
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
