
import { NextResponse } from "next/server";
import { registerUser } from "@/lib/users";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please check your name, email, and password." },
        { status: 400 }
      );
    }

    const user = await registerUser(result.data);

    if (!user) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Unable to create your account right now." },
      { status: 500 }
    );
  }
}
