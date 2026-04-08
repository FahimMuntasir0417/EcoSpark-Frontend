"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

type TableProps = React.ComponentProps<"table">;
type TableSectionProps = React.ComponentProps<"thead">;
type TableBodyProps = React.ComponentProps<"tbody">;
type TableFooterProps = React.ComponentProps<"tfoot">;
type TableRowProps = React.ComponentProps<"tr">;
type TableHeadProps = React.ComponentProps<"th">;
type TableCellProps = React.ComponentProps<"td">;
type TableCaptionProps = React.ComponentProps<"caption">;

function Table({ className, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: TableSectionProps) {
  return (
    <thead
      className={cn(
        "border-b border-slate-200 bg-slate-50/80 [&_tr]:border-0",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody
      className={cn(
        "[&_tr:last-child]:border-0",
        className,
      )}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={cn(
        "border-t border-slate-200 bg-slate-50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-slate-200 transition-colors hover:bg-slate-50/60",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.16em] text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-top text-sm text-slate-700",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={cn("px-4 py-3 text-sm text-slate-500", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
