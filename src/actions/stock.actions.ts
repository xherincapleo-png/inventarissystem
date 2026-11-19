"use server";

import { revalidatePath } from "next/cache";
import { MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import {
  stockInSchema,
  StockInFormValues,
  stockOutSchema,
  StockOutFormValues,
  stockAdjustmentSchema,
  StockAdjustmentFormValues,
} from "@/lib/validations/stock.schema";
import { generateReferenceNo } from "@/lib/utils";
import { recordAuditLog } from "@/lib/audit";

/**
 * Business Rules #3, #6, #7, #10:
 * Atomically increases warehouse inventory, creates a StockMovement ledger entry,
 * and records an AuditLog.
 */
export async function recordStockInAction(input: StockInFormValues) {
  try {
    const user = await requirePermission("stock:in");
    const parsed = stockInSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed",
      };
    }

    const data = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product || product.isArchived) {
        throw new Error("Selected product was not found or is archived.");
      }

      const existingInventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
      });

      const previousStock = existingInventory?.quantity ?? 0;
      const newStock = previousStock + data.quantity;

      await tx.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        update: {
          quantity: newStock,
        },
        create: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: newStock,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          referenceNo: generateReferenceNo("SIN"),
          type: MovementType.STOCK_IN,
          productId: data.productId,
          warehouseId: data.warehouseId,
          supplierId: data.supplierId,
          quantity: data.quantity,
          previousStock,
          newStock,
          unitPrice: data.unitPrice ?? product.purchasePrice,
          notes: data.notes || null,
          transactionDate: new Date(data.transactionDate),
          performedById: user.id,
        },
      });

      await recordAuditLog({
        userId: user.id,
        action: "STOCK_IN_RECORDED",
        entityType: "StockMovement",
        entityId: movement.id,
        details: {
          referenceNo: movement.referenceNo,
          sku: product.sku,
          quantity: data.quantity,
          previousStock,
          newStock,
        },
        tx,
      });

      return movement;
    });

    revalidatePath("/stock-in");
    revalidatePath("/stock-history");
    revalidatePath("/products");
    revalidatePath("/warehouses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return {
      success: true,
      data: { referenceNo: result.referenceNo, newStock: result.newStock },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record Stock In",
    };
  }
}

/**
 * Business Rules #2, #4, #6, #7, #10:
 * Atomically verifies sufficient warehouse stock, prevents negative inventory,
 * decreases stock, creates a StockMovement ledger entry, and writes an AuditLog.
 */
export async function recordStockOutAction(input: StockOutFormValues) {
  try {
    const user = await requirePermission("stock:out");
    const parsed = stockOutSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed",
      };
    }

    const data = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product || product.isArchived) {
        throw new Error("Selected product was not found or is archived.");
      }

      const existingInventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        include: { warehouse: true },
      });

      const availableStock = existingInventory?.quantity ?? 0;

      // Business Rule #2: Stock cannot become negative
      if (data.quantity > availableStock) {
        throw new Error(
          `Insufficient stock in selected warehouse. Available: ${availableStock} ${product.unit}, Requested: ${data.quantity} ${product.unit}.`
        );
      }

      const newStock = availableStock - data.quantity;

      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        data: {
          quantity: newStock,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          referenceNo: generateReferenceNo("SOUT"),
          type: MovementType.STOCK_OUT,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          previousStock: availableStock,
          newStock,
          unitPrice: product.sellingPrice,
          destination: data.destination,
          notes: data.notes || null,
          transactionDate: new Date(data.transactionDate),
          performedById: user.id,
        },
      });

      await recordAuditLog({
        userId: user.id,
        action: "STOCK_OUT_RECORDED",
        entityType: "StockMovement",
        entityId: movement.id,
        details: {
          referenceNo: movement.referenceNo,
          sku: product.sku,
          quantity: data.quantity,
          previousStock: availableStock,
          newStock,
          destination: data.destination,
        },
        tx,
      });

      return movement;
    });

    revalidatePath("/stock-out");
    revalidatePath("/stock-history");
    revalidatePath("/products");
    revalidatePath("/warehouses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return {
      success: true,
      data: { referenceNo: result.referenceNo, newStock: result.newStock },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record Stock Out",
    };
  }
}

/**
 * Business Rules #2, #5, #6, #7, #10:
 * Atomically adjusts inventory quantity, saves previous and new quantities,
 * records adjustment reason in StockAdjustment, logs a StockMovement, and writes AuditLog.
 */
export async function recordStockAdjustmentAction(
  input: StockAdjustmentFormValues
) {
  try {
    const user = await requirePermission("stock:adjust");
    const parsed = stockAdjustmentSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed",
      };
    }

    const data = parsed.data;

    if (data.newQuantity < 0) {
      return {
        success: false,
        error: "Adjusted stock quantity cannot be negative.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product || product.isArchived) {
        throw new Error("Selected product was not found or is archived.");
      }

      const existingInventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
      });

      const previousQuantity = existingInventory?.quantity ?? 0;
      const difference = data.newQuantity - previousQuantity;

      if (difference === 0) {
        throw new Error(
          `New quantity (${data.newQuantity}) is identical to the current warehouse stock (${previousQuantity}).`
        );
      }

      await tx.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: data.productId,
            warehouseId: data.warehouseId,
          },
        },
        update: {
          quantity: data.newQuantity,
        },
        create: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.newQuantity,
        },
      });

      const refNo = generateReferenceNo("ADJ");

      const adjustment = await tx.stockAdjustment.create({
        data: {
          referenceNo: refNo,
          productId: data.productId,
          warehouseId: data.warehouseId,
          previousQuantity,
          newQuantity: data.newQuantity,
          difference,
          reason: data.reason,
          notes: data.notes || null,
          performedById: user.id,
        },
      });

      await tx.stockMovement.create({
        data: {
          referenceNo: refNo,
          type: MovementType.ADJUSTMENT,
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: Math.abs(difference),
          previousStock: previousQuantity,
          newStock: data.newQuantity,
          notes: `Adjustment (${difference > 0 ? "+" : ""}${difference}): ${data.reason}${
            data.notes ? ` — ${data.notes}` : ""
          }`,
          transactionDate: new Date(),
          performedById: user.id,
        },
      });

      await recordAuditLog({
        userId: user.id,
        action: "STOCK_ADJUSTMENT_RECORDED",
        entityType: "StockAdjustment",
        entityId: adjustment.id,
        details: {
          referenceNo: refNo,
          sku: product.sku,
          previousQuantity,
          newQuantity: data.newQuantity,
          difference,
          reason: data.reason,
        },
        tx,
      });

      return adjustment;
    });

    revalidatePath("/stock-adjustments");
    revalidatePath("/stock-history");
    revalidatePath("/products");
    revalidatePath("/warehouses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return {
      success: true,
      data: {
        referenceNo: result.referenceNo,
        previousQuantity: result.previousQuantity,
        newQuantity: result.newQuantity,
        difference: result.difference,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record adjustment",
    };
  }
}
