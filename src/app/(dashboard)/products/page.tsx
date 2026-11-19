import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission, hasPermission } from "@/lib/rbac";
import { ProductsClient, ProductListItem } from "@/components/products/products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await enforcePagePermission("products:view");
  const canManage = hasPermission(user.role, "products:manage");
  const canStockIn = hasPermission(user.role, "stock:in");

  const [rawProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        inventories: { select: { quantity: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const products: ProductListItem[] = rawProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    unit: p.unit,
    purchasePrice: Number(p.purchasePrice),
    sellingPrice: Number(p.sellingPrice),
    minimumStock: p.minimumStock,
    currentStock: p.inventories.reduce((sum, inv) => sum + inv.quantity, 0),
    createdAt: p.createdAt.toISOString(),
    category: p.category,
  }));

  return (
    <ProductsClient
      products={products}
      categories={categories}
      canManage={canManage}
      canStockIn={canStockIn}
    />
  );
}
