"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { login } from "../actions";
import { AuthCard, Field, FormError, GoogleButton } from "../auth-ui";

// Error codes Auth.js appends as ?error= when it redirects back here.
const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  AccessDenied:
    "That email already has a password account. Sign in with your email and password instead.",
  OAuthAccountNotLinked:
    "That email already has a password account. Sign in with your email and password instead.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorCode = searchParams.get("error");
  const [state, action, pending] = useActionState(login, undefined);

  const error =
    state?.error ??
    (state || !errorCode
      ? undefined
      : AUTH_ERRORS[errorCode] ?? "Sign-in failed. Please try again.");

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back. Log in to track your time."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-800">
            Sign up
          </Link>
        </>
      }
    >
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <FormError message={error} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.values?.email}
          error={state?.fieldErrors?.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={state?.fieldErrors?.password}
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <GoogleButton callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
