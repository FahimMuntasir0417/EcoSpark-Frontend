"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Camera,
  CircleAlert,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage, normalizeApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
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

type DetailItem = {
  label: string;
  value: string;
  href?: string | null;
};

type SectionTone = "slate" | "emerald" | "amber";

const initialUpdateForm: ProfileUpdateForm = {
  name: "",
  contactNumber: "",
  address: "",
  imageFile: null,
};

const textAreaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60";

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

function getHttpUrl(value: unknown): string | null {
  const text = getOptionalString(value);

  if (!text) {
    return null;
  }

  if (text.startsWith("/")) {
    return text;
  }

  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? text
      : null;
  } catch {
    return null;
  }
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
    getHttpUrl(scientist?.profilePhoto),
    getHttpUrl(member?.profilePhoto),
    getHttpUrl(user?.image),
  ];

  return candidates.find(Boolean) ?? null;
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
      getOptionalString(scientist?.address) ??
      getOptionalString(member?.address) ??
      "",
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

function SummaryCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <article className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-600">{caption}</p>
    </article>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "success" | "warning" | "info";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        tone === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "info" && "border-sky-200 bg-sky-50 text-sky-700",
        tone === "neutral" &&
          "border-slate-200 bg-white text-slate-700 shadow-sm",
      )}
    >
      {label}
    </span>
  );
}

function DetailCard({ label, value, href }: DetailItem) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-800">
        {value}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-xs font-semibold text-sky-700 transition hover:text-sky-800"
        >
          Open link
        </a>
      ) : null}
    </div>
  );
}

