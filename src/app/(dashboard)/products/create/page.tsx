import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/components/products/product-form";

export const dynamic = "force-dynamic";

export default async function CreateProductPage() {
  await enforcePagePermission("products:manage");

  const [categories, warehouses] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Product"
        description="Add a new SKU to the master catalog and optionally allocate opening warehouse stock."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/products">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        }
      />

      <ProductForm categories={categories} warehouses={warehouses} />
    </div>
  );
}
