import { RoleType } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: RoleType;
    roleId: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: RoleType;
      roleId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RoleType;
    roleId: string;
  }
}
