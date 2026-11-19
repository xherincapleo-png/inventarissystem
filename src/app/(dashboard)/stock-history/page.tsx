import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/rbac";
import { StockHistoryClient, StockHistoryItem } from "@/components/stock/stock-history-client";

export const dynamic = "force-dynamic";

export default async function StockHistoryPage() {
  await enforcePagePermission("stock:history");

  const [rawMovements, products] = await Promise.all([
    prisma.stockMovement.findMany({
      orderBy: { transactionDate: "desc" },
      take: 200,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        warehouse: { select: { name: true, code: true } },
        supplier: { select: { companyName: true } },
        performedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true },
    }),
  ]);

  const movements: StockHistoryItem[] = rawMovements.map((m) => ({
    id: m.id,
    referenceNo: m.referenceNo,
    type: m.type,
    productId: m.product.id,
    productName: m.product.name,
    productSku: m.product.sku,
    unit: m.product.unit,
    warehouseName: m.warehouse.name,
    warehouseCode: m.warehouse.code,
    supplierName: m.supplier?.companyName ?? null,
    destination: m.destination,
    quantity: m.quantity,
    previousStock: m.previousStock,
    newStock: m.newStock,
    unitPrice: m.unitPrice ? Number(m.unitPrice) : null,
    notes: m.notes,
    performedByName: m.performedBy.name,
    performedByEmail: m.performedBy.email,
    transactionDate: m.transactionDate.toISOString(),
  }));

  return <StockHistoryClient movements={movements} products={products} />;
}
