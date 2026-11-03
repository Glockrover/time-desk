
import { db } from "@/lib/prisma";
import {
  getSessionUser,
  readJsonBody,
  unauthorized,
} from "@/lib/session-user";

const MAX_NOTES_LENGTH = 2000;

function parseId(value: unknown) {
  const id = typeof value === "string" ? Number(value) : value;

  return typeof id === "number" && Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

function findActiveEntry(userId: number) {
  return db.orm.public.TimeEntry
    .where({ userId })
    .where((entry) => entry.endTime.isNull())
    .first();
}

export async function GET() {
  // Read the session outside the try so the build's prerender bailout
  // (a rejected headers() promise) isn't caught and logged as a failure.
  const user = await getSessionUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const entries = await db.orm.public.TimeEntry
      .where({ userId: user.id })
      .include("breaks", (breaks) =>
        breaks.orderBy((item) => item.startTime.asc())
      )
      .orderBy((entry) => entry.startTime.desc())
      .all();

    return Response.json(entries);
  } catch (error) {
    console.error("Failed to fetch time entries:", error);
    return Response.json(
      { error: "Unable to fetch time entries." },
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

    if (!body) {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    let projectId: number | null = null;

    if (body.projectId !== undefined && body.projectId !== null) {
      projectId = parseId(body.projectId);

      if (projectId === null) {
        return Response.json(
          { error: "Invalid project." },
          { status: 400 }
        );
      }

      // Only the owner's projects are visible; anything else is a 404.
      const project = await db.orm.public.Project
        .where({ id: projectId, userId: user.id })
        .first();

      if (!project) {
        return Response.json(
          { error: "Project not found." },
          { status: 404 }
        );
      }
    }

    if (body.notes !== undefined && body.notes !== null &&
      typeof body.notes !== "string") {
      return Response.json(
        { error: "Invalid notes." },
        { status: 400 }
      );
    }

    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (notes.length > MAX_NOTES_LENGTH) {
      return Response.json(
        { error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    if (await findActiveEntry(user.id)) {
      return Response.json(
        { error: "You already have an active work session." },
        { status: 409 }
      );
    }

    const timeEntry = await db.orm.public.TimeEntry.create({
      userId: user.id,
      projectId,
      notes: notes || null,
      startTime: Temporal.Now.instant(),
    });

    return Response.json({ ...timeEntry, breaks: [] }, { status: 201 });
  } catch (error) {
    console.error("Failed to start work session:", error);
    return Response.json(
      { error: "Unable to start work session." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return unauthorized();
    }

    const body = await readJsonBody(request);

    if (!body) {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const action = body.action ?? "stopWork";

    if (
      action !== "updateNotes" &&
      action !== "startBreak" &&
      action !== "endBreak" &&
      action !== "stopWork"
    ) {
      return Response.json(
        { error: "Unknown action." },
        { status: 400 }
      );
    }

    // An explicit entryId must belong to the user. Without one, session
    // actions apply to the user's active entry.
    let entry;

    if (body.entryId !== undefined && body.entryId !== null) {
      const entryId = parseId(body.entryId);

      if (entryId === null) {
        return Response.json(
          { error: "Invalid work session." },
          { status: 400 }
        );
      }

      entry = await db.orm.public.TimeEntry
        .where({ id: entryId, userId: user.id })
        .first();
    } else if (action === "updateNotes") {
      return Response.json(
        { error: "Invalid work session." },
        { status: 400 }
      );
    } else {
      entry = await findActiveEntry(user.id);
    }

    if (!entry) {
      return Response.json(
        { error: "Work session not found." },
        { status: 404 }
      );
    }

    if (action === "updateNotes") {
      if (typeof body.notes !== "string") {
        return Response.json(
          { error: "Invalid notes update." },
          { status: 400 }
        );
      }

      const notes = body.notes.trim();

      if (notes.length > MAX_NOTES_LENGTH) {
        return Response.json(
          { error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.` },
          { status: 400 }
        );
      }

      const updatedEntry = await db.orm.public.TimeEntry
        .where({ id: entry.id, userId: user.id })
        .update({ notes: notes || null });

      return Response.json(updatedEntry);
    }

    if (entry.endTime !== null) {
      return Response.json(
        { error: "This work session has already ended." },
        { status: 409 }
      );
    }

    const activeBreak = await db.orm.public.Break
      .where({ timeEntryId: entry.id })
      .where((item) => item.endTime.isNull())
      .first();

    if (action === "startBreak") {
      if (activeBreak) {
        return Response.json(
          { error: "You are already on a break." },
          { status: 409 }
        );
      }

      const newBreak = await db.orm.public.Break.create({
        timeEntryId: entry.id,
        startTime: Temporal.Now.instant(),
      });

      return Response.json(newBreak, { status: 201 });
    }

    if (action === "endBreak") {
      if (!activeBreak) {
        return Response.json(
          { error: "You are not currently on a break." },
          { status: 409 }
        );
      }

      const updatedBreak = await db.orm.public.Break
        .where({ id: activeBreak.id })
        .update({ endTime: Temporal.Now.instant() });

      return Response.json(updatedBreak);
    }

    if (activeBreak) {
      return Response.json(
        { error: "End your break before stopping work." },
        { status: 409 }
      );
    }

    const updatedEntry = await db.orm.public.TimeEntry
      .where({ id: entry.id, userId: user.id })
      .update({ endTime: Temporal.Now.instant() });

    return Response.json(updatedEntry);
  } catch (error) {
    console.error("Failed to update time entry:", error);
    return Response.json(
      { error: "Unable to update time entry." },
      { status: 500 }
    );
  }
}
