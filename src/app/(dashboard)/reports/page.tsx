import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/rbac";
import {
  ReportsClient,
  ReportProductItem,
  ReportMovementItem,
} from "@/components/reports/reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await enforcePagePermission("reports:view");

  const [rawProducts, rawMovements] = await Promise.all([
    prisma.product.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      include: {
        category: { select: { name: true } },
        inventories: { select: { quantity: true } },
      },
    }),
    prisma.stockMovement.findMany({
      orderBy: { transactionDate: "desc" },
      take: 300,
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            unit: true,
            purchasePrice: true,
            sellingPrice: true,
          },
        },
        warehouse: { select: { code: true } },
        supplier: { select: { companyName: true } },
        performedBy: { select: { name: true } },
      },
    }),
  ]);

  const products: ReportProductItem[] = rawProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    categoryName: p.category.name,
    unit: p.unit,
    purchasePrice: Number(p.purchasePrice),
    sellingPrice: Number(p.sellingPrice),
    minimumStock: p.minimumStock,
    currentStock: p.inventories.reduce((s, i) => s + i.quantity, 0),
  }));

  const movements: ReportMovementItem[] = rawMovements.map((m) => ({
    id: m.id,
    referenceNo: m.referenceNo,
    type: m.type,
    sku: m.product.sku,
    productName: m.product.name,
    unit: m.product.unit,
    warehouseCode: m.warehouse.code,
    supplierOrDestination:
      m.type === "STOCK_IN"
        ? m.supplier?.companyName || "Opening Allocation"
        : m.destination || "Internal Dispatch",
    quantity: m.quantity,
    unitPrice: m.unitPrice
      ? Number(m.unitPrice)
      : Number(m.product.purchasePrice),
    performedBy: m.performedBy.name,
    transactionDate: m.transactionDate.toISOString(),
  }));

  return <ReportsClient products={products} movements={movements} />;
}
