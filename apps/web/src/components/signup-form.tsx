"use client"

import { useMutation } from "@tanstack/react-query"
import { useNavigate, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { registerAction } from "@/lib/server/auth"
import { vRegisterRequest } from "@/lib/api-client/valibot.gen"
import { FormBuilder } from "@/lib/form-builder"
import type { FormConfig } from "@/lib/form-builder"
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
import { Field, FieldDescription } from "@/components/ui/field"

export function SignupForm({
  className,
  redirect: redirectTo,
}: {
  className?: string
  redirect?: string
}) {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      await registerAction({ data: values })
    },
    onSuccess: (_data, variables) => {
      toast.success(`Account created for ${variables.email}. Welcome!`)
      navigate({ to: redirectTo ?? "/" })
    },
    onError: (error: Error) => {
      toastApiError(error, "Registration failed")
    },
  })

  const config: FormConfig<{ email: string; password: string }> = {
    fields: [
      {
        name: "email",
        kind: "text",
        label: "Email",
        placeholder: "m@example.com",
        required: true,
        inputProps: { type: "email" },
      },
      {
        name: "password",
        kind: "text",
        label: "Password",
        required: true,
        inputProps: { type: "password" },
      },
    ],
    layout: [
      { columns: [{ fields: ["email"] }] },
      { columns: [{ fields: ["password"] }] },
    ],
    renderAboveFields: () =>
      mutation.error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {mutation.error.message}
        </div>
      ) : null,
  }

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
          <FormBuilder
            config={config}
            defaultValues={{ email: "", password: "" }}
            valibotSchema={vRegisterRequest}
            onSubmit={async (values) => {
              mutation.mutate(values)
            }}
            formId="signup-form"
            hideDefaultButtons
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Field className="w-full">
            <Button
              type="submit"
              form="signup-form"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
            <FieldDescription className="w-full text-center">
              Already have an account?{" "}
              <Link
                to="/auth/sign-in"
                search={{ redirect: undefined }}
                className="underline underline-offset-4"
              >
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
