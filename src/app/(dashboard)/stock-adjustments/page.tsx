import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/rbac";
import { StockAdjustmentsClient } from "@/components/stock/stock-adjustments-client";

export const dynamic = "force-dynamic";

export default async function StockAdjustmentsPage() {
  await enforcePagePermission("stock:adjust");

  const [products, warehouses, adjustments] = await Promise.all([
    prisma.product.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      include: {
        inventories: {
          select: { warehouseId: true, quantity: true },
        },
      },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.stockAdjustment.findMany({
      take: 25,
      orderBy: { adjustedAt: "desc" },
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        warehouse: { select: { code: true } },
        performedBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <StockAdjustmentsClient
      products={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        inventories: p.inventories,
      }))}
      warehouses={warehouses}
      adjustments={adjustments.map((a) => ({
        id: a.id,
        referenceNo: a.referenceNo,
        productName: a.product.name,
        productSku: a.product.sku,
        unit: a.product.unit,
        warehouseCode: a.warehouse.code,
        previousQuantity: a.previousQuantity,
        newQuantity: a.newQuantity,
        difference: a.difference,
        reason: a.reason,
        notes: a.notes,
        performedByName: a.performedBy.name,
        adjustedAt: a.adjustedAt.toISOString(),
      }))}
    />
  );
}
