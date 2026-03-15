import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import type { ReactNode } from "react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;
  if (user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
