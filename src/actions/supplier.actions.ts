"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { supplierSchema, SupplierFormValues } from "@/lib/validations/master.schema";
import { recordAuditLog } from "@/lib/audit";

export async function createSupplierAction(input: SupplierFormValues) {
  try {
    const user = await requirePermission("suppliers:manage");
    const parsed = supplierSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
    }

    const existing = await prisma.supplier.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return { success: false, error: "A supplier with this email address already exists." };
    }

    const supplier = await prisma.supplier.create({
      data: parsed.data,
    });

    await recordAuditLog({
      userId: user.id,
      action: "CREATE_SUPPLIER",
      entityType: "Supplier",
      entityId: supplier.id,
      details: { companyName: supplier.companyName, email: supplier.email },
    });

    revalidatePath("/suppliers");
    revalidatePath("/stock-in");

    return { success: true, data: supplier };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create supplier",
    };
  }
}

export async function updateSupplierAction(id: string, input: SupplierFormValues) {
  try {
    const user = await requirePermission("suppliers:manage");
    const parsed = supplierSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
    }

    const duplicate = await prisma.supplier.findFirst({
      where: {
        id: { not: id },
        email: parsed.data.email,
      },
    });

    if (duplicate) {
      return { success: false, error: "Another supplier is already using this email address." };
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: parsed.data,
    });

    await recordAuditLog({
      userId: user.id,
      action: "UPDATE_SUPPLIER",
      entityType: "Supplier",
      entityId: updated.id,
      details: { companyName: updated.companyName },
    });

    revalidatePath("/suppliers");
    revalidatePath("/stock-in");

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update supplier",
    };
  }
}

export async function deleteSupplierAction(id: string) {
  try {
    const user = await requirePermission("suppliers:manage");

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { stockMovements: true } } },
    });

    if (!supplier) {
      return { success: false, error: "Supplier not found." };
    }

    if (supplier._count.stockMovements > 0) {
      // Soft deactivate instead of hard delete to preserve historical stock-in records
      await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });

      await recordAuditLog({
        userId: user.id,
        action: "ARCHIVE_SUPPLIER",
        entityType: "Supplier",
        entityId: id,
        details: {
          companyName: supplier.companyName,
          reason: "Has historical stock movements; deactivated instead of hard-deleted.",
        },
      });

      revalidatePath("/suppliers");
      revalidatePath("/stock-in");

      return {
        success: true,
        message: "Supplier has historical transactions and was safely archived.",
      };
    }

    await prisma.supplier.delete({ where: { id } });

    await recordAuditLog({
      userId: user.id,
      action: "DELETE_SUPPLIER",
      entityType: "Supplier",
      entityId: id,
      details: { companyName: supplier.companyName },
    });

    revalidatePath("/suppliers");
    revalidatePath("/stock-in");

    return { success: true, message: "Supplier deleted permanently." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete supplier",
    };
  }
}
