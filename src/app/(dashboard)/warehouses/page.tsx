import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission, hasPermission } from "@/lib/rbac";
import { WarehousesClient, WarehouseWithStock } from "@/components/warehouses/warehouses-client";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const user = await enforcePagePermission("warehouses:view");
  const canManage = hasPermission(user.role, "warehouses:manage");

  const rawWarehouses = await prisma.warehouse.findMany({
    orderBy: { code: "asc" },
    include: {
      inventories: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true,
              purchasePrice: true,
              sellingPrice: true,
              minimumStock: true,
            },
          },
        },
      },
    },
  });

  const warehouses: WarehouseWithStock[] = rawWarehouses.map((wh) => ({
    id: wh.id,
    name: wh.name,
    code: wh.code,
    location: wh.location,
    description: wh.description,
    isActive: wh.isActive,
    inventories: wh.inventories.map((inv) => ({
      id: inv.id,
      quantity: inv.quantity,
      product: {
        ...inv.product,
        purchasePrice: Number(inv.product.purchasePrice),
        sellingPrice: Number(inv.product.sellingPrice),
      },
    })),
  }));

  return <WarehousesClient warehouses={warehouses} canManage={canManage} />;
}
