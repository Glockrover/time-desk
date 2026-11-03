import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in · Time Desk",
};

export default function LoginPage() {
  // The form reads ?callbackUrl and ?error, which are only known per request.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
