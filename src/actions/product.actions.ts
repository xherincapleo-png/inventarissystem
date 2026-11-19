"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { productFormSchema, ProductFormValues } from "@/lib/validations/product.schema";
import { recordAuditLog } from "@/lib/audit";
import { generateReferenceNo } from "@/lib/utils";
import { MovementType } from "@prisma/client";

export async function createProductAction(input: ProductFormValues) {
  try {
    const user = await requirePermission("products:manage");
    const parsed = productFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed",
      };
    }

    const data = parsed.data;

    // Business Rule #1: SKU must be unique
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return {
        success: false,
        error: `SKU "${data.sku}" is already assigned to another product.`,
      };
    }

    // Create product and optional initial inventory inside an atomic transaction
    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: data.sku,
          name: data.name,
          description: data.description || null,
          categoryId: data.categoryId,
          unit: data.unit,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          minimumStock: data.minimumStock,
          imageUrl: data.imageUrl || null,
        },
      });

      if (data.initialWarehouseId && data.initialStock && data.initialStock > 0) {
        await tx.inventory.create({
          data: {
            productId: product.id,
            warehouseId: data.initialWarehouseId,
            quantity: data.initialStock,
          },
        });

        await tx.stockMovement.create({
          data: {
            referenceNo: generateReferenceNo("SIN"),
            type: MovementType.STOCK_IN,
            productId: product.id,
            warehouseId: data.initialWarehouseId,
            quantity: data.initialStock,
            previousStock: 0,
            newStock: data.initialStock,
            unitPrice: data.purchasePrice,
            notes: "Initial opening stock upon product creation",
            transactionDate: new Date(),
            performedById: user.id,
          },
        });
      }

      await recordAuditLog({
        userId: user.id,
        action: "CREATE_PRODUCT",
        entityType: "Product",
        entityId: product.id,
        details: {
          sku: product.sku,
          name: product.name,
          initialStock: data.initialStock || 0,
        },
        tx,
      });

      return product;
    });

    revalidatePath("/products");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: { id: createdProduct.id, sku: createdProduct.sku } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProductAction(id: string, input: ProductFormValues) {
  try {
    const user = await requirePermission("products:manage");
    const parsed = productFormSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed",
      };
    }

    const data = parsed.data;

    // Verify SKU uniqueness excluding current product
    const duplicateSku = await prisma.product.findFirst({
      where: {
        id: { not: id },
        sku: data.sku,
      },
    });

    if (duplicateSku) {
      return {
        success: false,
        error: `SKU "${data.sku}" is already used by another product.`,
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          sku: data.sku,
          name: data.name,
          description: data.description || null,
          categoryId: data.categoryId,
          unit: data.unit,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          minimumStock: data.minimumStock,
          imageUrl: data.imageUrl || null,
        },
      });

      await recordAuditLog({
        userId: user.id,
        action: "UPDATE_PRODUCT",
        entityType: "Product",
        entityId: product.id,
        details: {
          sku: product.sku,
          name: product.name,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
        },
        tx,
      });

      return product;
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const user = await requirePermission("products:manage");

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stockMovements: true,
            stockAdjustments: true,
          },
        },
        inventories: true,
      },
    });

    if (!product) {
      return { success: false, error: "Product not found." };
    }

    const totalStock = product.inventories.reduce((acc, inv) => acc + inv.quantity, 0);
    const hasHistory =
      product._count.stockMovements > 0 || product._count.stockAdjustments > 0;

    // Business Rule #9: Products with historical transactions should not be hard-deleted
    if (hasHistory || totalStock > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: { isArchived: true },
        });

        await recordAuditLog({
          userId: user.id,
          action: "ARCHIVE_PRODUCT",
          entityType: "Product",
          entityId: id,
          details: {
            sku: product.sku,
            name: product.name,
            reason: "Product has historical movements or active stock; archived instead of hard-deleted.",
          },
          tx,
        });
      });

      revalidatePath("/products");
      revalidatePath("/dashboard");
      return {
        success: true,
        archived: true,
        message: `Product "${product.name}" has transaction history and was safely archived.`,
      };
    }

    // Safe to hard delete if zero history and zero stock
    await prisma.$transaction(async (tx) => {
      await tx.inventory.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });

      await recordAuditLog({
        userId: user.id,
        action: "DELETE_PRODUCT",
        entityType: "Product",
        entityId: id,
        details: { sku: product.sku, name: product.name },
        tx,
      });
    });

    revalidatePath("/products");
    revalidatePath("/dashboard");

    return {
      success: true,
      archived: false,
      message: `Product "${product.name}" was permanently deleted.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}
