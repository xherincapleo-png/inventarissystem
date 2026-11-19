import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission, hasPermission } from "@/lib/rbac";
import { CategoriesClient } from "@/components/categories/categories-client";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await enforcePagePermission("categories:view");
  const canManage = hasPermission(user.role, "categories:manage");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return <CategoriesClient categories={categories} canManage={canManage} />;
}
