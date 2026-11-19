"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Eye,
  History,
  RotateCcw,
} from "lucide-react";
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
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export interface StockHistoryItem {
  id: string;
  referenceNo: string;
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  warehouseName: string;
  warehouseCode: string;
  supplierName: string | null;
  destination: string | null;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitPrice: number | null;
  notes: string | null;
  performedByName: string;
  performedByEmail: string;
  transactionDate: string;
}

export function StockHistoryClient({
  movements,
  products,
}: {
  movements: StockHistoryItem[];
  products: { id: string; sku: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMovement, setSelectedMovement] = useState<StockHistoryItem | null>(null);

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const matchesSearch =
        m.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
        m.productName.toLowerCase().includes(search.toLowerCase()) ||
        m.productSku.toLowerCase().includes(search.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(search.toLowerCase()));

      const matchesProduct =
        productFilter === "ALL" || m.productId === productFilter;

      const matchesType = typeFilter === "ALL" || m.type === typeFilter;

      const txDate = new Date(m.transactionDate);
      const matchesFrom = !dateFrom || txDate >= new Date(`${dateFrom}T00:00:00`);
      const matchesTo = !dateTo || txDate <= new Date(`${dateTo}T23:59:59`);

      return (
        matchesSearch &&
        matchesProduct &&
        matchesType &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [movements, search, productFilter, typeFilter, dateFrom, dateTo]);

  const resetFilters = () => {
    setSearch("");
    setProductFilter("ALL");
    setTypeFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movement Ledger"
        description="Complete chronological history of all Stock In receipts, Stock Out dispatches, and Adjustments."
        actions={
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset Filters
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Ref #, SKU, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm"
            >
              <option value="ALL">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="STOCK_IN">Stock In (+)</option>
              <option value="STOCK_OUT">Stock Out (-)</option>
              <option value="ADJUSTMENT">Adjustment (±)</option>
            </select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From Date"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To Date"
            />
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={History}
              title="No stock transactions match your filters"
              description="Try expanding your date range or clearing the product filter."
              action={
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear All Filters
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">New Stock</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs font-medium text-slate-700">
                      {m.referenceNo}
                    </TableCell>
                    <TableCell>
                      {m.type === "STOCK_IN" && (
                        <Badge variant="success">
                          <ArrowDownToLine className="mr-1 h-3 w-3" /> Stock In
                        </Badge>
                      )}
                      {m.type === "STOCK_OUT" && (
                        <Badge variant="danger">
                          <ArrowUpFromLine className="mr-1 h-3 w-3" /> Stock Out
                        </Badge>
                      )}
                      {m.type === "ADJUSTMENT" && (
                        <Badge variant="warning">
                          <SlidersHorizontal className="mr-1 h-3 w-3" /> Adjustment
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 text-xs">
                        {m.productName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {m.productSku}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.warehouseCode}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold">
                      {m.type === "STOCK_IN" ? "+" : m.type === "STOCK_OUT" ? "-" : "±"}
                      {formatNumber(m.quantity)} {m.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500">
                      {formatNumber(m.previousStock)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      {formatNumber(m.newStock)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {m.performedByName}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDateTime(m.transactionDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedMovement(m)}
                        title="View Transaction Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Modal
        open={!!selectedMovement}
        onClose={() => setSelectedMovement(null)}
        title={
          selectedMovement
            ? `Transaction ${selectedMovement.referenceNo}`
            : "Transaction Details"
        }
        description="Verified immutable stock ledger entry"
      >
        {selectedMovement && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div>
                <span className="text-slate-400 block">Transaction Type</span>
                <span className="font-semibold text-slate-900">
                  {selectedMovement.type.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Timestamp</span>
                <span className="font-medium text-slate-900">
                  {formatDateTime(selectedMovement.transactionDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Product</span>
                <span className="font-semibold text-slate-900">
                  {selectedMovement.productName} ({selectedMovement.productSku})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Warehouse</span>
                <span className="font-semibold text-slate-900">
                  {selectedMovement.warehouseName} ({selectedMovement.warehouseCode})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 p-3 text-center">
              <div>
                <span className="text-slate-400 block">Previous Stock</span>
                <span className="font-mono text-sm font-bold text-slate-700">
                  {formatNumber(selectedMovement.previousStock)} {selectedMovement.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Movement Qty</span>
                <span className="font-mono text-sm font-bold text-indigo-600">
                  {selectedMovement.quantity} {selectedMovement.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">New Stock</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {formatNumber(selectedMovement.newStock)} {selectedMovement.unit}
                </span>
              </div>
            </div>

            {selectedMovement.supplierName && (
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500">Supplier</span>
                <span className="font-medium text-slate-900">
                  {selectedMovement.supplierName}
                </span>
              </div>
            )}

            {selectedMovement.destination && (
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500">Destination / Purpose</span>
                <span className="font-medium text-slate-900">
                  {selectedMovement.destination}
                </span>
              </div>
            )}

            {selectedMovement.unitPrice !== null && (
              <div className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500">Unit Valuation</span>
                <span className="font-mono font-medium text-slate-900">
                  {formatCurrency(selectedMovement.unitPrice)}
                </span>
              </div>
            )}

            <div className="flex justify-between border-b border-slate-100 py-1.5">
              <span className="text-slate-500">Performed By</span>
              <span className="font-medium text-slate-900">
                {selectedMovement.performedByName} ({selectedMovement.performedByEmail})
              </span>
            </div>

            <div className="pt-1">
              <span className="text-slate-500 block mb-1">Transaction Notes</span>
              <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-slate-700">
                {selectedMovement.notes || "No additional notes recorded."}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
