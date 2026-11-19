import { z } from "zod";

export const productFormSchema = z.object({
  sku: z
    .string()
    .min(2, "SKU must be at least 2 characters")
    .max(50, "SKU cannot exceed 50 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "SKU can only contain letters, numbers, hyphens, and underscores")
    .transform((val) => val.toUpperCase().trim()),
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  categoryId: z.string().min(1, "Please select a category"),
  unit: z.string().min(1, "Please select or enter a unit of measure"),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price cannot be negative")
    .max(999999999, "Price exceeds maximum allowed value"),
  sellingPrice: z.coerce
    .number()
    .min(0, "Selling price cannot be negative")
    .max(999999999, "Price exceeds maximum allowed value"),
  minimumStock: z.coerce
    .number()
    .int("Minimum stock must be a whole number")
    .min(0, "Minimum stock cannot be negative"),
  imageUrl: z
    .string()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
  // Optional initial stock allocation when creating a product
  initialWarehouseId: z.string().optional().or(z.literal("")),
  initialStock: z.coerce
    .number()
    .int("Initial stock must be a whole number")
    .min(0, "Initial stock cannot be negative")
    .optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
