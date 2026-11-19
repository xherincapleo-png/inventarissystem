"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  stockAdjustmentSchema,
  StockAdjustmentFormValues,
} from "@/lib/validations/stock.schema";
import { recordStockAdjustmentAction } from "@/actions/stock.actions";
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
import { formatDateTime, formatNumber } from "@/lib/utils";

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  inventories: { warehouseId: string; quantity: number }[];
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface AdjustmentRecord {
  id: string;
  referenceNo: string;
  productName: string;
  productSku: string;
  unit: string;
  warehouseCode: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  reason: string;
  notes: string | null;
  performedByName: string;
  adjustedAt: string;
}

const ADJUSTMENT_REASONS = [
  "Physical Cycle Count Reconciliation",
  "Damaged / Defective Goods Write-Off",
  "Unrecorded Shrinkage / Loss",
  "Found Surplus Inventory in Bin",
  "Quality Assurance Quarantine",
  "Data Entry Correction",
];

export function StockAdjustmentsClient({
  products,
  warehouses,
  adjustments,
}: {
  products: ProductOption[];
  warehouses: WarehouseOption[];
  adjustments: AdjustmentRecord[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: products[0]?.id || "",
      warehouseId: warehouses[0]?.id || "",
      newQuantity: 0,
      reason: ADJUSTMENT_REASONS[0],
      notes: "",
    },
  });

  const watchedProductId = form.watch("productId");
  const watchedWarehouseId = form.watch("warehouseId");
  const watchedNewQty = Number(form.watch("newQuantity") || 0);

  const selectedProduct = products.find((p) => p.id === watchedProductId);
  const currentQty =
    selectedProduct?.inventories.find((i) => i.warehouseId === watchedWarehouseId)
      ?.quantity ?? 0;

  useEffect(() => {
    form.setValue("newQuantity", currentQty);
  }, [watchedProductId, watchedWarehouseId, currentQty, form]);

  const delta = watchedNewQty - currentQty;

  const onSubmit = async (values: StockAdjustmentFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await recordStockAdjustmentAction(values);
      if (!res.success) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        `Adjustment ${res.data?.referenceNo} recorded (${
          (res.data?.difference ?? 0) > 0 ? "+" : ""
        }${res.data?.difference})`
      );
      form.setValue("notes", "");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Adjustments & Cycle Counts"
        description="Reconcile physical inventory counts, record adjustment reasons, and maintain full variance history."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-600" />
              Record Stock Adjustment
            </CardTitle>
            <CardDescription>
              Set the verified physical quantity and document the reason for variance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product *</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm"
                  {...form.register("productId")}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Warehouse *</Label>
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

              {selectedProduct && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Recorded System Quantity:</span>
                    <span className="font-mono font-bold">
                      {formatNumber(currentQty)} {selectedProduct.unit}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Net Variance (Delta):</span>
                    <span
                      className={`font-mono font-bold ${
                        delta > 0
                          ? "text-emerald-600"
                          : delta < 0
                          ? "text-red-600"
                          : "text-slate-500"
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta} {selectedProduct.unit}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>New Physical Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  className="font-mono"
                  {...form.register("newQuantity")}
                />
                {form.formState.errors.newQuantity && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.newQuantity.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Adjustment Reason *</Label>
                <select
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm"
                  {...form.register("reason")}
                >
                  {ADJUSTMENT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Audit Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Inspector notes, bin number, or incident ticket ID..."
                  {...form.register("notes")}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || delta === 0}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {isSubmitting ? "Saving Adjustment..." : "Commit Stock Adjustment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stock Adjustment Audit History</CardTitle>
            <CardDescription>
              Historical log of all manual quantity reconciliations and cycle count variances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">New</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-500">
                      No stock adjustments recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {adj.referenceNo}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900 text-xs">
                          {adj.productName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {adj.productSku}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {adj.warehouseCode}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-500">
                        {formatNumber(adj.previousQuantity)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                        {formatNumber(adj.newQuantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={adj.difference > 0 ? "success" : "danger"}
                          className="font-mono"
                        >
                          {adj.difference > 0 ? `+${adj.difference}` : adj.difference}{" "}
                          {adj.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 max-w-[180px] truncate">
                        {adj.reason}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDateTime(adj.adjustedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
