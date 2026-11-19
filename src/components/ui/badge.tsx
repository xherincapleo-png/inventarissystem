import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
        secondary:
          "border-transparent bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
        warning:
          "border-transparent bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
        danger:
          "border-transparent bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
        outline: "border-slate-200 text-slate-700 bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
