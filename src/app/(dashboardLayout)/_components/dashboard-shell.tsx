"use client";

import {
  type LucideIcon,
  Archive,
  Bookmark,
  ClipboardCheck,
  Compass,
  FileText,
  Flag,
  FlaskConical,
  FolderPlus,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  PlusCircle,
  Send,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Sun,
  ThumbsUp,
  User,
  Users,
  X,
} from "lucide-react";
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

type ThemeMode = "light" | "dark";

const iconMap: Record<string, LucideIcon> = {
  Archive,
  Bookmark,
  ClipboardCheck,
  Compass,
  FileText,
  Flag,
  FlaskConical,
  FolderPlus,
  Home,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Megaphone,
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
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(
          "size-4",
          active
            ? "text-primary-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span>{label}</span>
    </Link>
  );
}

function setDocumentTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem("eco-spark-theme", mode);
}

function DashboardThemeToggle({
  theme,
  onToggle,
}: {
  theme: ThemeMode;
  onToggle: () => void;
}) {
  const Icon = theme === "dark" ? Sun : Moon;
  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" />
    </Button>
  );
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const navSections = getNavItemsByRole(role);
  const dashboardHref = getDefaultDashboardRoute(role);
  const currentPage = getCurrentPageTitle(pathname, role);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("eco-spark-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: ThemeMode =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : prefersDark
          ? "dark"
          : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      setDocumentTheme(nextTheme);
      return nextTheme;
    });
  };

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
    <div className="theme-compat-scope dashboard-theme-scope relative min-h-screen overflow-x-clip bg-background text-foreground">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-foreground/25 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card px-4 py-5 text-card-foreground shadow-xl backdrop-blur-xl transition-transform lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Link href={dashboardHref} className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              ES
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Eco Spark</p>
              <p className="text-xs text-muted-foreground">
                {formatRoleLabel(role)} workspace
              </p>
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
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
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

        <div className="space-y-3 border-t border-border pt-4">
          <div className="rounded-lg border border-border bg-muted px-3 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Signed in as
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {formatRoleLabel(role)}
            </p>
          </div>

          {logoutError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
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
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
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
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {currentPage.sectionTitle}
                </p>
                <h1 className="text-lg font-semibold text-foreground">
                  {currentPage.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DashboardThemeToggle theme={theme} onToggle={toggleTheme} />
              <Link
                href={dashboardHref}
                className="hidden rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
              >
                Dashboard home
              </Link>
              <div className="hidden rounded-md bg-primary px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground md:block">
                {formatRoleLabel(role)}
              </div>
            </div>
          </div>
        </header>

        <main className="relative min-h-[calc(100vh-4rem)] px-4 py-4 md:px-6 md:py-6">
          <div className="pointer-events-none absolute left-4 right-4 top-4 h-28 rounded-lg bg-secondary/25 md:left-6 md:right-6 md:top-6" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
