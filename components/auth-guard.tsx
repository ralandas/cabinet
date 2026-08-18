"use client";
import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import AppShell from "./app-shell";

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;
    if (!token && !isPublic) router.replace("/login");
    if (token && isPublic) router.replace("/dashboard");
  }, [token, loading, isPublic, router]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!token && !isPublic) return null;
  if (token && isPublic) return null;

  // Public pages (login/register) don't get the app shell
  if (isPublic) return <>{children}</>;

  // Authenticated pages get the sidebar layout
  return <AppShell>{children}</AppShell>;
}
