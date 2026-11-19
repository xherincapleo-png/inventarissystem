"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Warehouse,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ProductForm } from "@/components/products/product-form";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

interface ProductDetailProps {
  product: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    categoryId: string;
    categoryName: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    minimumStock: number;
    imageUrl: string | null;
    isArchived: boolean;
    createdAt: string;
    inventories: {
      id: string;
      quantity: number;
      warehouse: {
        id: string;
        name: string;
        code: string;
        location: string;
      };
    }[];
    movements: {
      id: string;
      referenceNo: string;
      type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
      quantity: number;
      previousStock: number;
      newStock: number;
      warehouseCode: string;
      performedByName: string;
      notes: string | null;
      transactionDate: string;
    }[];
  };
  categories: { id: string; name: string }[];
  canManage: boolean;
  canStockIn: boolean;
  canStockOut: boolean;
}

export function ProductDetailClient({
  product,
  categories,
  canManage,
  canStockIn,
  canStockOut,
}: ProductDetailProps) {
  const [editing, setEditing] = useState(false);

  const totalStock = product.inventories.reduce((s, i) => s + i.quantity, 0);
  const isLowStock = totalStock <= product.minimumStock;

  if (editing && canManage) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Edit Product: ${product.name}`}
          description={`SKU: ${product.sku}`}
          actions={
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Product Overview
            </Button>
          }
        />
        <ProductForm
          categories={categories}
          initialData={product}
          onSuccess={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku} · Category: ${product.categoryName}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/products">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Catalog
              </Link>
            </Button>
            {canStockIn && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/stock-in?productId=${product.id}`}>
                  <ArrowDownToLine className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Stock In
                </Link>
              </Button>
            )}
            {canStockOut && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/stock-out?productId=${product.id}`}>
                  <ArrowUpFromLine className="mr-1.5 h-3.5 w-3.5 text-red-600" />
                  Stock Out
                </Link>
              </Button>
            )}
            {canManage && (
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit Product
              </Button>
            )}
          </>
        }
      />

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Total Stock on Hand</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-slate-900">
                {formatNumber(totalStock)} {product.unit}
              </span>
              <Badge
                variant={
                  totalStock === 0 ? "danger" : isLowStock ? "warning" : "success"
                }
              >
                {totalStock === 0
                  ? "Out of Stock"
                  : isLowStock
                  ? "Low Stock"
                  : "In Stock"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Minimum Threshold: {product.minimumStock} {product.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Purchase Cost</p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
              {formatCurrency(product.purchasePrice)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Total Cost Value: {formatCurrency(totalStock * product.purchasePrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Selling Price</p>
            <p className="mt-2 font-mono text-2xl font-bold text-indigo-600">
              {formatCurrency(product.sellingPrice)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Retail Value: {formatCurrency(totalStock * product.sellingPrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">Unit Margin</p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-600">
              {formatCurrency(product.sellingPrice - product.purchasePrice)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Created {formatDateTime(product.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Specification & Warehouse Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Specification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Product ID</span>
              <span className="font-mono text-slate-800">{product.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">SKU</span>
              <span className="font-mono font-semibold text-indigo-600">
                {product.sku}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Category</span>
              <span className="font-medium text-slate-900">
                {product.categoryName}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Unit of Measure</span>
              <span className="font-mono uppercase text-slate-800">
                {product.unit}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 block mb-1">Description</span>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {product.description || "No technical description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Breakdown by Warehouse</CardTitle>
                <CardDescription>
                  Current physical distribution across active warehouse locations
                </CardDescription>
              </div>
              <Warehouse className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse Code</TableHead>
                  <TableHead>Facility Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Available Qty</TableHead>
                  <TableHead className="text-right">Valuation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.inventories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-slate-500 py-6">
                      No warehouse inventory records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  product.inventories.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                        {inv.warehouse.code}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {inv.warehouse.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {inv.warehouse.location}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatNumber(inv.quantity)} {product.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-700">
                        {formatCurrency(inv.quantity * product.purchasePrice)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Product Stock Movement Ledger */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Transaction History</CardTitle>
              <CardDescription>
                Chronological audit log of Stock In, Stock Out, and Adjustments for this SKU
              </CardDescription>
            </div>
            <History className="h-4 w-4 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Qty Change</TableHead>
                <TableHead className="text-right">Previous</TableHead>
                <TableHead className="text-right">New Balance</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-xs text-slate-500 py-6">
                    No stock movements recorded for this product.
                  </TableCell>
                </TableRow>
              ) : (
                product.movements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {mov.referenceNo}
                    </TableCell>
                    <TableCell>
                      {mov.type === "STOCK_IN" && (
                        <Badge variant="success">
                          <ArrowDownToLine className="mr-1 h-3 w-3" /> Stock In
                        </Badge>
                      )}
                      {mov.type === "STOCK_OUT" && (
                        <Badge variant="danger">
                          <ArrowUpFromLine className="mr-1 h-3 w-3" /> Stock Out
                        </Badge>
                      )}
                      {mov.type === "ADJUSTMENT" && (
                        <Badge variant="warning">
                          <SlidersHorizontal className="mr-1 h-3 w-3" /> Adjustment
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {mov.warehouseCode}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">
                      {mov.type === "STOCK_IN" ? "+" : mov.type === "STOCK_OUT" ? "-" : "±"}
                      {formatNumber(mov.quantity)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500">
                      {formatNumber(mov.previousStock)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-900">
                      {formatNumber(mov.newStock)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {mov.performedByName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDateTime(mov.transactionDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
