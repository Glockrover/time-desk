
import { db } from "@/lib/prisma";
import {
  getSessionUser,
  readJsonBody,
  unauthorized,
} from "@/lib/session-user";

export async function GET() {
  // Read the session outside the try so the build's prerender bailout
  // (a rejected headers() promise) isn't caught and logged as a failure.
  const user = await getSessionUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const projects = await db.orm.public.Project
      .where({ userId: user.id })
      .orderBy((p) => p.createdAt.asc())
      .all();

    return Response.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    return Response.json(
      { error: "Unable to fetch projects." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return unauthorized();
    }

    const body = await readJsonBody(request);
    const name =
      typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return Response.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return Response.json(
        { error: "Project name must be 100 characters or fewer." },
        { status: 400 }
      );
    }

    const project = await db.orm.public.Project.create({
      name,
      userId: user.id,
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);

    return Response.json(
      { error: "Unable to create project." },
      { status: 500 }
    );
  }
}
