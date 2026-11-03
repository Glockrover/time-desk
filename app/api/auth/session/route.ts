import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  return Response.json({
    authenticated: Boolean(session?.user),
    user: session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }
      : null,
  });
}
