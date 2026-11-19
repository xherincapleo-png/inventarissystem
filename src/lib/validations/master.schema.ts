import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(80, "Category name cannot exceed 80 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const supplierSchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(120, "Company name cannot exceed 120 characters")
    .trim(),
  contactPerson: z
    .string()
    .min(2, "Contact person must be at least 2 characters")
    .max(100, "Contact person cannot exceed 100 characters")
    .trim(),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  phone: z
    .string()
    .min(5, "Phone number must be at least 5 characters")
    .max(30, "Phone number cannot exceed 30 characters")
    .trim(),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(300, "Address cannot exceed 300 characters")
    .trim(),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(2, "Warehouse name must be at least 2 characters")
    .max(100, "Warehouse name cannot exceed 100 characters")
    .trim(),
  code: z
    .string()
    .min(2, "Warehouse code must be at least 2 characters")
    .max(30, "Warehouse code cannot exceed 30 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "Code can only contain letters, numbers, hyphens, and underscores")
    .transform((val) => val.toUpperCase().trim()),
  location: z
    .string()
    .min(3, "Location must be at least 3 characters")
    .max(200, "Location cannot exceed 200 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type WarehouseFormValues = z.infer<typeof warehouseSchema>;
