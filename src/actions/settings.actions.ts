"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import {
  companySettingsSchema,
  CompanySettingsValues,
  profileUpdateSchema,
  ProfileUpdateValues,
} from "@/lib/validations/user.schema";
import { recordAuditLog } from "@/lib/audit";

export async function updateCompanySettingsAction(input: CompanySettingsValues) {
  try {
    const user = await requirePermission("settings:manage");
    const parsed = companySettingsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed",
      };
    }

    const data = parsed.data;

    const updated = await prisma.systemSetting.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        ...data,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "UPDATE_SYSTEM_SETTINGS",
      entityType: "SystemSetting",
      entityId: "default",
      details: {
        companyName: updated.companyName,
        currency: updated.currency,
        defaultMinStock: updated.defaultMinStock,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

export async function updateProfileAction(input: ProfileUpdateValues) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = profileUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Validation failed",
      };
    }

    const data = parsed.data;
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser) {
      return { success: false, error: "User record not found." };
    }

    const updatePayload: { name: string; passwordHash?: string } = {
      name: data.name,
    };

    if (data.newPassword && data.newPassword.trim().length > 0) {
      if (!data.currentPassword) {
        return {
          success: false,
          error: "Please enter your current password to set a new password.",
        };
      }

      const validCurrent = await bcrypt.compare(
        data.currentPassword,
        dbUser.passwordHash
      );

      if (!validCurrent) {
        return {
          success: false,
          error: "Current password is incorrect.",
        };
      }

      updatePayload.passwordHash = await bcrypt.hash(data.newPassword, 12);
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: updatePayload,
    });

    await recordAuditLog({
      userId: dbUser.id,
      action: "UPDATE_OWN_PROFILE",
      entityType: "User",
      entityId: dbUser.id,
      details: {
        nameChanged: data.name !== dbUser.name,
        passwordChanged: !!updatePayload.passwordHash,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}
