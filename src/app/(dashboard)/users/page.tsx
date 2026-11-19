import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/rbac";
import { UsersClient, UserListItem } from "@/components/users/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await enforcePagePermission("users:manage");

  const rawUsers = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      role: true,
      _count: {
        select: { stockMovements: true },
      },
    },
  });

  const users: UserListItem[] = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    movementsCount: u._count.stockMovements,
  }));

  return <UsersClient users={users} currentUserId={currentUser.id} />;
}
