"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Tags, Search } from "lucide-react";
import { toast } from "sonner";
import { categorySchema, CategoryFormValues } from "@/lib/validations/master.schema";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/category.actions";
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
import { formatDate } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date | string;
  _count: {
    products: number;
  };
}

export function CategoriesClient({
  categories,
  canManage,
}: {
  categories: CategoryItem[];
  canManage: boolean;
}) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    form.reset({ name: "", description: "" });
    setModalOpen(true);
  };

  const openEditModal = (category: CategoryItem) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      const res = editingCategory
        ? await updateCategoryAction(editingCategory.id, values)
        : await createCategoryAction(values);

      if (!res.success) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        editingCategory ? "Category updated successfully" : "Category created successfully"
      );
      setModalOpen(false);
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCategoryAction(deletingCategory.id);
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(`Category "${deletingCategory.name}" deleted.`);
      }
      setDeletingCategory(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Organize your product catalog into structured classifications and track item counts."
        actions={
          canManage ? (
            <Button onClick={openCreateModal} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Category
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
                placeholder="Search categories by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900">{filtered.length}</span> categories
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="No categories found"
              description="Create your first category or adjust your search query."
              action={
                canManage ? (
                  <Button onClick={openCreateModal} size="sm">
                    <Plus className="mr-1.5 h-4 w-4" /> Create Category
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Created</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {cat.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {cat.slug}
                    </TableCell>
                    <TableCell className="max-w-md text-xs text-slate-600">
                      {cat.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="font-mono">
                        {cat._count.products} items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(cat.createdAt)}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(cat)}
                            title="Edit Category"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingCategory(cat)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Delete Category"
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

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create Category"}
        description="Define a product classification name and description."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Name *</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Networking & Infrastructure"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              placeholder="Describe the types of products in this category..."
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-red-600">
                {form.formState.errors.description.message}
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
                : editingCategory
                ? "Save Changes"
                : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description={
          deletingCategory
            ? `Are you sure you want to delete "${deletingCategory.name}"? Categories with assigned products cannot be deleted until their products are reassigned.`
            : ""
        }
        isLoading={isSubmitting}
      />
    </div>
  );
}
