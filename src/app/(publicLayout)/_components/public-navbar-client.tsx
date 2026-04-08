"use client";

import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  Lightbulb,
  type LucideIcon,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLogoutMutation } from "@/features/auth";
import { type UserRole } from "@/lib/authUtils";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { userService } from "@/services/user.service";
import { cn } from "@/lib/utils";

type PublicNavbarClientProps = {
  isAuthenticated: boolean;
  role: UserRole | null;
  dashboardHref: string | null;
};

type PublicNavLink = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

const primaryLinks: PublicNavLink[] = [
  {
    label: "Home",
    href: "/",
    description: "Platform overview and entry point",
    icon: Sparkles,
  },
  {
    label: "Ideas",
    href: "/idea",
    description: "Browse published ideas",
    icon: Lightbulb,
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    description: "Browse published campaigns",
    icon: Lightbulb,
  },
  {
    label: "Scientists",
    href: "/scientist",
    description: "Browse published scientist profiles",
    icon: Lightbulb,
  },
  {
    label: "Community",
    href: "/community",
    description: "Connect with other scientists and researchers",
    icon: Lightbulb,
  },
];

const guestLinks: PublicNavLink[] = [
  {
    label: "Login",
    href: "/login",
    description: "Access your workspace",
    icon: LogIn,
  },
  {
    label: "Register",
    href: "/register",
    description: "Create a new account",
    icon: UserPlus,
  },
];

function formatRoleLabel(role: UserRole) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getAvatarUrl(user: Record<string, unknown> | null): string | null {
  if (!user) {
    return null;
  }

  const candidates = [
    user.profilePhoto,
    user.avatar,
    user.avatarUrl,
    user.photo,
    user.photoUrl,
    user.image,
    user.imageUrl,
  ];

  for (const candidate of candidates) {
    const value = getOptionalString(candidate);
    if (!value) {
      continue;
    }

    if (value.startsWith("/")) {
      return value;
    }

    try {
      const parsed = new URL(value);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return value;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getInitials(label: string): string {
  const parts = label
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "ES";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function isPathActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopNavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  description,
  icon: Icon,
  pathname,
  onNavigate,
}: PublicNavLink & {
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
        active
          ? "border-slate-950 bg-slate-950 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
      aria-current={active ? "page" : undefined}
    >
      <div
        className={cn(
          "mt-0.5 flex size-9 items-center justify-center rounded-xl",
          active ? "bg-white/15" : "bg-slate-100 text-slate-500",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p
          className={cn(
            "mt-1 text-xs",
            active ? "text-slate-200" : "text-slate-500",
          )}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}

export function PublicNavbarClient({
  isAuthenticated,
  role,
  dashboardHref,
}: PublicNavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuState, setMobileMenuState] = useState(() => ({
    open: false,
    pathname,
  }));
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const meQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });
  const meDataCandidate = meQuery.data?.data;
  const meRecord =
    meDataCandidate && typeof meDataCandidate === "object"
      ? (meDataCandidate as Record<string, unknown>)
      : null;
  const displayName =
    getOptionalString(meRecord?.name) ??
    (role ? formatRoleLabel(role) : "Eco Spark user");
  const displayEmail = getOptionalString(meRecord?.email);
  const avatarUrl = getAvatarUrl(meRecord);
  const avatarInitials = getInitials(displayName);
  const mobileOpen =
    mobileMenuState.open && mobileMenuState.pathname === pathname;

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen]);

  const closeMobileMenu = () => {
    setProfileMenuOpen(false);
    setMobileMenuState({
      open: false,
      pathname,
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuState((previousState) => {
      if (previousState.pathname !== pathname) {
        return {
          open: true,
          pathname,
        };
      }

      return {
        open: !previousState.open,
        pathname,
      };
    });
  };

  const handleLogout = async () => {
    setLogoutError(null);

    try {
      await logoutMutation.mutateAsync();
      setProfileMenuOpen(false);
      closeMobileMenu();
      router.replace("/");
      router.refresh();
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/88 px-4 py-3 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1e40af_100%)] text-sm font-semibold text-white shadow-lg shadow-slate-900/20">
                ES
                <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  Eco Spark
                </p>
                <p className="truncate text-xs text-slate-500">
                  Sustainability ideas, reviewed fast
                </p>
              </div>
            </Link>

            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 xl:inline-flex">
              <Sparkles className="mr-1.5 size-3.5" />
              Live innovation workspace
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <nav className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              {primaryLinks.map((link) => (
                <DesktopNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  pathname={pathname}
                />
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {isAuthenticated && role && dashboardHref ? (
              <>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {formatRoleLabel(role)}
                </div>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen((open) => !open);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Open profile menu"
                  >
                    <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                      {avatarUrl ? (
                        <span
                          className="size-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${avatarUrl})` }}
                          aria-hidden="true"
                        />
                      ) : (
                        avatarInitials
                      )}
                    </span>
                    <span className="hidden max-w-28 truncate xl:inline">
                      {displayName}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-slate-500 transition-transform",
                        profileMenuOpen ? "rotate-180" : "",
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "absolute right-0 top-[calc(100%+0.5rem)] w-64 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all",
                      profileMenuOpen
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0",
                    )}
                  >
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                        {avatarUrl ? (
                          <span
                            className="size-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${avatarUrl})` }}
                            aria-hidden="true"
                          />
                        ) : (
                          avatarInitials
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {displayEmail ?? formatRoleLabel(role)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <Link
                        href="/change-password"
                        onClick={() => {
                          setProfileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                      >
                        <Settings className="size-4" />
                        Settings
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LogOut className="size-4" />
                        {logoutMutation.isPending ? "Logging out..." : "Log out"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleMobileMenu}
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 lg:hidden"
            aria-expanded={mobileOpen}
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </header>

      {logoutError ? (
        <div className="mx-auto mt-3 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {logoutError}
          </p>
        </div>
      ) : null}

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden"
          onClick={closeMobileMenu}
          aria-label="Close mobile navigation"
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-x-4 top-[5.5rem] z-30 rounded-3xl border border-slate-200 bg-white/96 p-4 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all lg:hidden sm:inset-x-6",
          mobileOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0",
        )}
      >
        <div className="space-y-4">
          <div className="rounded-3xl bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_45%,#eef2ff_100%)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Eco Spark
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {isAuthenticated && role
                ? `${formatRoleLabel(role)} workspace is ready`
                : "Move from idea discovery to adoption"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {isAuthenticated
                ? "Jump back into your dashboard or sign out from here."
                : "Browse ideas, create an account, or sign in to continue."}
            </p>
          </div>

          <div className="space-y-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Explore
            </p>
            <div className="space-y-2">
              {primaryLinks.map((link) => (
                <MobileNavLink
                  key={link.href}
                  {...link}
                  pathname={pathname}
                  onNavigate={closeMobileMenu}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {isAuthenticated ? "Account" : "Access"}
            </p>

            {isAuthenticated && role && dashboardHref ? (
              <div className="space-y-2">
                <Link
                  href={dashboardHref}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <LayoutDashboard className="size-4" />
                    Open dashboard
                  </span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/change-password"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings className="size-4" />
                    Settings
                  </span>
                  <ArrowRight className="size-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="size-4" />
                    {logoutMutation.isPending ? "Logging out..." : "Log out"}
                  </span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {guestLinks.map((link) => (
                  <MobileNavLink
                    key={link.href}
                    {...link}
                    pathname={pathname}
                    onNavigate={closeMobileMenu}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
