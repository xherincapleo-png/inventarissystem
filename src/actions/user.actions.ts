"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import {
  createUserSchema,
  CreateUserFormValues,
  updateUserSchema,
  UpdateUserFormValues,
} from "@/lib/validations/user.schema";
import { recordAuditLog } from "@/lib/audit";

export async function createUserAction(input: CreateUserFormValues) {
  try {
    const admin = await requirePermission("users:manage");
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Invalid input",
      };
    }

    const data = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return {
        success: false,
        error: "A user with this email address already exists.",
      };
    }

    const roleRecord = await prisma.role.findUnique({
      where: { name: data.role },
    });

    if (!roleRecord) {
      return { success: false, error: "Selected role does not exist." };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        roleId: roleRecord.id,
        isActive: data.isActive,
      },
    });

    await recordAuditLog({
      userId: admin.id,
      action: "CREATE_USER",
      entityType: "User",
      entityId: created.id,
      details: { name: created.name, email: created.email, role: data.role },
    });

    revalidatePath("/users");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

export async function updateUserAction(input: UpdateUserFormValues) {
  try {
    const admin = await requirePermission("users:manage");
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Invalid input",
      };
    }

    const data = parsed.data;

    // Prevent Super Admin from deactivating their own account
    if (data.id === admin.id && !data.isActive) {
      return {
        success: false,
        error: "You cannot deactivate your own active session account.",
      };
    }

    const roleRecord = await prisma.role.findUnique({
      where: { name: data.role },
    });

    if (!roleRecord) {
      return { success: false, error: "Selected role not found." };
    }

    const updatePayload: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      roleId: roleRecord.id,
      isActive: data.isActive,
    };

    if (data.password && data.password.trim().length >= 8) {
      updatePayload.passwordHash = await bcrypt.hash(data.password.trim(), 12);
    }

    const updated = await prisma.user.update({
      where: { id: data.id },
      data: updatePayload,
    });

    await recordAuditLog({
      userId: admin.id,
      action: "UPDATE_USER",
      entityType: "User",
      entityId: updated.id,
      details: {
        name: updated.name,
        email: updated.email,
        role: data.role,
        isActive: updated.isActive,
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const admin = await requirePermission("users:manage");

    if (id === admin.id) {
      return {
        success: false,
        error: "You cannot delete your own currently logged-in account.",
      };
    }

    const target = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stockMovements: true,
            stockAdjustments: true,
          },
        },
      },
    });

    if (!target) {
      return { success: false, error: "User not found." };
    }

    const hasTransactions =
      target._count.stockMovements > 0 || target._count.stockAdjustments > 0;

    if (hasTransactions) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      await recordAuditLog({
        userId: admin.id,
        action: "DEACTIVATE_USER",
        entityType: "User",
        entityId: id,
        details: {
          email: target.email,
          reason: "User has historical stock ledger transactions; deactivated instead of hard-deleted.",
        },
      });

      revalidatePath("/users");
      return {
        success: true,
        message: "User has historical stock records and was safely deactivated.",
      };
    }

    await prisma.user.delete({ where: { id } });

    await recordAuditLog({
      userId: admin.id,
      action: "DELETE_USER",
      entityType: "User",
      entityId: id,
      details: { email: target.email },
    });

    revalidatePath("/users");
    return { success: true, message: "User permanently deleted." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}
