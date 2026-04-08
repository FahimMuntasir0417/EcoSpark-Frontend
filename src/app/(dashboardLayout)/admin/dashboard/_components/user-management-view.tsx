"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import {
  useDeleteScientistMutation,
  useVerifyScientistMutation,
} from "@/features/scientist";
import { getApiErrorMessage, normalizeApiError } from "@/lib/errors/api-error";
import { scientistService } from "@/services/scientist.service";
import type { Scientist } from "@/services/scientist.service";
import { userService } from "@/services/user.service";

type UserRecord = Record<string, unknown>;

type UserManagementMode = "ADMINS" | "SCIENTISTS" | "MEMBERS";

type UserManagementViewProps = {
  mode: UserManagementMode;
};

type UserDirectoryResult = {
  users: UserRecord[];
  source: "list" | "self" | "none";
  warning: string | null;
};

function extractUserRole(user: UserRecord) {
  const role =
    (typeof user.role === "string" && user.role) ||
    (typeof user.userRole === "string" && user.userRole) ||
    null;

  return role ? role.toUpperCase() : null;
}

function formatRole(role: string | null | undefined) {
  if (!role) {
    return "N/A";
  }

  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getUserName(user: UserRecord | undefined) {
  return typeof user?.name === "string" && user.name.trim() ? user.name : "Unknown user";
}

function getUserEmail(user: UserRecord | undefined) {
  return typeof user?.email === "string" && user.email.trim() ? user.email : "N/A";
}

function getUserId(user: UserRecord | undefined) {
  if (!user) {
    return "N/A";
  }

  if (typeof user.id === "string" && user.id) {
    return user.id;
  }

  return `${getUserEmail(user)}-${getUserName(user)}`;
}

function getUsersForMode(users: UserRecord[], mode: UserManagementMode) {
  const usersWithRoles = users.filter((user) => extractUserRole(user));
  const roleMetadataMissing = users.length > 0 && usersWithRoles.length === 0;

  if (roleMetadataMissing) {
    return {
      roleMetadataMissing,
      users,
    };
  }

  const filteredUsers = users.filter((user) => {
    const role = extractUserRole(user);

    if (mode === "ADMINS") {
      return role === "ADMIN" || role === "SUPER_ADMIN";
    }

    if (mode === "MEMBERS") {
      return role === "MEMBER";
    }

    return role === "SCIENTIST";
  });

  return {
    roleMetadataMissing,
    users: filteredUsers,
  };
}

function getScientistLinkedUser(scientist: Scientist) {
  const scientistRecord = scientist as unknown as Record<string, unknown>;

  if (scientistRecord.user && typeof scientistRecord.user === "object") {
    return scientistRecord.user as UserRecord;
  }

  return undefined;
}

function getScientistUserId(scientist: Scientist) {
  const nestedUser = getScientistLinkedUser(scientist);

  return (
    (typeof scientist.userId === "string" && scientist.userId) ||
    (nestedUser && typeof nestedUser.id === "string" && nestedUser.id) ||
    null
  );
}

function getHeading(mode: UserManagementMode) {
  switch (mode) {
    case "ADMINS":
      return {
        title: "Admins Management",
        description: "Review administrator accounts available to the dashboard.",
      };
    case "MEMBERS":
      return {
        title: "Members Management",
        description: "Review member accounts available to the dashboard.",
      };
    default:
      return {
        title: "Scientists Management",
        description: "Review scientist records and verify or remove scientist access.",
      };
  }
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
          "The backend does not expose the /users list endpoint. Showing only the current signed-in account.",
      };
    } catch (meError) {
      if (!isNotFoundError(meError)) {
        throw meError;
      }

      return {
        users: [],
        source: "none",
        warning:
          "The backend does not expose a user directory endpoint, so this page cannot load a full user list.",
      };
    }
  }
}

