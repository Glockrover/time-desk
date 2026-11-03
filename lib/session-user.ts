import { auth } from "@/auth";
import { db } from "@/lib/prisma";

// Resolves the signed-in user from the session and confirms the row still
// exists. Never returns passwordHash or googleId.
export async function getSessionUser() {
  const session = await auth();
  const id = Number(session?.user?.id);

  if (!session?.user?.id || !Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return db.orm.public.User
    .select("id", "email", "name", "createdAt")
    .first({ id });
}

export function unauthorized() {
  return Response.json(
    { error: "You must sign in first." },
    { status: 401 }
  );
}

export async function readJsonBody(request: Request) {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
