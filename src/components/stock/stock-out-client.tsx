"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpFromLine, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { stockOutSchema, StockOutFormValues } from "@/lib/validations/stock.schema";
import { recordStockOutAction } from "@/actions/stock.actions";
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

interface RecentStockOutItem {
  id: string;
  referenceNo: string;
  productName: string;
  productSku: string;
  unit: string;
  warehouseCode: string;
  destination: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  transactionDate: string;
  performedByName: string;
}

export function StockOutClient({
  products,
  warehouses,
  recentStockOuts,
}: {
  products: ProductOption[];
  warehouses: WarehouseOption[];
  recentStockOuts: RecentStockOutItem[];
}) {
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId") || products[0]?.id || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayIso = new Date().toISOString().split("T")[0];

  const form = useForm<StockOutFormValues>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      productId: preselectedProductId,
      warehouseId: warehouses[0]?.id || "",
      quantity: 1,
      destination: "",
      transactionDate: todayIso,
      notes: "",
    },
  });

  const watchedProductId = form.watch("productId");
  const watchedWarehouseId = form.watch("warehouseId");
  const watchedQuantity = Number(form.watch("quantity") || 0);

  const selectedProduct = products.find((p) => p.id === watchedProductId);
  const availableStock =
    selectedProduct?.inventories.find((i) => i.warehouseId === watchedWarehouseId)
      ?.quantity ?? 0;

  const exceedsAvailable = watchedQuantity > availableStock;

  const onSubmit = async (values: StockOutFormValues) => {
    if (values.quantity > availableStock) {
      toast.error(
        `Cannot dispatch ${values.quantity} units. Only ${availableStock} available in this warehouse.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordStockOutAction(values);
      if (!res.success) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        `Stock Out dispatched (${res.data?.referenceNo}). Remaining stock: ${res.data?.newStock}`
      );
      form.setValue("quantity", 1);
      form.setValue("destination", "");
      form.setValue("notes", "");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Out (Dispatch & Fulfillment)"
        description="Record outgoing inventory dispatches with strict server-side available stock enforcement."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-red-600" />
              Dispatch Outgoing Stock
            </CardTitle>
            <CardDescription>
              Select product, source warehouse, quantity, and destination.
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
                <Label>Source Warehouse *</Label>
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

              {/* Real-time Available Stock Guard Box */}
              {selectedProduct && (
                <div
                  className={`rounded-lg border p-3 text-xs ${
                    exceedsAvailable || availableStock === 0
                      ? "border-red-200 bg-red-50/70 text-red-900"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex justify-between">
                    <span>Available in Warehouse:</span>
                    <span className="font-mono font-bold">
                      {formatNumber(availableStock)} {selectedProduct.unit}
                    </span>
                  </div>
                  {exceedsAvailable ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-red-600 font-semibold">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Requested quantity exceeds available stock!</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex justify-between text-slate-600">
                      <span>Remaining After Dispatch:</span>
                      <span className="font-mono font-semibold">
                        {formatNumber(Math.max(0, availableStock - watchedQuantity))}{" "}
                        {selectedProduct.unit}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantity to Dispatch *</Label>
                  <Input
                    type="number"
                    min="1"
                    max={Math.max(1, availableStock)}
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
                  <Label>Dispatch Date *</Label>
                  <Input type="date" {...form.register("transactionDate")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Destination / Purpose *</Label>
                <Input
                  placeholder="e.g. Client Order #SO-10492 or Internal IT Deployment"
                  {...form.register("destination")}
                />
                {form.formState.errors.destination && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.destination.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Dispatch Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Carrier tracking number, requisition ticket, or handling notes..."
                  {...form.register("notes")}
                />
              </div>

              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={isSubmitting || exceedsAvailable || availableStock === 0}
              >
                <Send className="mr-1.5 h-4 w-4" />
                {isSubmitting ? "Processing Dispatch..." : "Confirm Stock Out"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Stock Outs Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Outgoing Dispatches</CardTitle>
            <CardDescription>
              Latest Stock Out transactions recorded across warehouses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Destination / Purpose</TableHead>
                  <TableHead className="text-right">Dispatched</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStockOuts.map((item) => (
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
                    <TableCell className="text-xs text-slate-700 max-w-[200px] truncate">
                      {item.destination || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="danger" className="font-mono">
                        -{formatNumber(item.quantity)} {item.unit}
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
