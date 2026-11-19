import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission, hasPermission } from "@/lib/rbac";
import { ProductDetailClient } from "@/components/products/product-detail-client";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await enforcePagePermission("products:view");

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        inventories: {
          include: {
            warehouse: {
              select: { id: true, name: true, code: true, location: true },
            },
          },
        },
        stockMovements: {
          take: 25,
          orderBy: { transactionDate: "desc" },
          include: {
            warehouse: { select: { code: true } },
            performedBy: { select: { name: true } },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const serializedProduct = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    unit: product.unit,
    purchasePrice: Number(product.purchasePrice),
    sellingPrice: Number(product.sellingPrice),
    minimumStock: product.minimumStock,
    imageUrl: product.imageUrl,
    isArchived: product.isArchived,
    createdAt: product.createdAt.toISOString(),
    inventories: product.inventories,
    movements: product.stockMovements.map((m) => ({
      id: m.id,
      referenceNo: m.referenceNo,
      type: m.type,
      quantity: m.quantity,
      previousStock: m.previousStock,
      newStock: m.newStock,
      warehouseCode: m.warehouse.code,
      performedByName: m.performedBy.name,
      notes: m.notes,
      transactionDate: m.transactionDate.toISOString(),
    })),
  };

  return (
    <ProductDetailClient
      product={serializedProduct}
      categories={categories}
      canManage={hasPermission(user.role, "products:manage")}
      canStockIn={hasPermission(user.role, "stock:in")}
      canStockOut={hasPermission(user.role, "stock:out")}
    />
  );
}
