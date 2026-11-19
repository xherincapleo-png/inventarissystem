import { RoleType } from "@prisma/client";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type PermissionAction =
  | "dashboard:view"
  | "products:view"
  | "products:manage"
  | "categories:view"
  | "categories:manage"
  | "stock:in"
  | "stock:out"
  | "stock:adjust"
  | "stock:history"
  | "suppliers:view"
  | "suppliers:manage"
  | "warehouses:view"
  | "warehouses:manage"
  | "reports:view"
  | "reports:export"
  | "users:manage"
  | "settings:manage";

export const ROLE_PERMISSIONS: Record<RoleType, PermissionAction[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "products:view",
    "products:manage",
    "categories:view",
    "categories:manage",
    "stock:in",
    "stock:out",
    "stock:adjust",
    "stock:history",
    "suppliers:view",
    "suppliers:manage",
    "warehouses:view",
    "warehouses:manage",
    "reports:view",
    "reports:export",
    "users:manage",
    "settings:manage",
  ],
  ADMIN: [
    "dashboard:view",
    "products:view",
    "products:manage",
    "categories:view",
    "categories:manage",
    "stock:in",
    "stock:out",
    "stock:adjust",
    "stock:history",
    "suppliers:view",
    "suppliers:manage",
    "warehouses:view",
    "warehouses:manage",
    "reports:view",
    "reports:export",
  ],
  STAFF: [
    "dashboard:view",
    "products:view",
    "categories:view",
    "stock:in",
    "stock:out",
    "stock:history",
  ],
  VIEWER: [
    "dashboard:view",
    "products:view",
    "categories:view",
    "stock:history",
    "suppliers:view",
    "warehouses:view",
    "reports:view",
  ],
};

export function hasPermission(role: RoleType | undefined, permission: PermissionAction): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyRole(role: RoleType | undefined, allowedRoles: RoleType[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}

/**
 * Server Action guard: throws an explicit error if the user is unauthenticated or lacks the required permission.
 */
export async function requirePermission(permission: PermissionAction) {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in to perform this action.");
  }

  if (!hasPermission(session.user.role, permission)) {
    throw new Error(
      `Forbidden: Your role (${session.user.role}) does not have permission for '${permission}'.`
    );
  }

  return session.user;
}

/**
 * Server Component page guard: redirects to /login if unauthenticated, or /dashboard if lacking permission.
 */
export async function enforcePagePermission(permission: PermissionAction) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session.user.role, permission)) {
    redirect("/dashboard?error=forbidden");
  }

  return session.user;
}
