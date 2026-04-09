"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, ShieldAlert, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteUserMutation } from "@/features/user/hooks";
import { getApiErrorMessage, normalizeApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { userService } from "@/services/user.service";

type UserRecord = Record<string, unknown>;

type UserDirectoryResult = {
  users: UserRecord[];
  source: "list" | "self" | "none";
  warning: string | null;
};

type Feedback = {
  type: "success" | "error";
  text: string;
};

function extractUserRole(user: UserRecord) {
  const role =
    (typeof user.role === "string" && user.role) ||
    (typeof user.userRole === "string" && user.userRole) ||
    null;

  return role ? role.toUpperCase() : null;
}

function extractUserStatus(user: UserRecord) {
  const explicitStatus =
    (typeof user.status === "string" && user.status) ||
    (typeof user.accountStatus === "string" && user.accountStatus) ||
    null;

  if (explicitStatus) {
    return explicitStatus.toUpperCase();
  }

  if (typeof user.isActive === "boolean") {
    return user.isActive ? "ACTIVE" : "INACTIVE";
  }

  return null;
}

function formatLabel(value: string | null | undefined, fallback = "Unknown") {
  if (!value) {
    return fallback;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getUserName(user: UserRecord | undefined) {
  return typeof user?.name === "string" && user.name.trim()
    ? user.name
    : "Unknown user";
}

function getUserEmail(user: UserRecord | undefined) {
  return typeof user?.email === "string" && user.email.trim()
    ? user.email
    : "N/A";
}

function getUserId(user: UserRecord | undefined) {
  if (!user) {
    return "N/A";
  }

  if (typeof user.id === "string" && user.id.trim()) {
    return user.id;
  }

  return "N/A";
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "N/A";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString();
}

function getUserSearchText(user: UserRecord) {
  return [
    getUserName(user),
    getUserEmail(user),
    getUserId(user),
    extractUserRole(user),
    extractUserStatus(user),
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();
}

function isNotFoundError(error: unknown) {
  const normalized = normalizeApiError(error);

  if (normalized.statusCode === 404) {
    return true;
  }

  return normalized.message.toLowerCase().includes("not found");
}

async function getUserDirectory(): Promise<UserDirectoryResult> {
  try {
    const response = await userService.getUsers();
    return {
      users: (response.data ?? []) as UserRecord[],
      source: "list",
      warning: null,
    };
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    try {
      const meResponse = await userService.getMe();
      return {
        users: meResponse.data ? [meResponse.data as UserRecord] : [],
        source: "self",
        warning:
          "The backend does not expose a full user directory. Showing only the signed-in account as fallback.",
      };
    } catch (meError) {
      if (!isNotFoundError(meError)) {
        throw meError;
      }

      return {
        users: [],
        source: "none",
        warning:
          "The backend does not expose a user directory endpoint, so member management is unavailable.",
      };
    }
  }
}

function SummaryCard({
  label,
  value,
  caption,
}: Readonly<{
  label: string;
  value: string;
  caption: string;
}>) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{caption}</p>
    </div>
  );
}

function Badge({
  label,
  tone = "neutral",
}: Readonly<{
  label: string;
  tone?: "neutral" | "success" | "warning" | "accent";
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tone === "neutral" && "bg-slate-100 text-slate-700",
        tone === "success" && "bg-emerald-100 text-emerald-700",
        tone === "warning" && "bg-amber-100 text-amber-800",
        tone === "accent" && "bg-sky-100 text-sky-800",
      )}
    >
      {label}
    </span>
  );
}

