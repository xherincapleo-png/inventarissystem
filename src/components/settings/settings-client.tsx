"use client";

import React, { useState } from "react";
import { Building2, UserCircle, Lock, Save, Sliders } from "lucide-react";
import { toast } from "sonner";
import {
  updateCompanySettingsAction,
  updateProfileAction,
} from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

interface SettingsClientProps {
  companySettings: {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    currency: string;
    lowStockAlertGlobal: boolean;
    defaultMinStock: number;
  };
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  canManageSystem: boolean;
}

export function SettingsClient({
  companySettings,
  currentUser,
  canManageSystem,
}: SettingsClientProps) {
  // Company & App Settings State
  const [companyName, setCompanyName] = useState(companySettings.companyName);
  const [companyEmail, setCompanyEmail] = useState(companySettings.companyEmail);
  const [companyPhone, setCompanyPhone] = useState(companySettings.companyPhone);
  const [companyAddress, setCompanyAddress] = useState(companySettings.companyAddress);
  const [currency, setCurrency] = useState(companySettings.currency);
  const [lowStockAlertGlobal, setLowStockAlertGlobal] = useState(
    companySettings.lowStockAlertGlobal
  );
  const [defaultMinStock, setDefaultMinStock] = useState(
    companySettings.defaultMinStock
  );
  const [savingCompany, setSavingCompany] = useState(false);

  // User Profile & Security State
  const [profileName, setProfileName] = useState(currentUser.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      const res = await updateCompanySettingsAction({
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        currency,
        lowStockAlertGlobal,
        defaultMinStock: Number(defaultMinStock),
      });
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success("Company and application settings saved.");
      }
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await updateProfileAction({
        name: profileName,
        currentPassword,
        newPassword,
      });
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success("Profile and security settings updated.");
        setCurrentPassword("");
        setNewPassword("");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Configure company profile, global inventory defaults, user profile, and account security."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Company Profile & Application Defaults */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <CardTitle>Company Profile & Application Settings</CardTitle>
              </div>
              {!canManageSystem && (
                <Badge variant="secondary">Read-Only (Super Admin Required)</Badge>
              )}
            </div>
            <CardDescription>
              Enterprise identity and global stock threshold configurations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Company Name</Label>
                <Input
                  disabled={!canManageSystem}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Operations Email</Label>
                  <Input
                    type="email"
                    disabled={!canManageSystem}
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    disabled={!canManageSystem}
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Headquarters Address</Label>
                <Textarea
                  rows={2}
                  disabled={!canManageSystem}
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Application Inventory Defaults</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Default Currency</Label>
                    <select
                      disabled={!canManageSystem}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm disabled:opacity-50"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Default Min Stock Threshold</Label>
                    <Input
                      type="number"
                      min="0"
                      disabled={!canManageSystem}
                      value={defaultMinStock}
                      onChange={(e) => setDefaultMinStock(Number(e.target.value))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Global Low Stock Alerts
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Display replenishment warnings on the operations dashboard
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!canManageSystem}
                    checked={lowStockAlertGlobal}
                    onChange={(e) => setLowStockAlertGlobal(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                </div>
              </div>

              {canManageSystem && (
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={savingCompany}>
                    <Save className="mr-1.5 h-4 w-4" />
                    {savingCompany ? "Saving..." : "Save System Settings"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* User Profile & Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-indigo-600" />
              <CardTitle>User Profile & Security Settings</CardTitle>
            </div>
            <CardDescription>
              Manage your personal display name and update your authentication password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input disabled value={currentUser.email} className="bg-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Assigned RBAC Role</Label>
                  <Input
                    disabled
                    value={currentUser.role.replace("_", " ")}
                    className="bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Lock className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Change Password (Optional)</span>
                </div>

                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to authorize change"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={savingProfile}>
                  <Save className="mr-1.5 h-4 w-4" />
                  {savingProfile ? "Updating..." : "Update Profile & Security"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
