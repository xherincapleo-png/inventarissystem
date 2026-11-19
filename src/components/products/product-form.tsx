"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { productFormSchema, ProductFormValues } from "@/lib/validations/product.schema";
import { createProductAction, updateProductAction } from "@/actions/product.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryOption {
  id: string;
  name: string;
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface ProductFormProps {
  categories: CategoryOption[];
  warehouses?: WarehouseOption[];
  initialData?: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    categoryId: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    minimumStock: number;
    imageUrl: string | null;
  };
  onSuccess?: () => void;
}

const COMMON_UNITS = ["pcs", "unit", "box", "set", "kg", "liter", "pack", "roll"];

export function ProductForm({
  categories,
  warehouses = [],
  initialData,
  onSuccess,
}: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: initialData?.sku || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || categories[0]?.id || "",
      unit: initialData?.unit || "pcs",
      purchasePrice: initialData?.purchasePrice ?? 0,
      sellingPrice: initialData?.sellingPrice ?? 0,
      minimumStock: initialData?.minimumStock ?? 10,
      imageUrl: initialData?.imageUrl || "",
      initialWarehouseId: warehouses[0]?.id || "",
      initialStock: 0,
    },
  });

  const generateSku = () => {
    const nameVal = form.getValues("name") || "PROD";
    const prefix = nameVal
      .replace(/[^A-Za-z0-9]/g, "")
      .substring(0, 4)
      .toUpperCase()
      .padEnd(3, "X");
    const rand = Math.floor(1000 + Math.random() * 9000);
    form.setValue("sku", `${prefix}-${rand}`, { shouldValidate: true });
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const res = isEditing
        ? await updateProductAction(initialData.id, values)
        : await createProductAction(values);

      if (!res.success) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        isEditing ? "Product updated successfully" : "Product created successfully"
      );

      if (onSuccess) {
        onSuccess();
        router.refresh();
      } else {
        router.push("/products");
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred while saving the product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Core Specifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Specifications</CardTitle>
            <CardDescription>
              Core identification, SKU code, category classification, and description.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. UltraSharp 27 4K USB-C Monitor"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sku">Unique SKU *</Label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={generateSku}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-generate
                    </button>
                  )}
                </div>
                <Input
                  id="sku"
                  placeholder="DISP-U2723QE-4K"
                  className="font-mono uppercase"
                  {...form.register("sku")}
                />
                {form.formState.errors.sku && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.sku.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">Category *</Label>
                <select
                  id="categoryId"
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600"
                  {...form.register("categoryId")}
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.categoryId && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit">Unit of Measure *</Label>
                <select
                  id="unit"
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600"
                  {...form.register("unit")}
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u.toUpperCase()}
                    </option>
                  ))}
                </select>
                {form.formState.errors.unit && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.unit.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Technical specifications, model number, warranty notes..."
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">Product Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                placeholder="https://images.unsplash.com/..."
                {...form.register("imageUrl")}
              />
              {form.formState.errors.imageUrl && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.imageUrl.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Pricing & Thresholds */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Thresholds</CardTitle>
              <CardDescription>
                Unit cost, selling price, and low-stock alert threshold.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice">Purchase Cost (USD) *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className="font-mono"
                  {...form.register("purchasePrice")}
                />
                {form.formState.errors.purchasePrice && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.purchasePrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sellingPrice">Selling Price (USD) *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className="font-mono"
                  {...form.register("sellingPrice")}
                />
                {form.formState.errors.sellingPrice && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.sellingPrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minimumStock">Minimum Stock Alert Threshold *</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  step="1"
                  min="0"
                  className="font-mono"
                  {...form.register("minimumStock")}
                />
                <p className="text-[11px] text-slate-500">
                  Triggers Low Stock alert when total stock is ≤ this number.
                </p>
                {form.formState.errors.minimumStock && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.minimumStock.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {!isEditing && warehouses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Initial Opening Stock</CardTitle>
                <CardDescription>
                  Optionally allocate opening inventory to a warehouse now.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="initialWarehouseId">Warehouse</Label>
                  <select
                    id="initialWarehouseId"
                    className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm"
                    {...form.register("initialWarehouseId")}
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="initialStock">Opening Quantity</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    min="0"
                    step="1"
                    className="font-mono"
                    {...form.register("initialStock")}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        {!onSuccess && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/products")}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-1.5 h-4 w-4" />
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Save Product Changes"
            : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
