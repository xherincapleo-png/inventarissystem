import React from "react";
import { MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/rbac";
import { StockOutClient } from "@/components/stock/stock-out-client";

export const dynamic = "force-dynamic";

export default async function StockOutPage() {
  await enforcePagePermission("stock:out");

  const [products, warehouses, recentMovements] = await Promise.all([
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
    prisma.stockMovement.findMany({
      where: { type: MovementType.STOCK_OUT },
      take: 15,
      orderBy: { transactionDate: "desc" },
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        warehouse: { select: { code: true } },
        performedBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <StockOutClient
      products={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        inventories: p.inventories,
      }))}
      warehouses={warehouses}
      recentStockOuts={recentMovements.map((m) => ({
        id: m.id,
        referenceNo: m.referenceNo,
        productName: m.product.name,
        productSku: m.product.sku,
        unit: m.product.unit,
        warehouseCode: m.warehouse.code,
        destination: m.destination || "Standard Dispatch",
        quantity: m.quantity,
        previousStock: m.previousStock,
        newStock: m.newStock,
        transactionDate: m.transactionDate.toISOString(),
        performedByName: m.performedBy.name,
      }))}
    />
  );
}
