"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownToLine, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { stockInSchema, StockInFormValues } from "@/lib/validations/stock.schema";
import { recordStockInAction } from "@/actions/stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  purchasePrice: number;
  inventories: { warehouseId: string; quantity: number }[];
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface SupplierOption {
  id: string;
  companyName: string;
}

interface RecentStockInItem {
  id: string;
  referenceNo: string;
  productName: string;
  productSku: string;
  unit: string;
  warehouseCode: string;
  supplierName: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  transactionDate: string;
  performedByName: string;
}

export function StockInClient({
  products,
  warehouses,
  suppliers,
  recentStockIns,
}: {
  products: ProductOption[];
  warehouses: WarehouseOption[];
  suppliers: SupplierOption[];
  recentStockIns: RecentStockInItem[];
}) {
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId") || products[0]?.id || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayIso = new Date().toISOString().split("T")[0];

  const form = useForm<StockInFormValues>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      productId: preselectedProductId,
      warehouseId: warehouses[0]?.id || "",
      supplierId: suppliers[0]?.id || "",
      quantity: 10,
      unitPrice:
        products.find((p) => p.id === preselectedProductId)?.purchasePrice ?? 0,
      transactionDate: todayIso,
      notes: "",
    },
  });

  const watchedProductId = form.watch("productId");
  const watchedWarehouseId = form.watch("warehouseId");
  const watchedQuantity = Number(form.watch("quantity") || 0);

  const selectedProduct = products.find((p) => p.id === watchedProductId);
  const currentWarehouseStock =
    selectedProduct?.inventories.find((i) => i.warehouseId === watchedWarehouseId)
      ?.quantity ?? 0;

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    form.setValue("productId", pid, { shouldValidate: true });
    const prod = products.find((p) => p.id === pid);
    if (prod) {
      form.setValue("unitPrice", prod.purchasePrice);
    }
  };

  const onSubmit = async (values: StockInFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await recordStockInAction(values);
      if (!res.success) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        `Stock In recorded (${res.data?.referenceNo}). New balance: ${res.data?.newStock}`
      );
      form.setValue("quantity", 10);
      form.setValue("notes", "");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock In (Receiving)"
        description="Record incoming supplier deliveries and atomically increment warehouse stock quantities."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
              New Stock Receipt
            </CardTitle>
            <CardDescription>
              Select product, destination warehouse, supplier, and quantity received.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product *</Label>
                <select
                  value={watchedProductId}
                  onChange={handleProductChange}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.productId && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.productId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Destination Warehouse *</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm"
                  {...form.register("warehouseId")}
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Supplier *</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm"
                  {...form.register("supplierId")}
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Stock Preview Box */}
              {selectedProduct && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Current Warehouse Stock:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatNumber(currentWarehouseStock)} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-emerald-800 font-medium">
                    <span>Projected Balance After Receipt:</span>
                    <span className="font-mono font-bold">
                      {formatNumber(currentWarehouseStock + (watchedQuantity > 0 ? watchedQuantity : 0))}{" "}
                      {selectedProduct.unit}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity Received *</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    className="font-mono"
                    {...form.register("quantity")}
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-xs text-red-600">
                      {form.formState.errors.quantity.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Unit Cost (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="font-mono"
                    {...form.register("unitPrice")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Transaction Date *</Label>
                <Input type="date" {...form.register("transactionDate")} />
              </div>

              <div className="space-y-1.5">
                <Label>Delivery Notes / PO Reference</Label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Purchase Order #PO-2026-884, Invoice #INV-992"
                  {...form.register("notes")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {isSubmitting ? "Recording Transaction..." : "Confirm Stock In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Stock In Ledger */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Stock In Receipts</CardTitle>
            <CardDescription>
              Latest incoming stock transactions verified in the ledger
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Qty Added</TableHead>
                  <TableHead className="text-right">New Balance</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStockIns.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {item.referenceNo}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 text-xs">
                        {item.productName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {item.productSku}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.warehouseCode}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {item.supplierName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="success" className="font-mono">
                        +{formatNumber(item.quantity)} {item.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      {formatNumber(item.newStock)} {item.unit}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDateTime(item.transactionDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
