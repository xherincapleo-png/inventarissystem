"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  FileText,
  Download,
  BarChart3,
  AlertTriangle,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCsv, exportToExcel, exportToPdf } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export interface ReportProductItem {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStock: number;
  currentStock: number;
}

export interface ReportMovementItem {
  id: string;
  referenceNo: string;
  type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
  sku: string;
  productName: string;
  unit: string;
  warehouseCode: string;
  supplierOrDestination: string;
  quantity: number;
  unitPrice: number;
  performedBy: string;
  transactionDate: string;
}

type ReportTab = "inventory" | "stock-in" | "stock-out" | "low-stock" | "valuation";

export function ReportsClient({
  products,
  movements,
}: {
  products: ReportProductItem[];
  movements: ReportMovementItem[];
}) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ReportTab) || "inventory";
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Filtered movements by date
  const dateFilteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const d = new Date(m.transactionDate);
      const okFrom = !dateFrom || d >= new Date(`${dateFrom}T00:00:00`);
      const okTo = !dateTo || d <= new Date(`${dateTo}T23:59:59`);
      return okFrom && okTo;
    });
  }, [movements, dateFrom, dateTo]);

  const stockInRows = useMemo(
    () => dateFilteredMovements.filter((m) => m.type === "STOCK_IN"),
    [dateFilteredMovements]
  );

  const stockOutRows = useMemo(
    () => dateFilteredMovements.filter((m) => m.type === "STOCK_OUT"),
    [dateFilteredMovements]
  );

  const lowStockRows = useMemo(
    () => products.filter((p) => p.currentStock <= p.minimumStock),
    [products]
  );

  // Totals for Valuation
  const totalCostValuation = products.reduce(
    (sum, p) => sum + p.currentStock * p.purchasePrice,
    0
  );
  const totalRetailValuation = products.reduce(
    (sum, p) => sum + p.currentStock * p.sellingPrice,
    0
  );
  const projectedGrossMargin = totalRetailValuation - totalCostValuation;

  const buildExportPayload = () => {
    const timestamp = new Date().toISOString().split("T")[0];

    if (activeTab === "inventory") {
      const json = products.map((p) => ({
        SKU: p.sku,
        Product: p.name,
        Category: p.categoryName,
        Unit: p.unit,
        Current_Stock: p.currentStock,
        Min_Threshold: p.minimumStock,
        Status:
          p.currentStock === 0
            ? "Out of Stock"
            : p.currentStock <= p.minimumStock
            ? "Low Stock"
            : "In Stock",
      }));
      const headers = ["SKU", "Product", "Category", "Unit", "Current Stock", "Min Threshold", "Status"];
      const body = json.map((r) => [
        r.SKU,
        r.Product,
        r.Category,
        r.Unit,
        r.Current_Stock,
        r.Min_Threshold,
        r.Status,
      ]);
      return {
        filename: `inventory-report-${timestamp}`,
        title: "Master Inventory Status Report",
        json,
        headers,
        body,
      };
    }

    if (activeTab === "low-stock") {
      const json = lowStockRows.map((p) => ({
        SKU: p.sku,
        Product: p.name,
        Category: p.categoryName,
        Current_Stock: p.currentStock,
        Min_Threshold: p.minimumStock,
        Shortfall: Math.max(0, p.minimumStock - p.currentStock),
      }));
      const headers = ["SKU", "Product", "Category", "Current Stock", "Min Threshold", "Shortfall"];
      const body = json.map((r) => [
        r.SKU,
        r.Product,
        r.Category,
        r.Current_Stock,
        r.Min_Threshold,
        r.Shortfall,
      ]);
      return {
        filename: `low-stock-report-${timestamp}`,
        title: "Low Stock Replenishment Report",
        json,
        headers,
        body,
      };
    }

    if (activeTab === "valuation") {
      const json = products.map((p) => ({
        SKU: p.sku,
        Product: p.name,
        Category: p.categoryName,
        Quantity: p.currentStock,
        Unit_Cost: p.purchasePrice,
        Unit_Price: p.sellingPrice,
        Total_Cost_Value: Number((p.currentStock * p.purchasePrice).toFixed(2)),
        Total_Retail_Value: Number((p.currentStock * p.sellingPrice).toFixed(2)),
      }));
      const headers = [
        "SKU",
        "Product",
        "Category",
        "Qty",
        "Unit Cost",
        "Selling Price",
        "Cost Valuation",
        "Retail Valuation",
      ];
      const body = json.map((r) => [
        r.SKU,
        r.Product,
        r.Category,
        r.Quantity,
        `$${r.Unit_Cost.toFixed(2)}`,
        `$${r.Unit_Price.toFixed(2)}`,
        `$${r.Total_Cost_Value.toFixed(2)}`,
        `$${r.Total_Retail_Value.toFixed(2)}`,
      ]);
      return {
        filename: `stock-valuation-report-${timestamp}`,
        title: "Inventory Financial Valuation Report",
        json,
        headers,
        body,
      };
    }

    const targetRows = activeTab === "stock-in" ? stockInRows : stockOutRows;
    const json = targetRows.map((m) => ({
      Reference: m.referenceNo,
      SKU: m.sku,
      Product: m.productName,
      Warehouse: m.warehouseCode,
      Partner_Or_Destination: m.supplierOrDestination,
      Quantity: m.quantity,
      Unit_Value: m.unitPrice,
      Total_Value: Number((m.quantity * m.unitPrice).toFixed(2)),
      Performed_By: m.performedBy,
      Date: formatDateTime(m.transactionDate),
    }));
    const headers = [
      "Reference",
      "SKU",
      "Product",
      "Warehouse",
      activeTab === "stock-in" ? "Supplier" : "Destination",
      "Qty",
      "Total Value",
      "Date",
    ];
    const body = json.map((r) => [
      r.Reference,
      r.SKU,
      r.Product,
      r.Warehouse,
      r.Partner_Or_Destination,
      r.Quantity,
      `$${r.Total_Value.toFixed(2)}`,
      r.Date,
    ]);

    return {
      filename: `${activeTab}-report-${timestamp}`,
      title: activeTab === "stock-in" ? "Stock In Receipts Report" : "Stock Out Dispatches Report",
      json,
      headers,
      body,
    };
  };

  const handleExport = (formatType: "csv" | "excel" | "pdf") => {
    const payload = buildExportPayload();
    if (!payload.json.length) {
      toast.error("No rows available to export for the current report view.");
      return;
    }

    if (formatType === "csv") {
      exportToCsv(payload.filename, payload.json);
      toast.success("CSV report downloaded.");
    } else if (formatType === "excel") {
      exportToExcel(payload.filename, "Report", payload.json);
      toast.success("Excel (.xlsx) report downloaded.");
    } else {
      exportToPdf(
        payload.filename,
        payload.title,
        `Generated by NexusIMS on ${new Date().toLocaleString()}`,
        payload.headers,
        payload.body
      );
      toast.success("PDF report downloaded.");
    }
  };

  const TABS: { id: ReportTab; label: string; icon: React.ElementType }[] = [
    { id: "inventory", label: "Inventory Report", icon: Package },
    { id: "stock-in", label: "Stock In Report", icon: ArrowDownToLine },
    { id: "stock-out", label: "Stock Out Report", icon: ArrowUpFromLine },
    { id: "low-stock", label: "Low Stock Report", icon: AlertTriangle },
    { id: "valuation", label: "Stock Valuation", icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Executive Analytics"
        description="Generate, filter, and export inventory status, movement ledgers, and financial valuations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
            >
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
              Export Excel
            </Button>
            <Button size="sm" onClick={() => handleExport("pdf")}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Export PDF
            </Button>
          </div>
        }
      />

      {/* Valuation Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">
              Total Inventory Cost Valuation
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
              {formatCurrency(totalCostValuation)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Based on unit purchase cost × stock on hand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">
              Total Retail Selling Valuation
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-indigo-600">
              {formatCurrency(totalRetailValuation)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Based on unit selling price × stock on hand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500">
              Estimated Unrealized Gross Margin
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-600">
              {formatCurrency(projectedGrossMargin)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Spread between retail and purchase cost valuation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Selector Tabs & Date Range Filters */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {(activeTab === "stock-in" || activeTab === "stock-out") && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Date Range:</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-36 text-xs"
                />
                <span className="text-slate-400">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-36 text-xs"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {activeTab === "inventory" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Min Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                      {p.sku}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {p.name}
                    </TableCell>
                    <TableCell>{p.categoryName}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatNumber(p.currentStock)} {p.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500">
                      {formatNumber(p.minimumStock)} {p.unit}
                    </TableCell>
                    <TableCell>
                      {p.currentStock === 0 ? (
                        <Badge variant="danger">Out of Stock</Badge>
                      ) : p.currentStock <= p.minimumStock ? (
                        <Badge variant="warning">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">Healthy</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === "low-stock" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Min Threshold</TableHead>
                  <TableHead className="text-right">Recommended Order</TableHead>
                  <TableHead>Urgency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-500">
                      All products are above their minimum stock threshold.
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockRows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                        {p.sku}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {p.name}
                      </TableCell>
                      <TableCell>{p.categoryName}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-red-600">
                        {formatNumber(p.currentStock)} {p.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {formatNumber(p.minimumStock)} {p.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-indigo-600">
                        +{formatNumber(Math.max(10, p.minimumStock * 2 - p.currentStock))} {p.unit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.currentStock === 0 ? "danger" : "warning"}>
                          {p.currentStock === 0 ? "Critical (Depleted)" : "Replenish Soon"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {activeTab === "valuation" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">On-Hand Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Total Cost Value</TableHead>
                  <TableHead className="text-right">Total Retail Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                      {p.sku}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {p.name}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatNumber(p.currentStock)} {p.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-600">
                      {formatCurrency(p.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-600">
                      {formatCurrency(p.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      {formatCurrency(p.currentStock * p.purchasePrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-indigo-600">
                      {formatCurrency(p.currentStock * p.sellingPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {(activeTab === "stock-in" || activeTab === "stock-out") && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>
                    {activeTab === "stock-in" ? "Supplier" : "Destination"}
                  </TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === "stock-in" ? stockInRows : stockOutRows).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {m.referenceNo}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-indigo-600">
                      {m.sku}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {m.productName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.warehouseCode}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {m.supplierOrDestination}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {activeTab === "stock-in" ? "+" : "-"}
                      {formatNumber(m.quantity)} {m.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {formatCurrency(m.quantity * m.unitPrice)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDateTime(m.transactionDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
