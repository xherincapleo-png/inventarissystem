import React from "react";
import Link from "next/link";
import { format, subDays, startOfDay } from "date-fns";
import {
  Package,
  Boxes,
  AlertTriangle,
  Tags,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  TrendingUp,
  Activity,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/rbac";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { StockMovementChart, ChartDataPoint } from "@/components/dashboard/stock-movement-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await enforcePagePermission("dashboard:view");

  const [
    productsWithStock,
    totalCategories,
    recentMovements,
    recentAuditLogs,
    last14DaysMovements,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isArchived: false },
      include: {
        category: true,
        inventories: true,
        _count: { select: { stockMovements: true } },
      },
    }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.stockMovement.findMany({
      take: 8,
      orderBy: { transactionDate: "desc" },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        warehouse: { select: { name: true, code: true } },
        performedBy: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.stockMovement.findMany({
      where: {
        transactionDate: {
          gte: startOfDay(subDays(new Date(), 13)),
        },
      },
      orderBy: { transactionDate: "asc" },
    }),
  ]);

  // Compute KPI metrics
  const totalProducts = productsWithStock.length;
  let totalStockQuantity = 0;
  let totalInventoryValue = 0;

  const enrichedProducts = productsWithStock.map((p) => {
    const currentStock = p.inventories.reduce((sum, inv) => sum + inv.quantity, 0);
    totalStockQuantity += currentStock;
    totalInventoryValue += currentStock * Number(p.purchasePrice);
    return {
      ...p,
      currentStock,
      isLowStock: currentStock <= p.minimumStock,
    };
  });

  const lowStockProducts = enrichedProducts.filter((p) => p.isLowStock);

  // Top moving products by movement volume
  const movementVolumeByProduct = new Map<string, number>();
  for (const mov of last14DaysMovements) {
    movementVolumeByProduct.set(
      mov.productId,
      (movementVolumeByProduct.get(mov.productId) || 0) + mov.quantity
    );
  }

  const topMovingProducts = [...enrichedProducts]
    .map((p) => ({
      ...p,
      movedUnits: movementVolumeByProduct.get(p.id) || 0,
    }))
    .sort((a, b) => b.movedUnits - a.movedUnits || b._count.stockMovements - a._count.stockMovements)
    .slice(0, 5);

  // Build 14-day chart series
  const chartMap = new Map<string, ChartDataPoint>();
  for (let i = 13; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const key = format(day, "MMM dd");
    chartMap.set(key, {
      date: key,
      stockIn: 0,
      stockOut: 0,
      adjustments: 0,
    });
  }

  for (const mov of last14DaysMovements) {
    const key = format(new Date(mov.transactionDate), "MMM dd");
    const bucket = chartMap.get(key);
    if (bucket) {
      if (mov.type === "STOCK_IN") bucket.stockIn += mov.quantity;
      else if (mov.type === "STOCK_OUT") bucket.stockOut += mov.quantity;
      else bucket.adjustments += mov.quantity;
    }
  }

  const chartData = Array.from(chartMap.values());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Overview"
        description="Real-time inventory health, multi-warehouse stock velocity, and recent ledger activity."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/stock-in">
                <ArrowDownToLine className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                Record Stock In
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/products/create">
                <Package className="mr-1.5 h-3.5 w-3.5" />
                New Product
              </Link>
            </Button>
          </>
        }
      />

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Products</p>
                <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                  {formatNumber(totalProducts)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Valuation: <span className="font-mono font-medium text-slate-700">{formatCurrency(totalInventoryValue)}</span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Stock Quantity</p>
                <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                  {formatNumber(totalStockQuantity)}
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">
                  Across all active warehouses
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Boxes className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Low Stock Products</p>
                <p className="mt-2 font-mono text-2xl font-bold text-amber-600">
                  {formatNumber(lowStockProducts.length)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  At or below minimum threshold
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Categories</p>
                <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
                  {formatNumber(totalCategories)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Active product classifications
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Tags className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Top Moving Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Stock Movement Velocity (Last 14 Days)</CardTitle>
              <CardDescription>
                Daily volume of incoming receipts, outgoing dispatches, and inventory adjustments
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <StockMovementChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Moving Products</CardTitle>
                <CardDescription>Highest movement volume in the last 14 days</CardDescription>
              </div>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {topMovingProducts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <Link
                    href={`/products/${item.id}`}
                    className="truncate block text-xs font-semibold text-slate-900 hover:text-indigo-600"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono">{item.sku}</span>
                    <span>·</span>
                    <span>{item.category.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-indigo-600">
                    {formatNumber(item.movedUnits)} {item.unit}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Stock: {formatNumber(item.currentStock)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Banner Table (if any) */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-200/90">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>Low Stock Replenishment Alerts</CardTitle>
                <CardDescription>
                  Products where current warehouse quantity is less than or equal to the minimum threshold
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/reports?tab=low-stock">View Full Report</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Min Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.slice(0, 5).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-medium text-slate-600">
                      {p.sku}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      <Link href={`/products/${p.id}`} className="hover:text-indigo-600">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>{p.category.name}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600">
                      {formatNumber(p.currentStock)} {p.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-600">
                      {formatNumber(p.minimumStock)} {p.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.currentStock === 0 ? "danger" : "warning"}>
                        {p.currentStock === 0 ? "Out of Stock" : "Low Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/stock-in?productId=${p.id}`}>Restock</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Stock Movements & Recent System Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>Latest verified transactions across all warehouses</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/stock-history">
                Full Ledger <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {mov.referenceNo}
                    </TableCell>
                    <TableCell>
                      {mov.type === "STOCK_IN" && (
                        <Badge variant="success" className="gap-1">
                          <ArrowDownToLine className="h-3 w-3" /> Stock In
                        </Badge>
                      )}
                      {mov.type === "STOCK_OUT" && (
                        <Badge variant="danger" className="gap-1">
                          <ArrowUpFromLine className="h-3 w-3" /> Stock Out
                        </Badge>
                      )}
                      {mov.type === "ADJUSTMENT" && (
                        <Badge variant="warning" className="gap-1">
                          <SlidersHorizontal className="h-3 w-3" /> Adjustment
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 text-xs">
                        {mov.product.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {mov.product.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {mov.warehouse.code}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {mov.type === "STOCK_IN" ? "+" : mov.type === "STOCK_OUT" ? "-" : "±"}
                      {formatNumber(mov.quantity)} {mov.product.unit}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDateTime(mov.transactionDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Audit Trail</CardTitle>
                <CardDescription>Administrative & operational events</CardDescription>
              </div>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800">
                    {log.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {log.user?.name || "System"} · {log.entityType}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
