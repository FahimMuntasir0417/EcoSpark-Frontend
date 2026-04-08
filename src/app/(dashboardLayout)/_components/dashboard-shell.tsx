"use client";

import { type LucideIcon, Archive, Bookmark, ClipboardCheck, Compass, FileText, FlaskConical, FolderPlus, Home, LayoutDashboard, Lightbulb, LogOut, Menu, MessageSquare, PlusCircle, Send, Settings, Shield, ShoppingCart, Star, ThumbsUp, User, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/features/auth";
import { getDefaultDashboardRoute, type UserRole } from "@/lib/authUtils";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { getNavItemsByRole } from "@/lib/navItems";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: ReactNode;
  role: UserRole;
};

const iconMap: Record<string, LucideIcon> = {
  Archive,
  Bookmark,
  ClipboardCheck,
  Compass,
  FileText,
  FlaskConical,
  FolderPlus,
  Home,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  PlusCircle,
  Send,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  ThumbsUp,
  User,
  Users,
};

function resolveIcon(iconName: string): LucideIcon {
  return iconMap[iconName] ?? LayoutDashboard;
}

function formatRoleLabel(role: UserRole) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPathSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isPathActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  if (
    href === "/dashboard" ||
    href === "/admin/dashboard" ||
    href === "/scientist/dashboard"
  ) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getCurrentPageTitle(pathname: string, role: UserRole) {
  const navSections = getNavItemsByRole(role);

  for (const section of navSections) {
    for (const item of section.items) {
      if (isPathActive(pathname, item.href)) {
        return {
          title: item.title,
          sectionTitle: section.title ?? "Overview",
        };
      }
    }
  }

  const segments = pathname.split("/").filter(Boolean);

  return {
    title: segments.length > 0 ? formatPathSegment(segments[segments.length - 1]) : "Dashboard",
    sectionTitle: segments.length > 1 ? formatPathSegment(segments[segments.length - 2]) : "Overview",
  };
}

function NavLink({
  href,
  label,
  icon,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  pathname: string;
  onNavigate: () => void;
}) {
  const Icon = resolveIcon(icon);
  const active = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-slate-900 text-white shadow-[0_12px_28px_-20px_rgba(15,23,42,0.75)]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className={cn("size-4", active ? "text-white" : "text-slate-400 group-hover:text-slate-700")} />
      <span>{label}</span>
    </Link>
  );
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const navSections = getNavItemsByRole(role);
  const dashboardHref = getDefaultDashboardRoute(role);
  const currentPage = getCurrentPageTitle(pathname, role);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLogoutError(null);

    try {
      await logoutMutation.mutateAsync();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14),rgba(56,189,248,0)_72%)]" />
      <div className="pointer-events-none absolute -right-24 bottom-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.12),rgba(34,197,94,0)_72%)]" />

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white/92 px-4 py-5 shadow-xl backdrop-blur-xl transition-transform lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link href={dashboardHref} className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
              ES
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Eco Spark</p>
              <p className="text-xs text-slate-500">{formatRoleLabel(role)} workspace</p>
            </div>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto py-6">
          {navSections.map((section, index) => (
            <section key={`${section.title ?? "general"}-${index}`} className="space-y-2">
              {section.title ? (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {section.title}
                </p>
              ) : null}

              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.title}
                    icon={item.icon}
                    pathname={pathname}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="space-y-3 border-t border-slate-200 pt-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatRoleLabel(role)}</p>
          </div>

          {logoutError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {logoutError}
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="size-4" />
            {logoutMutation.isPending ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </aside>

      <div className="relative min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="lg:hidden"
                onClick={() => setMobileOpen((open) => !open)}
              >
                <Menu className="size-4" />
              </Button>

              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  {currentPage.sectionTitle}
                </p>
                <h1 className="text-lg font-semibold text-slate-950">{currentPage.title}</h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href={dashboardHref}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950"
              >
                Dashboard home
              </Link>
              <div className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-white">
                {formatRoleLabel(role)}
              </div>
            </div>
          </div>
        </header>

        <main className="relative min-h-[calc(100vh-4rem)] px-4 py-4 md:px-6 md:py-6">
          <div className="pointer-events-none absolute left-4 right-4 top-4 h-28 rounded-3xl bg-[radial-gradient(circle_at_15%_0%,rgba(56,189,248,0.16),rgba(56,189,248,0)_70%)] md:left-6 md:right-6 md:top-6" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
