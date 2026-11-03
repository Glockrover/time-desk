import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Sign up · Time Desk",
};

export default function SignupPage() {
  return <SignupForm />;
}
