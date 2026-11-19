import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  tx?: Prisma.TransactionClient;
}

export async function recordAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
  tx,
}: CreateAuditLogParams) {
  const client = tx ?? prisma;

  return client.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      details: details ? (details as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}
