"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { categorySchema, CategoryFormValues } from "@/lib/validations/master.schema";
import { recordAuditLog } from "@/lib/audit";
import { slugify } from "@/lib/utils";

export async function createCategoryAction(input: CategoryFormValues) {
  try {
    const user = await requirePermission("categories:manage");
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
    }

    const slug = slugify(parsed.data.name);

    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: parsed.data.name, mode: "insensitive" } },
          { slug },
        ],
      },
    });

    if (existing) {
      return { success: false, error: "A category with this name already exists." };
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "CREATE_CATEGORY",
      entityType: "Category",
      entityId: category.id,
      details: { name: category.name, slug: category.slug },
    });

    revalidatePath("/categories");
    revalidatePath("/products");
    revalidatePath("/dashboard");

    return { success: true, data: category };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export async function updateCategoryAction(id: string, input: CategoryFormValues) {
  try {
    const user = await requirePermission("categories:manage");
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
    }

    const slug = slugify(parsed.data.name);

    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        OR: [
          { name: { equals: parsed.data.name, mode: "insensitive" } },
          { slug },
        ],
      },
    });

    if (duplicate) {
      return { success: false, error: "Another category with this name already exists." };
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
      },
    });

    await recordAuditLog({
      userId: user.id,
      action: "UPDATE_CATEGORY",
      entityType: "Category",
      entityId: updated.id,
      details: { name: updated.name },
    });

    revalidatePath("/categories");
    revalidatePath("/products");
    revalidatePath("/dashboard");

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const user = await requirePermission("categories:manage");

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      return { success: false, error: "Category not found." };
    }

    if (category._count.products > 0) {
      return {
        success: false,
        error: `Cannot delete "${category.name}" because ${category._count.products} product(s) are assigned to it. Reassign those products first.`,
      };
    }

    await prisma.category.delete({ where: { id } });

    await recordAuditLog({
      userId: user.id,
      action: "DELETE_CATEGORY",
      entityType: "Category",
      entityId: id,
      details: { name: category.name },
    });

    revalidatePath("/categories");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}