export function UserManagementView({ mode }: Readonly<UserManagementViewProps>) {
  const usersQuery = useQuery({
    queryKey: ["users", "management-directory"],
    queryFn: getUserDirectory,
  });
  const scientistsQuery = useQuery({
    queryKey: ["scientists", "list", { mode }],
    queryFn: () => scientistService.getAllScientists(),
    enabled: mode === "SCIENTISTS",
  });

  const verifyScientistMutation = useVerifyScientistMutation();
  const deleteScientistMutation = useDeleteScientistMutation();

  const heading = getHeading(mode);

  if (usersQuery.isPending || (mode === "SCIENTISTS" && scientistsQuery.isPending)) {
    return (
      <LoadingState
        title={`Loading ${heading.title.toLowerCase()}`}
        description={heading.description}
      />
    );
  }

  if ((mode !== "SCIENTISTS" && usersQuery.isError) || (mode === "SCIENTISTS" && scientistsQuery.isError)) {
    return (
      <ErrorState
        title={`Could not load ${heading.title.toLowerCase()}`}
        description={getApiErrorMessage(usersQuery.error ?? scientistsQuery.error)}
        onRetry={() => {
          void usersQuery.refetch();
          if (mode === "SCIENTISTS") {
            void scientistsQuery.refetch();
          }
        }}
      />
    );
  }

  const userDirectory = usersQuery.data ?? {
    users: [],
    source: "none" as const,
    warning: null,
  };
  const users = userDirectory.users;
  const userMap = new Map(
    users
      .filter((user) => typeof user.id === "string")
      .map((user) => [String(user.id), user]),
  );

  if (mode === "SCIENTISTS") {
    const scientists = scientistsQuery.data?.data ?? [];
    const scientistDirectoryWarning = usersQuery.isError
      ? "Linked user records could not be loaded, so some scientist names and emails may be unavailable."
      : userDirectory.source !== "list"
        ? "A full user directory is not available from the backend. Scientist records are shown with whatever linked user data exists."
        : null;

    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{heading.title}</h2>
          <p className="text-sm text-muted-foreground">{heading.description}</p>
        </div>

        {scientistDirectoryWarning ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {scientistDirectoryWarning}
          </p>
        ) : null}

        {scientists.length === 0 ? (
          <EmptyState title="No scientist records found" />
        ) : (
          <ul className="space-y-3">
            {scientists.map((scientist) => {
              const fallbackUser = getScientistLinkedUser(scientist);
              const user = userMap.get(getScientistUserId(scientist) ?? "") ?? fallbackUser;
              const isVerifying =
                verifyScientistMutation.isPending &&
                verifyScientistMutation.variables?.id === scientist.id;
              const isDeleting =
                deleteScientistMutation.isPending &&
                deleteScientistMutation.variables?.id === scientist.id;

              return (
                <li key={scientist.id} className="rounded-xl border bg-background p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{getUserName(user)}</p>
                      <p className="text-sm text-muted-foreground">{getUserEmail(user)}</p>
                      <p className="text-sm text-muted-foreground">Scientist ID: {scientist.id}</p>
                      <p className="text-sm text-muted-foreground">
                        User ID: {getScientistUserId(scientist) ?? "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Verification: {scientist.isVerified ? "Verified" : "Pending"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isVerifying}
                        onClick={() => {
                          verifyScientistMutation.mutate({
                            id: scientist.id,
                            payload: { verified: !scientist.isVerified },
                          });
                        }}
                      >
                        {isVerifying
                          ? "Updating..."
                          : scientist.isVerified
                            ? "Mark Unverified"
                            : "Verify"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Delete this scientist record? This cannot be undone.",
                          );

                          if (!confirmed) {
                            return;
                          }

                          deleteScientistMutation.mutate({ id: scientist.id });
                        }}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  const { roleMetadataMissing, users: filteredUsers } = getUsersForMode(users, mode);
  const emptyDescription =
    userDirectory.source === "list"
      ? ""
      : "The backend did not provide a full user directory for this page.";

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{heading.title}</h2>
        <p className="text-sm text-muted-foreground">{heading.description}</p>
      </div>

      {userDirectory.warning ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {userDirectory.warning}
        </p>
      ) : null}

      {roleMetadataMissing ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The user response does not include role metadata, so this page is showing every available account instead of a role-filtered list.
        </p>
      ) : null}

      {filteredUsers.length === 0 ? (
        <EmptyState
          title={`No ${heading.title.toLowerCase()} found`}
          description={emptyDescription || undefined}
        />
      ) : (
        <ul className="space-y-3">
          {filteredUsers.map((user) => {
            const userId = getUserId(user);
            const role = extractUserRole(user);

            return (
              <li key={userId} className="rounded-xl border bg-background p-4">
                <p className="font-medium">{getUserName(user)}</p>
                <p className="text-sm text-muted-foreground">{getUserEmail(user)}</p>
                <p className="text-sm text-muted-foreground">Role: {formatRole(role)}</p>
                <p className="text-sm text-muted-foreground">User ID: {userId}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
