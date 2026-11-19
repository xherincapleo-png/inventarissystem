"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Boxes, Lock, Mail, ArrowRight, ShieldAlert, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";

const DEMO_ACCOUNTS = [
  {
    role: "ADMIN UTAMA (RINA)",
    email: "admin@admin.com",
    password: "admin123",
    desc: "Akun Super Admin khusus (Akses Penuh ke Semua Modul)",
  },
  {
    role: "SUPER ADMIN",
    email: "superadmin@nexus-ims.com",
    password: "Password123!",
    desc: "Full access, Users, Roles & Settings",
  },
  {
    role: "ADMIN",
    email: "admin@nexus-ims.com",
    password: "Password123!",
    desc: "Products, Stock, Suppliers, Warehouses, Reports",
  },
  {
    role: "STAFF",
    email: "staff@nexus-ims.com",
    password: "Password123!",
    desc: "Stock In, Stock Out, View Catalog & History",
  },
  {
    role: "VIEWER",
    email: "viewer@nexus-ims.com",
    password: "Password123!",
    desc: "Read-only access to Dashboard, Inventory & Reports",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Reset Password Modal
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !newPassword) {
      toast.error("Harap isi email dan password baru.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mereset password.");
        setIsResetting(false);
        return;
      }

      toast.success(data.message || "Password berhasil diubah!");
      setEmail(resetEmail);
      setPassword(newPassword);
      setIsResetOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
        setIsLoading(false);
        return;
      }

      toast.success("Signed in successfully");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  };

  const selectDemoRole = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-6 py-8 shadow-sm sm:px-8">
      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setIsResetOpen(true);
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Lupa / Reset Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-9"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={isLoading}
        >
          {isLoading ? "Authenticating..." : "Sign in to Workspace"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Role Quick-Fill Selector for Testing RBAC */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Seeded RBAC Accounts (Click to autofill)
        </p>
        <div className="grid grid-cols-1 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = email === acc.email;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => selectDemoRole(acc.email, acc.password)}
                className={`flex items-center justify-between rounded-lg border p-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {acc.role}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {acc.email}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {acc.desc}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Dialog Reset Password */}
      <Modal
        open={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Reset Password Akun"
        description="Masukkan email akun Anda dan ketikkan password baru yang diinginkan."
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Email Terdaftar</Label>
            <Input
              id="reset-email"
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="admin@admin.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password">Password Baru</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetOpen(false)}
              disabled={isResetting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isResetting}>
              {isResetting ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <Boxes className="h-6 w-6" />
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to NexusIMS
        </h1>
        <p className="mt-1.5 text-center text-xs text-slate-500">
          Enterprise Multi-Warehouse Inventory & Stock Ledger Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="h-96 rounded-xl border border-slate-200/90 bg-white shadow-sm animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
