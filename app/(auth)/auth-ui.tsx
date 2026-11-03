import type { ReactNode } from "react";
import { loginWithGoogle } from "./actions";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Time Desk
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm">{children}</div>

        <p className="mt-6 text-center text-sm text-gray-600">{footer}</p>
      </div>
    </main>
  );
}

export function Field({
  label,
  name,
  type,
  autoComplete,
  defaultValue,
  error,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
}) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-gray-900 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {message}
    </p>
  );
}

export function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <>
      <div className="my-6 flex items-center gap-3 text-sm text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <form action={loginWithGoogle}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <button
          type="submit"
          className="w-full rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          Continue with Google
        </button>
      </form>
    </>
  );
}
