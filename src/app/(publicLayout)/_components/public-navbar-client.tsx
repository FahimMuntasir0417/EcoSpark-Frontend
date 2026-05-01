"use client";

import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Compass,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserPlus,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLogoutMutation } from "@/features/auth";
import { type UserRole } from "@/lib/authUtils";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { userService } from "@/services/user.service";

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

type ThemeMode = "light" | "dark";

const primaryLinks: PublicNavLink[] = [
  {
    label: "Home",
    href: "/",
    description: "Platform overview",
    icon: Sparkles,
  },
  {
    label: "Ideas",
    href: "/idea",
    description: "Browse reviewed ideas",
    icon: Lightbulb,
  },
  {
    label: "AI Discover",
    href: "/ai-discover",
    description: "Smart search and recommendations",
    icon: Sparkles,
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    description: "Track active campaigns",
    icon: Compass,
  },
  {
    label: "Scientists",
    href: "/scientist",
    description: "Find contributor profiles",
    icon: UsersRound,
  },
  {
    label: "Community",
    href: "/community",
    description: "Review public reports",
    icon: BookOpen,
  },
];

const resourceLinks: PublicNavLink[] = [
  {
    label: "About",
    href: "/about",
    description: "Product mission and roles",
    icon: ShieldCheck,
  },
  {
    label: "Support",
    href: "/support",
    description: "Help, FAQ, and operations",
    icon: CircleHelp,
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Send a structured request",
    icon: User,
  },
  {
    label: "Plans",
    href: "/subscription-plan",
    description: "Review subscription options",
    icon: FileText,
  },
  {
    label: "Privacy",
    href: "/privacy",
    description: "Data handling practices",
    icon: ShieldCheck,
  },
  {
    label: "Terms",
    href: "/terms",
    description: "Use and account terms",
    icon: Scale,
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

const accountLinks: PublicNavLink[] = [
  {
    label: "My profile",
    href: "/my-profile",
    description: "Manage personal information",
    icon: User,
  },
  {
    label: "Saved ideas",
    href: "/saved-ideas",
    description: "Review saved opportunities",
    icon: Lightbulb,
  },
  {
    label: "Purchases",
    href: "/my-purchases",
    description: "Open purchased ideas",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/change-password",
    description: "Update account security",
    icon: Settings,
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

function setDocumentTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem("eco-spark-theme", mode);
}

function ThemeToggle({
  theme,
  onToggle,
  compact = false,
}: {
  theme: ThemeMode;
  onToggle: () => void;
  compact?: boolean;
}) {
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "size-10" : "h-10 gap-2 px-3 text-sm font-medium",
      )}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      <Icon className="size-4" />
      {compact ? null : <span>{theme === "dark" ? "Light" : "Dark"}</span>}
    </button>
  );
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
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
        "flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "mt-0.5 flex size-9 items-center justify-center rounded-md",
          active ? "bg-white/15" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span
          className={cn(
            "mt-1 block text-xs",
            active ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {description}
        </span>
      </span>
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
  const resourcesMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [profileMenuState, setProfileMenuState] = useState(() => ({
    open: false,
    pathname,
  }));
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
  const profileMenuOpen =
    profileMenuState.open && profileMenuState.pathname === pathname;
  const mobileOpen =
    mobileMenuState.open && mobileMenuState.pathname === pathname;

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

  useEffect(() => {
    if (!profileMenuOpen && !resourcesOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        resourcesMenuRef.current &&
        !resourcesMenuRef.current.contains(target)
      ) {
        setResourcesOpen(false);
      }

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setProfileMenuState({
          open: false,
          pathname,
        });
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setResourcesOpen(false);
      setProfileMenuState({
        open: false,
        pathname,
      });
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen, resourcesOpen, pathname]);

  const closeProfileMenu = () => {
    setProfileMenuState({
      open: false,
      pathname,
    });
  };

  const closeMobileMenu = () => {
    closeProfileMenu();
    setResourcesOpen(false);
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
      closeMobileMenu();
      router.replace("/");
      router.refresh();
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
              ES
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                Eco Spark
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Sustainability innovation platform
              </span>
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <nav className="flex items-center gap-1" aria-label="Primary">
              {primaryLinks.map((link) => (
                <DesktopNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  pathname={pathname}
                />
              ))}

              <div className="relative" ref={resourcesMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setResourcesOpen((open) => !open);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    resourceLinks.some((link) => isPathActive(pathname, link.href))
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-expanded={resourcesOpen}
                  aria-haspopup="menu"
                >
                  Resources
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      resourcesOpen ? "rotate-180" : "",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "absolute left-0 top-[calc(100%+0.75rem)] grid w-[30rem] grid-cols-2 gap-2 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl transition-all",
                    resourcesOpen
                      ? "translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0",
                  )}
                  role="menu"
                >
                  {resourceLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => {
                        setResourcesOpen(false);
                      }}
                      className="flex gap-3 rounded-md p-3 transition-colors hover:bg-muted"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <link.icon className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {link.label}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {link.description}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {isAuthenticated && role && dashboardHref ? (
              <>
                <Link
                  href={dashboardHref}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>

                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuState((previousState) => {
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
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Open profile menu"
                  >
                    <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-xs font-semibold text-foreground">
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
                    <span className="max-w-28 truncate">{displayName}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        profileMenuOpen ? "rotate-180" : "",
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "absolute right-0 top-[calc(100%+0.75rem)] w-72 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl transition-all",
                      profileMenuOpen
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0",
                    )}
                    role="menu"
                  >
                    <div className="rounded-md bg-muted p-3">
                      <p className="truncate text-sm font-semibold">
                        {displayName}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {displayEmail ?? formatRoleLabel(role)}
                      </p>
                    </div>

                    <div className="mt-2 grid gap-1">
                      {accountLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={closeProfileMenu}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          <link.icon className="size-4" />
                          {link.label}
                        </Link>
                      ))}

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="inline-flex h-10 items-center rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle theme={theme} onToggle={toggleTheme} compact />
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
              aria-expanded={mobileOpen}
              aria-label={
                mobileOpen ? "Close navigation menu" : "Open navigation menu"
              }
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {logoutError ? (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {logoutError}
          </p>
        </div>
      ) : null}

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={closeMobileMenu}
          aria-label="Close mobile navigation"
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-x-4 top-[4.75rem] z-40 max-h-[calc(100svh-6rem)] overflow-y-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl transition-all lg:hidden sm:inset-x-6",
          mobileOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0",
        )}
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Eco Spark
            </p>
            <p className="mt-2 text-base font-semibold">
              {isAuthenticated && role
                ? `${formatRoleLabel(role)} workspace`
                : "Move from idea discovery to adoption"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAuthenticated
                ? "Use dashboard routes, account tools, and public discovery from one menu."
                : "Browse public routes or create an account when you are ready to contribute."}
            </p>
          </div>

          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Explore
            </p>
            <div className="grid gap-2">
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

          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Resources
            </p>
            <div className="grid gap-2">
              {resourceLinks.map((link) => (
                <MobileNavLink
                  key={link.href}
                  {...link}
                  pathname={pathname}
                  onNavigate={closeMobileMenu}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {isAuthenticated ? "Account" : "Access"}
            </p>

            {isAuthenticated && role && dashboardHref ? (
              <div className="grid gap-2">
                <MobileNavLink
                  href={dashboardHref}
                  label="Dashboard"
                  description="Open your default workspace"
                  icon={LayoutDashboard}
                  pathname={pathname}
                  onNavigate={closeMobileMenu}
                />
                {accountLinks.map((link) => (
                  <MobileNavLink
                    key={link.href}
                    {...link}
                    pathname={pathname}
                    onNavigate={closeMobileMenu}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 text-sm font-semibold transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="size-4" />
                    {logoutMutation.isPending ? "Logging out..." : "Log out"}
                  </span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
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

          <Link
            href="/idea"
            onClick={closeMobileMenu}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Search className="size-4" />
            Browse idea library
          </Link>
        </div>
      </div>
    </>
  );
}
