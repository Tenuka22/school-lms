"use client"

import { useMutation } from "@tanstack/react-query"
import { useNavigate, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { loginAction } from "@/lib/server/auth"
import { vLoginRequest } from "@/lib/api-client/valibot.gen"
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
import {
  Field,
  FieldDescription,
} from "@/components/ui/field"

export function LoginForm({
  className,
  redirect: redirectTo,
}: {
  className?: string
  redirect?: string
}) {
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      await loginAction({ data: values })
    },
    onSuccess: (_data, variables) => {
      toast.success(`Welcome back, ${variables.email}!`)
      navigate({ to: redirectTo ?? "/" })
    },
    onError: (error: Error) => {
      toastApiError(error, "Login failed")
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
        renderLabel: (label) => (
          <div className="flex items-center">
            <label
              data-slot="field-label"
              htmlFor="password"
              className="flex w-fit gap-2 text-sm leading-none font-medium select-none leading-snug group-data-[disabled=true]/field:opacity-50"
            >
              {label}
            </label>
            <a
              href="#"
              className="ms-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
        ),
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
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormBuilder
            config={config}
            defaultValues={{ email: "", password: "" }}
            valibotSchema={vLoginRequest}
            onSubmit={async (values) => {
              mutation.mutate(values)
            }}
            formId="login-form"
            hideDefaultButtons
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Field className="w-full">
            <Button
              type="submit"
              form="login-form"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <FieldDescription className="w-full text-center">
              Don&apos;t have an account?{" "}
              <Link
                to="/auth/sign-up"
                search={{ redirect: redirectTo }}
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </FieldDescription>
          </Field>
        </CardFooter>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
