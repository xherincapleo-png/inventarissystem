import React from "react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission, hasPermission } from "@/lib/rbac";
import { SettingsClient } from "@/components/settings/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await enforcePagePermission("dashboard:view");
  const canManageSystem = hasPermission(user.role, "settings:manage");

  let settings = await prisma.systemSetting.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.systemSetting.create({
      data: { id: "default" },
    });
  }

  return (
    <SettingsClient
      companySettings={{
        companyName: settings.companyName,
        companyEmail: settings.companyEmail,
        companyPhone: settings.companyPhone,
        companyAddress: settings.companyAddress,
        currency: settings.currency,
        lowStockAlertGlobal: settings.lowStockAlertGlobal,
        defaultMinStock: settings.defaultMinStock,
      }}
      currentUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
      canManageSystem={canManageSystem}
    />
  );
}
