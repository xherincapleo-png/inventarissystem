import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | { toNumber?: () => number },
  currency = "USD"
): string {
  const numericValue =
    typeof amount === "number"
      ? amount
      : typeof amount === "string"
      ? parseFloat(amount)
      : amount && typeof amount.toNumber === "function"
      ? amount.toNumber()
      : Number(amount) || 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US").format(num || 0);
}

export function formatDate(date: Date | string | null | undefined, pattern = "MMM dd, yyyy"): string {
  if (!date) return "—";
  return format(new Date(date), pattern);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM dd, yyyy · HH:mm");
}

export function generateReferenceNo(prefix: "SIN" | "SOUT" | "ADJ"): string {
  const datePart = format(new Date(), "yyyyMMdd");
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