function ProfileSection({
  tone,
  eyebrow,
  title,
  description,
  items,
  emptyMessage,
}: {
  tone: SectionTone;
  eyebrow: string;
  title: string;
  description: string;
  items: DetailItem[];
  emptyMessage: string;
}) {
  const toneClassName =
    tone === "emerald"
      ? "from-emerald-50 via-white to-slate-50"
      : tone === "amber"
        ? "from-amber-50 via-white to-slate-50"
        : "from-sky-50 via-white to-slate-50";

  return (
    <section
      className={cn(
        "rounded-[24px] border border-slate-200 bg-gradient-to-br p-6 shadow-sm",
        toneClassName,
      )}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {eyebrow}
        </p>
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => (
            <DetailCard
              key={`${title}-${item.label}`}
              label={item.label}
              value={item.value}
              href={item.href}
            />
          ))}
        </div>
      )}
    </section>
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
  const [fileInputKey, setFileInputKey] = useState(0);

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

  const previewImageUrl = useMemo(
    () =>
      currentUpdateForm.imageFile
        ? URL.createObjectURL(currentUpdateForm.imageFile)
        : null,
    [currentUpdateForm.imageFile],
  );

  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const resetUpdateFormFromProfile = () => {
    setUpdateForm(initialUpdateForm);
    setIsUpdateFormDirty(false);
    setUpdateFeedback(null);
    setFileInputKey((value) => value + 1);
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

    if (updateFeedback) {
      setUpdateFeedback(null);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0] ?? null;

    setUpdateForm({
      ...currentUpdateForm,
      imageFile,
    });
    setIsUpdateFormDirty(true);

    if (updateFeedback) {
      setUpdateFeedback(null);
    }
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
      setFileInputKey((value) => value + 1);

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
  const statusLabel = formatEnum(user.status);
  const fullName = getOptionalString(user.name) ?? "Your Profile";
  const email = getOptionalString(user.email) ?? "N/A";
  const storedProfileImageUrl = getProfileImageUrl(user, scientist, member);
  const displayProfileImageUrl = previewImageUrl ?? storedProfileImageUrl;
  const initials = getInitials(fullName);
  const hasVerifiedEmail =
    typeof user.emailVerified === "boolean" ? user.emailVerified : false;
  const linkedProfilesCount = [scientist, member].filter(Boolean).length;
  const preferredContactNumber =
    getOptionalString(scientist?.contactNumber) ??
    getOptionalString(member?.contactNumber) ??
    "Not provided";
  const preferredAddress =
    getOptionalString(scientist?.address) ??
    getOptionalString(member?.address) ??
    "Not provided";

  const accountItems: DetailItem[] = [
    { label: "User ID", value: formatUnknown(user.id) },
    { label: "Role", value: roleLabel },
    { label: "Status", value: statusLabel },
    { label: "Email", value: email },
    {
      label: "Email Verified",
      value: formatBoolean(user.emailVerified),
    },
    {
      label: "Need Password Change",
      value: formatBoolean(user.needPasswordChange),
    },
    { label: "Deleted", value: formatBoolean(user.isDeleted) },
    { label: "Deleted At", value: formatDateTime(user.deletedAt) },
    { label: "Created At", value: formatDateTime(user.createdAt) },
    { label: "Updated At", value: formatDateTime(user.updatedAt) },
  ];

  const scientistItems: DetailItem[] = scientist
    ? [
        { label: "Scientist ID", value: formatUnknown(scientist.id) },
        {
          label: "Profile Photo",
          value: formatUnknown(scientist.profilePhoto),
          href: getHttpUrl(scientist.profilePhoto),
        },
        {
          label: "Contact Number",
          value: formatUnknown(scientist.contactNumber),
        },
        { label: "Address", value: formatUnknown(scientist.address) },
        { label: "Institution", value: formatUnknown(scientist.institution) },
        { label: "Department", value: formatUnknown(scientist.department) },
        {
          label: "Specialization",
          value: formatUnknown(scientist.specialization),
        },
        {
          label: "Research Interests",
          value: formatUnknown(scientist.researchInterests),
        },
        {
          label: "Years Of Experience",
          value: formatNumber(scientist.yearsOfExperience),
        },
        {
          label: "Qualification",
          value: formatUnknown(scientist.qualification),
        },
        {
          label: "LinkedIn URL",
          value: formatUnknown(scientist.linkedinUrl),
          href: getHttpUrl(scientist.linkedinUrl),
        },
        {
          label: "Google Scholar URL",
          value: formatUnknown(scientist.googleScholarUrl),
          href: getHttpUrl(scientist.googleScholarUrl),
        },
        { label: "ORCID", value: formatUnknown(scientist.orcid) },
        { label: "Verified At", value: formatDateTime(scientist.verifiedAt) },
        { label: "Deleted", value: formatBoolean(scientist.isDeleted) },
        { label: "Deleted At", value: formatDateTime(scientist.deletedAt) },
        { label: "Created At", value: formatDateTime(scientist.createdAt) },
        { label: "Updated At", value: formatDateTime(scientist.updatedAt) },
      ]
    : [];

  const memberItems: DetailItem[] = member
    ? [
        { label: "Member ID", value: formatUnknown(member.id) },
        {
          label: "Profile Photo",
          value: formatUnknown(member.profilePhoto),
          href: getHttpUrl(member.profilePhoto),
        },
        { label: "Contact Number", value: formatUnknown(member.contactNumber) },
        { label: "Address", value: formatUnknown(member.address) },
        { label: "Occupation", value: formatUnknown(member.occupation) },
        { label: "Interests", value: formatUnknown(member.interests) },
        {
          label: "Experience Level",
          value: formatUnknown(member.experienceLevel),
        },
        {
          label: "Preferred Categories",
          value: formatUnknown(member.preferredCategories),
        },
        {
          label: "Membership Level",
          value: formatUnknown(member.membershipLevel),
        },
        { label: "Created At", value: formatDateTime(member.createdAt) },
        { label: "Updated At", value: formatDateTime(member.updatedAt) },
      ]
    : [];

  return (
    <section className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm">
        <div className="grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
              <Sparkles className="size-3.5" />
              Profile Workspace
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-[26px] border border-white/70 bg-slate-100 text-2xl font-semibold text-slate-700 shadow-sm">
                {displayProfileImageUrl ? (
                  <img
                    src={displayProfileImageUrl}
                    alt={`${fullName} profile`}
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                    {fullName}
                  </h2>
                  <p className="text-sm leading-6 text-slate-600 md:text-base">
                    Review your account footprint, keep contact information
                    current, and manage how your linked member and scientist
                    profiles appear across the platform.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={roleLabel} tone="neutral" />
                  <StatusPill label={`Status: ${statusLabel}`} tone="info" />
                  <StatusPill
                    label={
                      hasVerifiedEmail ? "Email verified" : "Email not verified"
                    }
                    tone={hasVerifiedEmail ? "success" : "warning"}
                  />
                  {scientist ? (
                    <StatusPill label="Scientist profile linked" tone="success" />
                  ) : null}
                  {member ? (
                    <StatusPill label="Member profile linked" tone="neutral" />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              label="Profiles"
              value={`${linkedProfilesCount}/2`}
              caption="Linked role-specific profile records"
            />
            <SummaryCard
              label="Joined"
              value={formatDateTime(user.createdAt)}
              caption="Account creation timestamp"
            />
            <SummaryCard
              label="Primary Contact"
              value={preferredContactNumber}
              caption="Preferred phone from linked profiles"
            />
            <SummaryCard
              label="Primary Address"
              value={preferredAddress}
              caption="Current address shown on profile records"
            />
          </div>
        </div>
      </section>

      {updateFeedback ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm shadow-sm",
            updateFeedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {updateFeedback.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Profile Snapshot
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Identity and visibility at a glance
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              This summary reflects the current state of your account and the
              contact details exposed through linked profile records.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sky-700">
                  <Mail className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Email Address
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {email}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                  <Phone className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Contact Number
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {preferredContactNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Address
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-800">
                    {preferredAddress}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700">
                  <BadgeCheck className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Account Status
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {statusLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700">
                  <CircleAlert className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Account Role
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {roleLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Profile Editor
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Update profile information
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Keep your shared name, contact data, and profile image up to date.
              Changes are sent as multipart form data when needed.
            </p>
          </div>

          <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative flex size-[4.5rem] items-center justify-center overflow-hidden rounded-[22px] border border-white/70 bg-white text-lg font-semibold text-slate-700 shadow-sm">
                {displayProfileImageUrl ? (
                  <img
                    src={displayProfileImageUrl}
                    alt={`${fullName} preview`}
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Current preview
                </p>
                <p className="truncate text-xs text-slate-500">
                  {currentUpdateForm.imageFile
                    ? currentUpdateForm.imageFile.name
                    : storedProfileImageUrl
                      ? "Using existing profile image"
                      : "No profile image uploaded"}
                </p>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleUpdateProfile}>
            <fieldset
              disabled={updateProfileMutation.isPending}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="profile-update-name"
                    className="text-sm font-medium text-slate-800"
                  >
                    Full name
                  </Label>
                  <Input
                    id="profile-update-name"
                    placeholder="Enter your full name"
                    className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
                    value={currentUpdateForm.name}
                    onChange={(event) => {
                      handleUpdateField("name", event.target.value);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="profile-update-contact"
                    className="text-sm font-medium text-slate-800"
                  >
                    Contact number
                  </Label>
                  <Input
                    id="profile-update-contact"
                    placeholder="e.g. +8801712345678"
                    className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
                    value={currentUpdateForm.contactNumber}
                    onChange={(event) => {
                      handleUpdateField("contactNumber", event.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="profile-update-address"
                  className="text-sm font-medium text-slate-800"
                >
                  Address
                </Label>
                <textarea
                  id="profile-update-address"
                  className={textAreaClassName}
                  placeholder="Enter your address"
                  value={currentUpdateForm.address}
                  onChange={(event) => {
                    handleUpdateField("address", event.target.value);
                  }}
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="profile-update-image"
                  className="text-sm font-medium text-slate-800"
                >
                  Profile image
                </Label>

                <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50/80 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm">
                      <Camera className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Upload a new avatar
                        </p>
                        <p className="text-xs text-slate-500">
                          Sent as multipart form data with keys `image` and
                          `data`.
                        </p>
                      </div>

                      <Input
                        key={fileInputKey}
                        id="profile-update-image"
                        type="file"
                        accept="image/*"
                        className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
                        onChange={handleImageChange}
                      />

                      <p className="truncate text-xs text-slate-600">
                        {currentUpdateForm.imageFile
                          ? `Selected: ${currentUpdateForm.imageFile.name}`
                          : "No new image selected."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                className="rounded-2xl"
                disabled={updateProfileMutation.isPending}
              >
                <Save className="size-4" />
                {updateProfileMutation.isPending ? "Saving..." : "Save profile"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-2xl"
                onClick={resetUpdateFormFromProfile}
                disabled={updateProfileMutation.isPending}
              >
                <RefreshCw className="size-4" />
                Reset
              </Button>
            </div>
          </form>
        </section>
      </div>

      <ProfileSection
        tone="slate"
        eyebrow="Account Details"
        title="Core account record"
        description="Authentication status, lifecycle metadata, and the primary account identifiers associated with your user profile."
        items={accountItems}
        emptyMessage="No account details are available for this profile."
      />

      <ProfileSection
        tone="emerald"
        eyebrow="Scientist Profile"
        title="Scientist-facing record"
        description="Academic and research-specific information attached to your scientist profile."
        items={scientistItems}
        emptyMessage="No scientist profile data is linked to this account."
      />

      <ProfileSection
        tone="amber"
        eyebrow="Member Profile"
        title="Member-facing record"
        description="Participation and preference information attached to your member profile."
        items={memberItems}
        emptyMessage="No member profile data is linked to this account."
      />
    </section>
  );
}
