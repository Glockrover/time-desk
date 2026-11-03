
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Google,

    Credentials({
      name: "Email and Password",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;

        const user = await db.orm.public.User
          .where({ email })
          .first();

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordIsValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!passwordIsValid) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email || !account.providerAccountId) {
        return false;
      }

      const existingGoogleUser = await db.orm.public.User
        .where({ googleId: account.providerAccountId })
        .first();

      if (existingGoogleUser) {
        user.id = String(existingGoogleUser.id);
        return true;
      }

      const existingEmailUser = await db.orm.public.User
        .where({ email: user.email })
        .first();

      if (existingEmailUser) {
        // Do not automatically link a Google account to an existing
        // email/password account.
        return false;
      }

      const newUser = await db.orm.public.User.create({
        email: user.email,
        name: user.name ?? profile?.name ?? null,
        googleId: account.providerAccountId,
      });

      user.id = String(newUser.id);

      return true;
    },

    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = String(token.userId);
      }

      return session;
    },
  },
});
