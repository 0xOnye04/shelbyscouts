import type { Session, User } from "next-auth";
import type { User as PrismaUser } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function getUserRole(role?: string | null): "PLAYER" | "SCOUT" {
  return role === "SCOUT" ? "SCOUT" : "PLAYER";
}

export const authOptions = {
  session: { strategy: "jwt" as const },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        let user: PrismaUser | null = null;

        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
        } catch (error) {
          console.error("Unable to authorize credentials", error);
          return null;
        }

        if (!user?.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          return null;
        }

        const userWithoutPassword = { ...user };
        delete (userWithoutPassword as { hashedPassword?: string }).hashedPassword;
        return { ...userWithoutPassword, role: getUserRole(user.role) };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = getUserRole(user.role);
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = getUserRole(token.role);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