export function AdminMembersManagementWorkspace() {
  const usersQuery = useQuery({
    queryKey: ["users", "management-directory"],
    queryFn: getUserDirectory,
  });
  const currentUserQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
    retry: false,
  });
  const deleteUserMutation = useDeleteUserMutation();

  const [searchValue, setSearchValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const userDirectory = usersQuery.data ?? {
    users: [],
    source: "none" as const,
    warning: null,
  };
  const allUsers = userDirectory.users;
  const usersWithRole = allUsers.filter((user) => extractUserRole(user));
  const roleMetadataMissing =
    allUsers.length > 0 && usersWithRole.length === 0;
  const currentUserId =
    typeof currentUserQuery.data?.data?.id === "string"
      ? currentUserQuery.data.data.id
      : null;

  const visibleMembers = useMemo(() => {
    const baseUsers = roleMetadataMissing
      ? allUsers
      : allUsers.filter((user) => extractUserRole(user) === "MEMBER");

    return [...baseUsers].sort((left, right) => {
      const nameComparison = getUserName(left).localeCompare(getUserName(right));

      if (nameComparison !== 0) {
        return nameComparison;
      }

      return getUserEmail(left).localeCompare(getUserEmail(right));
    });
  }, [allUsers, roleMetadataMissing]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return visibleMembers;
    }

    return visibleMembers.filter((user) =>
      getUserSearchText(user).includes(normalizedSearch),
    );
  }, [searchValue, visibleMembers]);

  const safeDeleteCount = filteredMembers.filter((user) => {
    const role = extractUserRole(user);
    const userId = getUserId(user);

    return (
      !roleMetadataMissing &&
      role === "MEMBER" &&
      userId !== "N/A" &&
      userId !== currentUserId
    );
  }).length;

  if (usersQuery.isPending) {
    return (
      <LoadingState
        title="Loading members"
        description="Fetching member accounts from the backend."
      />
    );
  }

  if (usersQuery.isError) {
    return (
      <ErrorState
        title="Could not load members"
        description={getApiErrorMessage(usersQuery.error)}
        onRetry={() => {
          void usersQuery.refetch();
        }}
      />
    );
  }

  const onDeleteUser = async (user: UserRecord) => {
    const userId = getUserId(user);

    if (userId === "N/A") {
      setFeedback({
        type: "error",
        text: `Cannot delete ${getUserName(user)} because the user ID is unavailable.`,
      });
      return;
    }

    if (currentUserId && currentUserId === userId) {
      setFeedback({
        type: "error",
        text: "Deleting the current signed-in admin account is blocked.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Delete member "${getUserName(user)}" (${getUserEmail(user)})? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    try {
      const response = await deleteUserMutation.mutateAsync({ id: userId });
      setFeedback({
        type: "success",
        text: response.message || "Member deleted successfully.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eff6ff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Members Management
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Professional member directory control
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Review member accounts, inspect identity and role metadata, and
                remove member records with clear safety rules.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              label={userDirectory.source === "list" ? "Live directory" : "Fallback mode"}
              tone={userDirectory.source === "list" ? "success" : "warning"}
            />
            <Badge
              label={
                roleMetadataMissing ? "Role metadata missing" : "Role metadata available"
              }
              tone={roleMetadataMissing ? "warning" : "accent"}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Visible Records"
          value={visibleMembers.length.toLocaleString()}
          caption="Accounts shown on this members route."
        />
        <SummaryCard
          label="Search Results"
          value={filteredMembers.length.toLocaleString()}
          caption="Records matching the current search."
        />
        <SummaryCard
          label="Delete Ready"
          value={safeDeleteCount.toLocaleString()}
          caption="Rows that meet the current delete safety checks."
        />
        <SummaryCard
          label="Directory Mode"
          value={userDirectory.source === "list" ? "Live" : "Fallback"}
          caption="Reflects whether the backend exposed the full user directory."
        />
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
            }}
            placeholder="Search by name, email, user ID, role, or status"
            className="h-11 border-slate-200 bg-white pl-9"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            {filteredMembers.length.toLocaleString()} record
            {filteredMembers.length === 1 ? "" : "s"} visible
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-slate-200"
            disabled={!searchValue.trim()}
            onClick={() => {
              setSearchValue("");
            }}
          >
            Clear search
          </Button>
        </div>
      </div>

      {userDirectory.warning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {userDirectory.warning}
        </div>
      ) : null}

      {roleMetadataMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The backend response does not include reliable role metadata. Delete
          actions are disabled to avoid removing the wrong account type.
        </div>
      ) : null}

      {feedback ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {feedback.text}
        </div>
      ) : null}

      {filteredMembers.length === 0 ? (
        <EmptyState
          title="No member records found"
          description={
            searchValue.trim()
              ? "Try a different keyword or clear the current search."
              : "No member accounts are available from the current directory source."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[240px]">Member</TableHead>
              <TableHead className="min-w-[180px]">Access</TableHead>
              <TableHead className="min-w-[220px]">User ID</TableHead>
              <TableHead className="min-w-[180px]">Created</TableHead>
              <TableHead className="min-w-[240px]">Safety</TableHead>
              <TableHead className="min-w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredMembers.map((user) => {
              const userId = getUserId(user);
              const role = extractUserRole(user);
              const status = extractUserStatus(user);
              const isCurrentUser = Boolean(currentUserId && currentUserId === userId);
              const canDelete =
                !roleMetadataMissing &&
                role === "MEMBER" &&
                userId !== "N/A" &&
                !isCurrentUser;
              const deleteReason = roleMetadataMissing
                ? "Role metadata missing"
                : isCurrentUser
                  ? "Current signed-in admin"
                  : userId === "N/A"
                    ? "User ID unavailable"
                    : role !== "MEMBER"
                      ? "Not a member account"
                      : "Ready to delete";
              const isDeleting =
                deleteUserMutation.isPending &&
                deleteUserMutation.variables?.id === userId;

              return (
                <TableRow key={`${userId}-${getUserEmail(user)}`}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-950">{getUserName(user)}</p>
                      <p className="text-sm text-slate-600">{getUserEmail(user)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge label={formatLabel(role, "Unknown role")} tone="accent" />
                      <Badge
                        label={formatLabel(status, "Unknown status")}
                        tone={status === "ACTIVE" ? "success" : "neutral"}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {userId}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      {canDelete ? (
                        <Users className="mt-0.5 size-4 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="mt-0.5 size-4 text-amber-600" />
                      )}
                      <div className="space-y-1">
                        <p className="font-medium text-slate-800">{deleteReason}</p>
                        {isCurrentUser ? (
                          <p className="text-xs text-slate-500">
                            Self-delete is blocked for safety.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={!canDelete || isDeleting}
                        onClick={() => {
                          void onDeleteUser(user);
                        }}
                      >
                        {isDeleting ? (
                          "Deleting..."
                        ) : (
                          <>
                            <Trash2 className="size-4" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
