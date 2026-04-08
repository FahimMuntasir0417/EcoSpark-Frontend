import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type AuthFormFieldProps = {
  id: string;
  label: string;
  error?: string | null;
  children: ReactNode;
};

export function AuthFormField({
  id,
  label,
  error,
  children,
}: AuthFormFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
