"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-red-200 bg-white p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-900">
        Something went wrong while loading this module
      </h2>
      <p className="mt-1.5 max-w-md text-xs text-slate-500">
        {error.message || "An unexpected server or database error occurred."}
      </p>
      <Button onClick={reset} size="sm" className="mt-5">
        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
        Try Again
      </Button>
    </div>
  );
}
