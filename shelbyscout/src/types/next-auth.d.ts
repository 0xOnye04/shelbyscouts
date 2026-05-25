import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: "PLAYER" | "SCOUT";
    };
  }

  interface User extends DefaultUser {
    role?: "PLAYER" | "SCOUT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "PLAYER" | "SCOUT";
  }
}
