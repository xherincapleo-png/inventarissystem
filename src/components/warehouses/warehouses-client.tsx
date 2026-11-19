"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Pencil,
  Warehouse as WarehouseIcon,
  MapPin,
  Boxes,
  Eye,
  Power,
} from "lucide-react";
import { toast } from "sonner";
import { warehouseSchema, WarehouseFormValues } from "@/lib/validations/master.schema";
import {
  createWarehouseAction,
  updateWarehouseAction,
  toggleWarehouseStatusAction,
} from "@/actions/warehouse.actions";
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
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface WarehouseInventoryRecord {
  id: string;
  quantity: number;
  product: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    minimumStock: number;
  };
}

export interface WarehouseWithStock {
  id: string;
  name: string;
  code: string;
  location: string;
  description: string | null;
  isActive: boolean;
  inventories: WarehouseInventoryRecord[];
}

export function WarehousesClient({
  warehouses,
  canManage,
}: {
  warehouses: WarehouseWithStock[];
  canManage: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseWithStock | null>(null);
  const [inspectingWarehouse, setInspectingWarehouse] = useState<WarehouseWithStock | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "",
      code: "",
      location: "",
      description: "",
    },
  });

  const openCreateModal = () => {
    setEditingWarehouse(null);
    form.reset({
      name: "",
      code: "",
      location: "",
      description: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (wh: WarehouseWithStock) => {
    setEditingWarehouse(wh);
    form.reset({
      name: wh.name,
      code: wh.code,
      location: wh.location,
      description: wh.description || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: WarehouseFormValues) => {
    setIsSubmitting(true);
    try {
      const res = editingWarehouse
        ? await updateWarehouseAction(editingWarehouse.id, values)
        : await createWarehouseAction(values);

      if (!res.success) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        editingWarehouse ? "Warehouse updated successfully" : "Warehouse created successfully"
      );
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (wh: WarehouseWithStock) => {
    const res = await toggleWarehouseStatusAction(wh.id, !wh.isActive);
    if (!res.success) {
      toast.error(res.error);
    } else {
      toast.success(`Warehouse ${wh.isActive ? "deactivated" : "activated"}.`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Locations"
        description="Manage storage facilities and track real-time inventory quantities per warehouse."
        actions={
          canManage ? (
            <Button onClick={openCreateModal} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Warehouse
            </Button>
          ) : undefined
        }
      />

      {warehouses.length === 0 ? (
        <EmptyState
          icon={WarehouseIcon}
          title="No warehouses configured"
          description="Add a warehouse facility to start allocating inventory."
          action={
            canManage ? (
              <Button onClick={openCreateModal} size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Add Warehouse
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {warehouses.map((wh) => {
            const activeSkus = wh.inventories.filter((i) => i.quantity > 0);
            const totalUnits = wh.inventories.reduce((s, i) => s + i.quantity, 0);
            const totalValue = wh.inventories.reduce(
              (s, i) => s + i.quantity * i.product.purchasePrice,
              0
            );

            return (
              <Card key={wh.id} className="flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {wh.code}
                        </span>
                        <Badge variant={wh.isActive ? "success" : "secondary"}>
                          {wh.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{wh.name}</CardTitle>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(wh)}
                          title="Edit Warehouse"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(wh)}
                          title={wh.isActive ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-1.5 pt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{wh.location}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px]">
                    {wh.description || "No facility description provided."}
                  </p>

                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        SKUs Stored
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                        {formatNumber(activeSkus.length)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Total Units
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                        {formatNumber(totalUnits)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Cost Value
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-indigo-600">
                        {formatCurrency(totalValue)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setInspectingWarehouse(wh)}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Inspect Warehouse Inventory
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWarehouse ? "Edit Warehouse" : "Create Warehouse"}
        description="Configure warehouse code, location, and operational details."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Warehouse Name *</Label>
              <Input
                placeholder="West Coast Distribution Hub"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Facility Code *</Label>
              <Input
                placeholder="WH-SFO-01"
                className="font-mono uppercase"
                {...form.register("code")}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Location / Address *</Label>
            <Input
              placeholder="Oakland Port Industrial Park, CA"
              {...form.register("location")}
            />
            {form.formState.errors.location && (
              <p className="text-xs text-red-600">
                {form.formState.errors.location.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Primary receiving and fulfillment facility..."
              {...form.register("description")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingWarehouse
                ? "Save Changes"
                : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Warehouse Inventory Breakdown Modal */}
      <Modal
        open={!!inspectingWarehouse}
        onClose={() => setInspectingWarehouse(null)}
        title={
          inspectingWarehouse
            ? `${inspectingWarehouse.name} (${inspectingWarehouse.code})`
            : "Warehouse Inventory"
        }
        description={inspectingWarehouse?.location}
        maxWidth="2xl"
      >
        {inspectingWarehouse && (
          <div className="space-y-4">
            {inspectingWarehouse.inventories.filter((i) => i.quantity > 0).length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="No stock currently stored"
                description="Record a Stock In transaction to allocate products to this warehouse."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectingWarehouse.inventories
                    .filter((i) => i.quantity > 0)
                    .map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          {inv.product.sku}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {inv.product.name}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatNumber(inv.quantity)} {inv.product.unit}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600">
                          {formatCurrency(inv.product.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold text-slate-900">
                          {formatCurrency(inv.quantity * inv.product.purchasePrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
