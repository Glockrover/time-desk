"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../actions";
import { AuthCard, Field, FormError, GoogleButton } from "../auth-ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start tracking your working hours."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-800">
            Log in
          </Link>
        </>
      }
    >
      <form action={action} className="space-y-5" noValidate>
        <FormError message={state?.error} />
        <Field
          label="Name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={state?.values?.name}
          error={state?.fieldErrors?.name}
        />
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
          autoComplete="new-password"
          error={state?.fieldErrors?.password}
          hint="At least 8 characters."
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <GoogleButton callbackUrl="/" />
    </AuthCard>
  );
}
