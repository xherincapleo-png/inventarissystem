import { z } from "zod";

export const stockInSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  warehouseId: z.string().min(1, "Please select a destination warehouse"),
  supplierId: z.string().min(1, "Please select a supplier"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce
    .number()
    .min(0, "Unit price cannot be negative")
    .optional(),
  transactionDate: z.string().min(1, "Transaction date is required"),
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type StockInFormValues = z.infer<typeof stockInSchema>;

export const stockOutSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  warehouseId: z.string().min(1, "Please select a source warehouse"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  destination: z
    .string()
    .min(2, "Please specify the destination or purpose")
    .max(200, "Destination cannot exceed 200 characters")
    .trim(),
  transactionDate: z.string().min(1, "Transaction date is required"),
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type StockOutFormValues = z.infer<typeof stockOutSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  warehouseId: z.string().min(1, "Please select a warehouse"),
  newQuantity: z.coerce
    .number()
    .int("New quantity must be a whole number")
    .min(0, "Adjusted stock quantity cannot be negative"),
  reason: z
    .string()
    .min(3, "Please provide a clear adjustment reason")
    .max(150, "Reason cannot exceed 150 characters")
    .trim(),
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;
