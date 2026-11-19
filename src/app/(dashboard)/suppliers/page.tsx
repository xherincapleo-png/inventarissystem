import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission, hasPermission } from "@/lib/rbac";
import { SuppliersClient } from "@/components/suppliers/suppliers-client";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const user = await enforcePagePermission("suppliers:view");
  const canManage = hasPermission(user.role, "suppliers:manage");

  const suppliers = await prisma.supplier.findMany({
    orderBy: { companyName: "asc" },
    include: {
      _count: {
        select: { stockMovements: true },
      },
    },
  });

  return <SuppliersClient suppliers={suppliers} canManage={canManage} />;
}
