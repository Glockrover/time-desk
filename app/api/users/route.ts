
import { getSessionUser, unauthorized } from "@/lib/session-user";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return unauthorized();
  }

  return Response.json(user);
}
