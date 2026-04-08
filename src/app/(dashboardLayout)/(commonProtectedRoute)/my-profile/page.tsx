"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage, normalizeApiError } from "@/lib/errors/api-error";
import { userService, type UpdateMyProfileInput } from "@/services/user.service";

type RecordValue = Record<string, unknown>;

type UpdateFeedback =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

type ProfileUpdateForm = {
  name: string;
  contactNumber: string;
  address: string;
  imageFile: File | null;
};

const initialUpdateForm: ProfileUpdateForm = {
  name: "",
  contactNumber: "",
  address: "",
  imageFile: null,
};

function asRecord(value: unknown): RecordValue | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RecordValue;
  }

  return null;
}

function getOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function formatEnum(value: unknown): string {
  const text = getOptionalString(value);
  if (!text) {
    return "N/A";
  }

  return text
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatBoolean(value: unknown): string {
  if (typeof value !== "boolean") {
    return "N/A";
  }

  return value ? "Yes" : "No";
}

function formatNumber(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return String(value);
}

function formatDateTime(value: unknown): string {
  const raw = getOptionalString(value);

  if (!raw) {
    return "N/A";
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString();
}

function formatUnknown(value: unknown): string {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : "N/A";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    const entries = value
      .map((entry) =>
        typeof entry === "string" || typeof entry === "number"
          ? String(entry).trim()
          : "",
      )
      .filter(Boolean);

    return entries.length > 0 ? entries.join(", ") : "N/A";
  }

  return "N/A";
}

function getProfileImageUrl(
  user: RecordValue | null,
  scientist: RecordValue | null,
  member: RecordValue | null,
): string | null {
  const candidates = [
    getOptionalString(scientist?.profilePhoto),
    getOptionalString(member?.profilePhoto),
    getOptionalString(user?.image),
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (candidate.startsWith("/")) {
      return candidate;
    }

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getInitials(name: string): string {
  const initials = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials.length > 0 ? initials : "U";
}

function buildProfileUpdateForm(
  user: RecordValue | null,
  scientist: RecordValue | null,
  member: RecordValue | null,
): Omit<ProfileUpdateForm, "imageFile"> {
  return {
    name: getOptionalString(user?.name) ?? "",
    contactNumber:
      getOptionalString(scientist?.contactNumber) ??
      getOptionalString(member?.contactNumber) ??
      "",
    address:
      getOptionalString(scientist?.address) ?? getOptionalString(member?.address) ?? "",
  };
}

function getUpdateErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (!normalizedError.errors || normalizedError.errors.length === 0) {
    return normalizedError.message;
  }

  const details = normalizedError.errors
    .map((item) => {
      if (item.path && item.path.trim().length > 0) {
        return `${item.path}: ${item.message}`;
      }

      return item.message;
    })
    .join(" | ");

  return details
    ? `${normalizedError.message}. ${details}`
    : normalizedError.message;
}

function ProfileItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

export default function MyProfilePage() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
  });
  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateMyProfileInput) => userService.updateMe(payload),
  });

  const [updateForm, setUpdateForm] = useState<ProfileUpdateForm>(initialUpdateForm);
  const [updateFeedback, setUpdateFeedback] = useState<UpdateFeedback>(null);
  const [isUpdateFormDirty, setIsUpdateFormDirty] = useState(false);

  const profileSourceUser = asRecord(meQuery.data?.data);
  const profileSourceScientist = asRecord(profileSourceUser?.scientist);
  const profileSourceMember = asRecord(profileSourceUser?.member);
  const baseUpdateForm = buildProfileUpdateForm(
    profileSourceUser,
    profileSourceScientist,
    profileSourceMember,
  );
  const currentUpdateForm: ProfileUpdateForm = isUpdateFormDirty
    ? updateForm
    : {
        ...baseUpdateForm,
        imageFile: null,
      };

  const resetUpdateFormFromProfile = () => {
    setUpdateForm(initialUpdateForm);
    setIsUpdateFormDirty(false);
    setUpdateFeedback(null);
  };

  const handleUpdateField = (
    field: "name" | "contactNumber" | "address",
    value: string,
  ) => {
    setUpdateForm({
      ...currentUpdateForm,
      [field]: value,
    });
    setIsUpdateFormDirty(true);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0] ?? null;

    setUpdateForm({
      ...currentUpdateForm,
      imageFile,
    });
    setIsUpdateFormDirty(true);
  };

  const handleUpdateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdateFeedback(null);

    const normalizedName = currentUpdateForm.name.trim();
    const normalizedContactNumber = currentUpdateForm.contactNumber.trim();
    const normalizedAddress = currentUpdateForm.address.trim();

    const payloadData: Record<string, unknown> = {};

    if (normalizedName) {
      payloadData.name = normalizedName;
    }

    if (normalizedContactNumber) {
      payloadData.contactNumber = normalizedContactNumber;
    }

    if (normalizedAddress) {
      payloadData.address = normalizedAddress;
    }

    if (Object.keys(payloadData).length === 0 && !currentUpdateForm.imageFile) {
      setUpdateFeedback({
        type: "error",
        text: "Update at least one field or choose an image before saving.",
      });
      return;
    }

    try {
      const response = await updateProfileMutation.mutateAsync({
        data: payloadData,
        image: currentUpdateForm.imageFile,
      });

      queryClient.setQueryData(["users", "me"], response);
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      setUpdateForm(initialUpdateForm);
      setIsUpdateFormDirty(false);

      setUpdateFeedback({
        type: "success",
        text:
          (typeof response.message === "string" && response.message.trim()) ||
          "Profile updated successfully.",
      });
    } catch (error) {
      setUpdateFeedback({
        type: "error",
        text: getUpdateErrorMessage(error),
      });
    }
  };

  if (meQuery.isPending) {
    return (
      <LoadingState
        title="Loading profile"
        description="Fetching your account details."
      />
    );
  }

  if (meQuery.isError) {
    return (
      <ErrorState
        title="Could not load profile"
        description={getApiErrorMessage(meQuery.error)}
        onRetry={() => {
          void meQuery.refetch();
        }}
      />
    );
  }

  const user = profileSourceUser ?? {};
  const scientist = profileSourceScientist;
  const member = profileSourceMember;
  const roleLabel = formatEnum(user.role ?? user.userRole);
  const fullName = getOptionalString(user.name) ?? "N/A";
  const email = getOptionalString(user.email) ?? "N/A";
  const profileImageUrl = getProfileImageUrl(user, scientist, member);
  const initials = getInitials(fullName);
  const hasVerifiedEmail = formatBoolean(user.emailVerified) === "Yes";

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Profile</h2>
        <p className="text-sm text-muted-foreground">
          Review and update your account, scientist, and member profile information.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Update Profile
        </h3>

        {updateFeedback ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              updateFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {updateFeedback.text}
          </p>
        ) : null}

        <form
          onSubmit={handleUpdateProfile}
          className="space-y-4 rounded-2xl border bg-card p-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-update-name">Name</Label>
              <Input
                id="profile-update-name"
                placeholder="Enter your full name"
                value={currentUpdateForm.name}
                onChange={(event) => {
                  handleUpdateField("name", event.target.value);
                }}
                disabled={updateProfileMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-update-contact">Contact Number</Label>
              <Input
                id="profile-update-contact"
                placeholder="e.g. +8801712345678"
                value={currentUpdateForm.contactNumber}
                onChange={(event) => {
                  handleUpdateField("contactNumber", event.target.value);
                }}
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-update-address">Address</Label>
            <Input
              id="profile-update-address"
              placeholder="Enter your address"
              value={currentUpdateForm.address}
              onChange={(event) => {
                handleUpdateField("address", event.target.value);
              }}
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-update-image">Profile Image</Label>
            <Input
              id="profile-update-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={updateProfileMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              Send as multipart/form-data with keys `image` (file) and `data` (JSON).
            </p>
            {currentUpdateForm.imageFile ? (
              <p className="text-xs text-foreground">
                Selected: {currentUpdateForm.imageFile.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="outline"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetUpdateFormFromProfile}
              disabled={updateProfileMutation.isPending}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-2xl border bg-muted text-xl font-semibold text-foreground">
            {profileImageUrl ? (
              <span
                className="size-full bg-cover bg-center"
                style={{ backgroundImage: `url(${profileImageUrl})` }}
                aria-hidden="true"
              />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{fullName}</h3>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {roleLabel}
              </span>
              <span
                className={
                  hasVerifiedEmail
                    ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    : "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                }
              >
                {hasVerifiedEmail ? "Email verified" : "Email not verified"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                Status: {formatEnum(user.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Account Details
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ProfileItem label="User ID" value={formatUnknown(user.id)} />
          <ProfileItem label="Role" value={roleLabel} />
          <ProfileItem label="Status" value={formatEnum(user.status)} />
          <ProfileItem
            label="Email Verified"
            value={formatBoolean(user.emailVerified)}
          />
          <ProfileItem
            label="Need Password Change"
            value={formatBoolean(user.needPasswordChange)}
          />
          <ProfileItem label="Deleted" value={formatBoolean(user.isDeleted)} />
          <ProfileItem label="Deleted At" value={formatDateTime(user.deletedAt)} />
          <ProfileItem label="Created At" value={formatDateTime(user.createdAt)} />
          <ProfileItem label="Updated At" value={formatDateTime(user.updatedAt)} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Scientist Profile
        </h3>
        {scientist ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ProfileItem label="Scientist ID" value={formatUnknown(scientist.id)} />
            <ProfileItem
              label="Profile Photo"
              value={formatUnknown(scientist.profilePhoto)}
            />
            <ProfileItem
              label="Contact Number"
              value={formatUnknown(scientist.contactNumber)}
            />
            <ProfileItem label="Address" value={formatUnknown(scientist.address)} />
            <ProfileItem
              label="Institution"
              value={formatUnknown(scientist.institution)}
            />
            <ProfileItem
              label="Department"
              value={formatUnknown(scientist.department)}
            />
            <ProfileItem
              label="Specialization"
              value={formatUnknown(scientist.specialization)}
            />
            <ProfileItem
              label="Research Interests"
              value={formatUnknown(scientist.researchInterests)}
            />
            <ProfileItem
              label="Years Of Experience"
              value={formatNumber(scientist.yearsOfExperience)}
            />
            <ProfileItem
              label="Qualification"
              value={formatUnknown(scientist.qualification)}
            />
            <ProfileItem
              label="LinkedIn URL"
              value={formatUnknown(scientist.linkedinUrl)}
            />
            <ProfileItem
              label="Google Scholar URL"
              value={formatUnknown(scientist.googleScholarUrl)}
            />
            <ProfileItem label="ORCID" value={formatUnknown(scientist.orcid)} />
            <ProfileItem
              label="Verified At"
              value={formatDateTime(scientist.verifiedAt)}
            />
            <ProfileItem
              label="Deleted"
              value={formatBoolean(scientist.isDeleted)}
            />
            <ProfileItem
              label="Deleted At"
              value={formatDateTime(scientist.deletedAt)}
            />
            <ProfileItem
              label="Created At"
              value={formatDateTime(scientist.createdAt)}
            />
            <ProfileItem
              label="Updated At"
              value={formatDateTime(scientist.updatedAt)}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            No scientist profile data found for this account.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Member Profile
        </h3>
        {member ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ProfileItem label="Member ID" value={formatUnknown(member.id)} />
            <ProfileItem
              label="Profile Photo"
              value={formatUnknown(member.profilePhoto)}
            />
            <ProfileItem
              label="Contact Number"
              value={formatUnknown(member.contactNumber)}
            />
            <ProfileItem label="Address" value={formatUnknown(member.address)} />
            <ProfileItem
              label="Occupation"
              value={formatUnknown(member.occupation)}
            />
            <ProfileItem label="Interests" value={formatUnknown(member.interests)} />
            <ProfileItem
              label="Experience Level"
              value={formatUnknown(member.experienceLevel)}
            />
            <ProfileItem
              label="Preferred Categories"
              value={formatUnknown(member.preferredCategories)}
            />
            <ProfileItem
              label="Membership Level"
              value={formatUnknown(member.membershipLevel)}
            />
            <ProfileItem
              label="Created At"
              value={formatDateTime(member.createdAt)}
            />
            <ProfileItem
              label="Updated At"
              value={formatDateTime(member.updatedAt)}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            No member profile data found for this account.
          </div>
        )}
      </div>
    </section>
  );
}
