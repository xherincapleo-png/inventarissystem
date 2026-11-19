"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Truck, Search, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supplierSchema, SupplierFormValues } from "@/lib/validations/master.schema";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "@/actions/supplier.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";

interface SupplierItem {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  _count: {
    stockMovements: number;
  };
}

export function SuppliersClient({
  suppliers,
  canManage,
}: {
  suppliers: SupplierItem[];
  canManage: boolean;
}) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    form.reset({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (supplier: SupplierItem) => {
    setEditingSupplier(supplier);
    form.reset({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      const res = editingSupplier
        ? await updateSupplierAction(editingSupplier.id, values)
        : await createSupplierAction(values);

      if (!res.success) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        editingSupplier ? "Supplier updated successfully" : "Supplier created successfully"
      );
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    setIsSubmitting(true);
    try {
      const res = await deleteSupplierAction(deletingSupplier.id);
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Supplier removed.");
      }
      setDeletingSupplier(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Directory"
        description="Manage authorized vendors, procurement contacts, and incoming stock partners."
        actions={
          canManage ? (
            <Button onClick={openCreateModal} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Supplier
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search company, contact person, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-xs text-slate-500">
              Total <span className="font-semibold text-slate-900">{filtered.length}</span> suppliers
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No suppliers found"
              description="Register your suppliers to link incoming stock deliveries."
              action={
                canManage ? (
                  <Button onClick={openCreateModal} size="sm">
                    <Plus className="mr-1.5 h-4 w-4" /> Add Supplier
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Deliveries</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sup) => (
                  <TableRow key={sup.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {sup.companyName}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">
                      {sup.contactPerson}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{sup.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{sup.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                        <span>{sup.address}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {sup._count.stockMovements}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sup.isActive ? "success" : "secondary"}>
                        {sup.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(sup)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingSupplier(sup)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "Register New Supplier"}
        description="Enter vendor contact and location details."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input
                placeholder="Apex Silicon Distribution"
                {...form.register("companyName")}
              />
              {form.formState.errors.companyName && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.companyName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Contact Person *</Label>
              <Input
                placeholder="Robert Vance"
                {...form.register("contactPerson")}
              />
              {form.formState.errors.contactPerson && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.contactPerson.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="orders@supplier.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input
                placeholder="+1 (800) 555-0142"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Physical Address *</Label>
            <Textarea
              placeholder="Street address, city, state, postal code"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-xs text-red-600">
                {form.formState.errors.address.message}
              </p>
            )}
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
                : editingSupplier
                ? "Save Changes"
                : "Create Supplier"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={handleConfirmDelete}
        title="Delete or Archive Supplier"
        description={
          deletingSupplier
            ? `Are you sure you want to remove "${deletingSupplier.companyName}"? Suppliers with past stock-in deliveries will be safely archived to preserve audit history.`
            : ""
        }
        isLoading={isSubmitting}
      />
    </div>
  );
}
