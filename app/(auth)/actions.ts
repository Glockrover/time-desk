"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { registerUser } from "@/lib/users";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type AuthFormState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
      values?: { name?: string; email?: string };
    }
  | undefined;

// Only allow same-site paths, so ?callbackUrl can't redirect off-site.
function safeCallbackUrl(value: FormDataEntryValue | null) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : "/";
}

function firstErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Partial<Record<"name" | "email" | "password", string>> = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (
      (field === "name" || field === "email" || field === "password") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

async function signInWithPassword(
  email: string,
  password: string,
  redirectTo: string
) {
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    // A successful sign-in throws a redirect, which must propagate.
    if (error instanceof AuthError) {
      return "Invalid email or password.";
    }

    throw error;
  }
}

export async function login(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const result = loginSchema.safeParse({
    email,
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      fieldErrors: firstErrors(result.error.issues),
      values: { email },
    };
  }

  const error = await signInWithPassword(
    result.data.email,
    result.data.password,
    safeCallbackUrl(formData.get("callbackUrl"))
  );

  return { error, values: { email } };
}

export async function signup(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const result = registerSchema.safeParse({
    name,
    email,
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      fieldErrors: firstErrors(result.error.issues),
      values: { name, email },
    };
  }

  try {
    const user = await registerUser(result.data);

    if (!user) {
      return {
        fieldErrors: { email: "An account with this email already exists." },
        values: { name, email },
      };
    }
  } catch (error) {
    console.error("Registration error:", error);
    return {
      error: "Unable to create your account right now.",
      values: { name, email },
    };
  }

  const error = await signInWithPassword(
    result.data.email,
    result.data.password,
    "/"
  );

  return { error, values: { name, email } };
}

export async function loginWithGoogle(formData: FormData) {
  await signIn("google", {
    redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
  });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
