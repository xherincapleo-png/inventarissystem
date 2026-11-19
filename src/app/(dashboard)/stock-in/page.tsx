import React from "react";
import { MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/rbac";
import { StockInClient } from "@/components/stock/stock-in-client";

export const dynamic = "force-dynamic";

export default async function StockInPage() {
  await enforcePagePermission("stock:in");

  const [products, warehouses, suppliers, recentMovements] = await Promise.all([
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
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
    prisma.stockMovement.findMany({
      where: { type: MovementType.STOCK_IN },
      take: 15,
      orderBy: { transactionDate: "desc" },
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        warehouse: { select: { code: true } },
        supplier: { select: { companyName: true } },
        performedBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <StockInClient
      products={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        purchasePrice: Number(p.purchasePrice),
        inventories: p.inventories,
      }))}
      warehouses={warehouses}
      suppliers={suppliers}
      recentStockIns={recentMovements.map((m) => ({
        id: m.id,
        referenceNo: m.referenceNo,
        productName: m.product.name,
        productSku: m.product.sku,
        unit: m.product.unit,
        warehouseCode: m.warehouse.code,
        supplierName: m.supplier?.companyName || "Opening Stock",
        quantity: m.quantity,
        previousStock: m.previousStock,
        newStock: m.newStock,
        transactionDate: m.transactionDate.toISOString(),
        performedByName: m.performedBy.name,
      }))}
    />
  );
}
