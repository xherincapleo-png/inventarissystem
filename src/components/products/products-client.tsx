"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
} from "lucide-react";
import { toast } from "sonner";
import { deleteProductAction } from "@/actions/product.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export interface ProductListItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  currentStock: number;
  createdAt: string;
  category: {
    id: string;
    name: string;
  };
}

interface ProductsClientProps {
  products: ProductListItem[];
  categories: { id: string; name: string }[];
  canManage: boolean;
  canStockIn: boolean;
}

const PAGE_SIZE = 10;

export function ProductsClient({
  products,
  categories,
  canManage,
  canStockIn,
}: ProductsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [page, setPage] = useState(1);
  const [deletingProduct, setDeletingProduct] = useState<ProductListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" || p.category.id === selectedCategory;

      let matchesStock = true;
      if (stockFilter === "OUT_OF_STOCK") {
        matchesStock = p.currentStock === 0;
      } else if (stockFilter === "LOW_STOCK") {
        matchesStock = p.currentStock > 0 && p.currentStock <= p.minimumStock;
      } else if (stockFilter === "IN_STOCK") {
        matchesStock = p.currentStock > p.minimumStock;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const res = await deleteProductAction(deletingProduct.id);
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
      }
      setDeletingProduct(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        description="Search, filter, and manage SKUs, pricing, and multi-warehouse inventory levels."
        actions={
          canManage ? (
            <Button asChild size="sm">
              <Link href="/products/create">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Product
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by SKU, product name, or description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(
                    e.target.value as "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
                  );
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">Healthy Stock</option>
                <option value="LOW_STOCK">Low Stock (≤ Min)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {paginated.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {filtered.length}
              </span>{" "}
              products
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {paginated.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No matching products found"
              description="Try clearing your search or category filters, or add a new product to the catalog."
              action={
                canManage ? (
                  <Button asChild size="sm">
                    <Link href="/products/create">
                      <Plus className="mr-1.5 h-4 w-4" /> Create Product
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((p) => {
                    const isOut = p.currentStock === 0;
                    const isLow = p.currentStock <= p.minimumStock;

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                          <Link href={`/products/${p.id}`} className="hover:underline">
                            {p.sku}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/products/${p.id}`}
                            className="font-semibold text-slate-900 hover:text-indigo-600 block"
                          >
                            {p.name}
                          </Link>
                          {p.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                              {p.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.category.name}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600">
                          {formatCurrency(p.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium text-slate-900">
                          {formatCurrency(p.sellingPrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">
                          <span
                            className={
                              isOut
                                ? "text-red-600"
                                : isLow
                                ? "text-amber-600"
                                : "text-slate-900"
                            }
                          >
                            {formatNumber(p.currentStock)} {p.unit}
                          </span>
                          <span className="block text-[10px] font-normal text-slate-400">
                            Min: {p.minimumStock}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isOut ? (
                            <Badge variant="danger">Out of Stock</Badge>
                          ) : isLow ? (
                            <Badge variant="warning">Low Stock</Badge>
                          ) : (
                            <Badge variant="success">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {formatDate(p.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              title="View / Edit Details"
                            >
                              <Link href={`/products/${p.id}`}>
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            {canStockIn && (
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                title="Record Stock In"
                              >
                                <Link href={`/stock-in?productId=${p.id}`}>
                                  <ArrowDownToLine className="h-3.5 w-3.5 text-indigo-600" />
                                </Link>
                              </Button>
                            )}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingProduct(p)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                title="Delete or Archive Product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">
                  Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-slate-900">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        title="Delete or Archive Product"
        description={
          deletingProduct
            ? `Are you sure you want to remove "${deletingProduct.name}" (${deletingProduct.sku})? In compliance with business rules, products with historical stock movements are safely archived rather than hard-deleted.`
            : ""
        }
        confirmLabel="Confirm Remove"
        isLoading={isDeleting}
      />
    </div>
  );
}
