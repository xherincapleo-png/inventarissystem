import { z } from "zod";
import { RoleType } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),
  role: z.nativeEnum(RoleType, {
    errorMap: () => ({ message: "Please select a valid user role" }),
  }),
  isActive: z.boolean().default(true),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "Full name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  role: z.nativeEnum(RoleType),
  isActive: z.boolean(),
  password: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const companySettingsSchema = z.object({
  companyName: z.string().min(2, "Company name is required").max(120).trim(),
  companyEmail: z.string().email("Please enter a valid email").trim(),
  companyPhone: z.string().min(5, "Phone number is required").max(40).trim(),
  companyAddress: z.string().min(5, "Company address is required").max(300).trim(),
  currency: z.string().min(3, "Currency code is required").max(5).trim(),
  lowStockAlertGlobal: z.boolean(),
  defaultMinStock: z.coerce.number().int().min(0),
});

export type CompanySettingsValues = z.infer<typeof companySettingsSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
