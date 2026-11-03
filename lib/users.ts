import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";

// Creates an email/password account. Returns null if the email is taken.
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existingUser = await db.orm.public.User
    .where({ email: input.email })
    .first();

  if (existingUser) {
    return null;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return db.orm.public.User
    .select("id", "name", "email")
    .create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
}
