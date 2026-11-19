"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { warehouseSchema, WarehouseFormValues } from "@/lib/validations/master.schema";
import { recordAuditLog } from "@/lib/audit";

export async function createWarehouseAction(input: WarehouseFormValues) {
  try {
    const user = await requirePermission("warehouses:manage");
    const parsed = warehouseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
    }

    const existing = await prisma.warehouse.findFirst({
      where: {
        OR: [
          { name: { equals: parsed.data.name, mode: "insensitive" } },
          { code: { equals: parsed.data.code, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      return {
        success: false,
        error: "A warehouse with this name or code already exists.",
      };
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        location: parsed.data.location,
        description: parsed.data.description || null,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "CREATE_WAREHOUSE",
      entityType: "Warehouse",
      entityId: warehouse.id,
      details: { name: warehouse.name, code: warehouse.code },
    });

    revalidatePath("/warehouses");
    revalidatePath("/stock-in");
    revalidatePath("/stock-out");
    revalidatePath("/stock-adjustments");

    return { success: true, data: warehouse };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create warehouse",
    };
  }
}

export async function updateWarehouseAction(id: string, input: WarehouseFormValues) {
  try {
    const user = await requirePermission("warehouses:manage");
    const parsed = warehouseSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
    }

    const duplicate = await prisma.warehouse.findFirst({
      where: {
        id: { not: id },
        OR: [
          { name: { equals: parsed.data.name, mode: "insensitive" } },
          { code: { equals: parsed.data.code, mode: "insensitive" } },
        ],
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: "Another warehouse is already using this name or code.",
      };
    }

    const updated = await prisma.warehouse.update({
      where: { id },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        location: parsed.data.location,
        description: parsed.data.description || null,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "UPDATE_WAREHOUSE",
      entityType: "Warehouse",
      entityId: updated.id,
      details: { name: updated.name, code: updated.code },
    });

    revalidatePath("/warehouses");
    revalidatePath("/products");
    revalidatePath("/dashboard");

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update warehouse",
    };
  }
}

export async function toggleWarehouseStatusAction(id: string, isActive: boolean) {
  try {
    const user = await requirePermission("warehouses:manage");

    const updated = await prisma.warehouse.update({
      where: { id },
      data: { isActive },
    });

    await recordAuditLog({
      userId: user.id,
      action: isActive ? "ACTIVATE_WAREHOUSE" : "DEACTIVATE_WAREHOUSE",
      entityType: "Warehouse",
      entityId: id,
      details: { name: updated.name, code: updated.code, isActive },
    });

    revalidatePath("/warehouses");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update warehouse status",
    };
  }
}
