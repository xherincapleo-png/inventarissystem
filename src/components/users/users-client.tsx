"use client";

import React, { useState } from "react";
import { RoleType } from "@prisma/client";
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Search,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/actions/user.actions";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/utils";

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  movementsCount: number;
}

const ROLES: RoleType[] = ["SUPER_ADMIN", "ADMIN", "STAFF", "VIEWER"];

export function UsersClient({
  users,
  currentUserId,
}: {
  users: UserListItem[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("STAFF");
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("Password123!");
    setRole("STAFF");
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (u: UserListItem) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    setIsActive(u.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = editingUser
        ? await updateUserAction({
            id: editingUser.id,
            name,
            email,
            role,
            isActive,
            password,
          })
        : await createUserAction({
            name,
            email,
            password,
            role,
            isActive,
          });

      if (!res.success) {
        toast.error(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        editingUser ? "User updated successfully" : "User created successfully"
      );
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      const res = await deleteUserAction(deletingUser.id);
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "User removed.");
      }
      setDeletingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Role-Based Access Management"
        description="Provision accounts, assign RBAC roles, and enforce server-side module permissions."
        actions={
          <Button onClick={openCreateModal} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Create User
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-xs text-slate-500">
              Total <span className="font-semibold text-slate-900">{filtered.length}</span> accounts
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    <div className="font-mono text-xs text-slate-500">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.role === "SUPER_ADMIN"
                          ? "default"
                          : u.role === "ADMIN"
                          ? "success"
                          : u.role === "STAFF"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      {u.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "success" : "danger"}>
                      {u.isActive ? "Active" : "Deactivated"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {u.movementsCount}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(u)}
                        title="Edit User & Role"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {u.id !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingUser(u)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Delete or Deactivate User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Permissions Matrix Card */}
      <Card>
        <CardHeader>
          <CardTitle>RBAC Permission Matrix</CardTitle>
          <CardDescription>
            Server-enforced access control rules across all system roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r) => (
              <div
                key={r}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-bold text-slate-900">
                    {r.replace("_", " ")}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {ROLE_PERMISSIONS[r].length} scopes
                  </Badge>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {ROLE_PERMISSIONS[r].map((perm) => (
                    <li
                      key={perm}
                      className="flex items-center gap-2 text-xs text-slate-600"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="font-mono text-[11px]">{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit User Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Edit User Account" : "Create User Account"}
        description="Assign user credentials, RBAC role, and account status."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marcus Sterling"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Work Email *</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@nexus-ims.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              {editingUser
                ? "New Password (leave blank to keep current)"
                : "Initial Password *"}
            </Label>
            <Input
              type="password"
              required={!editingUser}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleType)}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Account Status</Label>
              <select
                value={isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Deactivated</option>
              </select>
            </div>
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
                : editingUser
                ? "Save Changes"
                : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        title="Delete or Deactivate User"
        description={
          deletingUser
            ? `Are you sure you want to remove "${deletingUser.name}" (${deletingUser.email})? Users who have performed historical stock transactions will be safely deactivated to preserve audit logs.`
            : ""
        }
        isLoading={isSubmitting}
      />
    </div>
  );
}
