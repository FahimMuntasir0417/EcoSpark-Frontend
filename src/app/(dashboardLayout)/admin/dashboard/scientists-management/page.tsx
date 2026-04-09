"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  type ComponentProps,
  type FormEvent,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAssignScientistSpecialtiesMutation,
  useCreateScientistMutation,
  useDeleteScientistMutation,
  useRemoveScientistSpecialtyMutation,
  useScientistsQuery,
  useUpdateScientistMutation,
  useVerifyScientistMutation,
} from "@/features/scientist";
import { useSpecialtiesQuery } from "@/features/specialty";
import { getApiErrorMessage, normalizeApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Scientist } from "@/services/scientist.service";
import type { Specialty } from "@/services/specialty.service";
import { userService } from "@/services/user.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type ScientistFilter = "all" | "verified" | "unverified";

type ScientistSpecialty = {
  id: string;
  label: string;
};

type MemberRecord = Record<string, unknown>;

type MemberDirectoryResult = {
  users: MemberRecord[];
  warning: string | null;
};

type CreateScientistFormValues = {
  userId: string;
  institution: string;
  department: string;
  specialization: string;
  yearsOfExperience: string;
  qualification: string;
  researchInterests: string;
  contactNumber: string;
  address: string;
  profilePhoto: string;
  linkedinUrl: string;
  googleScholarUrl: string;
  orcid: string;
};

type CreateScientistFormErrors = Partial<
  Record<keyof CreateScientistFormValues, string>
>;

type UpdateScientistFormValues = Omit<CreateScientistFormValues, "userId">;
type UpdateScientistFormErrors = Partial<
  Record<keyof UpdateScientistFormValues, string>
>;

type ProfileField = {
  key: keyof UpdateScientistFormValues;
  label: string;
  placeholder: string;
  type?: ComponentProps<typeof Input>["type"];
  min?: number;
  step?: number;
  hint?: string;
};

type InputFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

type TextAreaFieldProps = ComponentProps<"textarea"> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

const inputClassName =
  "h-12 rounded-2xl border-slate-200 bg-white shadow-sm";
const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";
const selectClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60";

const initialCreateScientistForm: CreateScientistFormValues = {
  userId: "",
  institution: "",
  department: "",
  specialization: "",
  yearsOfExperience: "",
  qualification: "",
  researchInterests: "",
  contactNumber: "",
  address: "",
  profilePhoto: "",
  linkedinUrl: "",
  googleScholarUrl: "",
  orcid: "",
};

const primaryProfileFields: ProfileField[] = [
  {
    key: "institution",
    label: "Institution",
    placeholder: "Dhaka Medical College",
  },
  {
    key: "department",
    label: "Department",
    placeholder: "Cardiology",
  },
  {
    key: "specialization",
    label: "Specialization",
    placeholder: "Heart disease",
  },
  {
    key: "qualification",
    label: "Qualification",
    placeholder: "MBBS, MD",
  },
  {
    key: "yearsOfExperience",
    label: "Years of experience",
    placeholder: "8",
    type: "number",
    min: 0,
    step: 1,
  },
];

const secondaryProfileFields: ProfileField[] = [
  {
    key: "contactNumber",
    label: "Contact number",
    placeholder: "01700000000",
    hint: "Optional direct contact number.",
  },
  {
    key: "address",
    label: "Address",
    placeholder: "Dhaka, Bangladesh",
    hint: "Optional location or mailing address.",
  },
  {
    key: "linkedinUrl",
    label: "LinkedIn URL",
    placeholder: "https://www.linkedin.com/in/example",
    type: "url",
    hint: "Optional public profile.",
  },
  {
    key: "googleScholarUrl",
    label: "Google Scholar URL",
    placeholder: "https://scholar.google.com/citations?user=example",
    type: "url",
    hint: "Optional publication profile.",
  },
  {
    key: "orcid",
    label: "ORCID",
    placeholder: "0000-0002-1825-0097",
    hint: "Optional researcher identifier.",
  },
  {
    key: "profilePhoto",
    label: "Profile photo URL",
    placeholder: "https://example.com/profile.jpg",
    type: "url",
    hint: "Optional public image URL.",
  },
];

function parseIdList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function trimToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function omitRecordKey<T>(record: Record<string, T>, key: string) {
  if (!(key in record)) {
    return record;
  }

  const next = { ...record };
  delete next[key];
  return next;
}

function validateCreateScientistForm(values: CreateScientistFormValues) {
  const errors: CreateScientistFormErrors = {};
  const userId = values.userId.trim();
  const yearsRaw = values.yearsOfExperience.trim();
  const years = Number(yearsRaw);

  if (!userId) errors.userId = "Member selection is required.";
  if (!values.institution.trim()) errors.institution = "Institution is required.";
  if (!values.department.trim()) errors.department = "Department is required.";
  if (!values.specialization.trim()) {
    errors.specialization = "Specialization is required.";
  }
  if (!values.qualification.trim()) {
    errors.qualification = "Qualification is required.";
  }
  if (!values.researchInterests.trim()) {
    errors.researchInterests = "Research interests are required.";
  }
  if (!yearsRaw) errors.yearsOfExperience = "Years of experience is required.";
  if (yearsRaw && (!Number.isInteger(years) || years < 0)) {
    errors.yearsOfExperience =
      "Years of experience must be a whole number equal to or greater than 0.";
  }

  const profilePhoto = trimToUndefined(values.profilePhoto);
  const linkedinUrl = trimToUndefined(values.linkedinUrl);
  const googleScholarUrl = trimToUndefined(values.googleScholarUrl);

  if (profilePhoto && !isValidUrl(profilePhoto)) {
    errors.profilePhoto = "Profile photo must be a valid URL.";
  }
  if (linkedinUrl && !isValidUrl(linkedinUrl)) {
    errors.linkedinUrl = "LinkedIn URL must be valid.";
  }
  if (googleScholarUrl && !isValidUrl(googleScholarUrl)) {
    errors.googleScholarUrl = "Google Scholar URL must be valid.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false as const,
      errors,
      message:
        Object.values(errors).find(Boolean) ?? "Invalid scientist profile input.",
    };
  }

  const scientist: Record<string, unknown> = {
    institution: values.institution.trim(),
    department: values.department.trim(),
    specialization: values.specialization.trim(),
    yearsOfExperience: years,
    qualification: values.qualification.trim(),
    researchInterests: values.researchInterests.trim(),
  };

  const optionalValues = {
    contactNumber: trimToUndefined(values.contactNumber),
    address: trimToUndefined(values.address),
    profilePhoto,
    linkedinUrl,
    googleScholarUrl,
    orcid: trimToUndefined(values.orcid),
  };

  for (const [key, value] of Object.entries(optionalValues)) {
    if (value) scientist[key] = value;
  }

  return {
    success: true as const,
    data: { userId, scientist },
    errors: {} as CreateScientistFormErrors,
  };
}

function validateUpdateScientistForm(values: UpdateScientistFormValues) {
  const validation = validateCreateScientistForm({
    ...values,
    userId: "existing-user",
  });

  if (!validation.success) {
    return {
      success: false as const,
      errors: validation.errors as UpdateScientistFormErrors,
      message: validation.message,
    };
  }

  return {
    success: true as const,
    data: validation.data.scientist,
    errors: {} as UpdateScientistFormErrors,
  };
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleString();
}

function formatExperience(value: number | null) {
  if (value === null) return "N/A";
  return `${value} year${value === 1 ? "" : "s"}`;
}

function getScientistSpecialties(scientist: Scientist): ScientistSpecialty[] {
  const record = scientist as Record<string, unknown>;
  const rawSpecialties = record.scientistSpecialties;
  if (!Array.isArray(rawSpecialties)) return [];

  return rawSpecialties.flatMap((rawItem) => {
    if (!rawItem || typeof rawItem !== "object") return [];
    const item = rawItem as Record<string, unknown>;
    const nested =
      item.specialty && typeof item.specialty === "object"
        ? (item.specialty as Record<string, unknown>)
        : item;
    const id =
      (typeof nested.id === "string" && nested.id) ||
      (typeof item.specialtyId === "string" && item.specialtyId) ||
      "";
    if (!id) return [];
    const label =
      (typeof nested.name === "string" && nested.name) ||
      (typeof nested.title === "string" && nested.title) ||
      id;
    return [{ id, label }];
  });
}

function getScientistUserLabel(scientist: Scientist) {
  const record = scientist as Record<string, unknown>;
  const linkedUser =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;

  return {
    userName:
      linkedUser && typeof linkedUser.name === "string" && linkedUser.name.trim()
        ? linkedUser.name
        : "Unknown user",
    userEmail:
      linkedUser &&
      typeof linkedUser.email === "string" &&
      linkedUser.email.trim()
        ? linkedUser.email
        : "N/A",
    userId:
      (typeof scientist.userId === "string" && scientist.userId) ||
      (linkedUser && typeof linkedUser.id === "string" ? linkedUser.id : "N/A"),
  };
}

function getScientistBoolean(scientist: Scientist, key: string) {
  const value = (scientist as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : false;
}

function getScientistString(scientist: Scientist, key: string) {
  const value = (scientist as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function getScientistNumber(scientist: Scientist, key: string) {
  const value = (scientist as Record<string, unknown>)[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getScientistSearchText(scientist: Scientist) {
  const { userName, userEmail, userId } = getScientistUserLabel(scientist);
  return [
    scientist.id,
    userId,
    userName,
    userEmail,
    getScientistString(scientist, "institution"),
    getScientistString(scientist, "department"),
    getScientistString(scientist, "specialization"),
    getScientistString(scientist, "qualification"),
    getScientistString(scientist, "researchInterests"),
    ...getScientistSpecialties(scientist).map((specialty) => specialty.label),
  ]
    .filter(hasText)
    .join(" ")
    .toLowerCase();
}

function getInitialUpdateScientistForm(
  scientist: Scientist,
): UpdateScientistFormValues {
  return {
    institution: getScientistString(scientist, "institution"),
    department: getScientistString(scientist, "department"),
    specialization: getScientistString(scientist, "specialization"),
    yearsOfExperience:
      getScientistNumber(scientist, "yearsOfExperience")?.toString() ?? "",
    qualification: getScientistString(scientist, "qualification"),
    researchInterests: getScientistString(scientist, "researchInterests"),
    contactNumber: getScientistString(scientist, "contactNumber"),
    address: getScientistString(scientist, "address"),
    profilePhoto: getScientistString(scientist, "profilePhoto"),
    linkedinUrl: getScientistString(scientist, "linkedinUrl"),
    googleScholarUrl: getScientistString(scientist, "googleScholarUrl"),
    orcid: getScientistString(scientist, "orcid"),
  };
}

function extractUserRole(user: MemberRecord) {
  const role =
    (typeof user.role === "string" && user.role) ||
    (typeof user.userRole === "string" && user.userRole) ||
    null;
  return role ? role.toUpperCase() : null;
}

function getUserRecordId(user: MemberRecord) {
  return typeof user.id === "string" && user.id ? user.id : "";
}

function getUserRecordName(user: MemberRecord) {
  return typeof user.name === "string" && user.name.trim()
    ? user.name
    : "Unknown user";
}

function getUserRecordEmail(user: MemberRecord) {
  return typeof user.email === "string" && user.email.trim()
    ? user.email
    : "N/A";
}

function getSpecialtyLabel(specialty: Specialty) {
  const record = specialty as Record<string, unknown>;
  return (
    (typeof record.name === "string" && record.name) ||
    (typeof record.title === "string" && record.title) ||
    specialty.id
  );
}

function getSpecialtyDescription(specialty: Specialty) {
  const value = (specialty as Record<string, unknown>).description;
  return typeof value === "string" ? value.trim() : "";
}

function isNotFoundError(error: unknown) {
  const normalized = normalizeApiError(error);
  return (
    normalized.statusCode === 404 ||
    normalized.message.toLowerCase().includes("not found")
  );
}

async function getMemberDirectory(): Promise<MemberDirectoryResult> {
  try {
    const response = await userService.getUsers();
    return { users: (response.data ?? []) as MemberRecord[], warning: null };
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  try {
    const meResponse = await userService.getMe();
    return {
      users: meResponse.data ? [meResponse.data as MemberRecord] : [],
      warning:
        "The backend does not expose a full user directory. Showing only the signed-in account as fallback.",
    };
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  return {
    users: [],
    warning:
      "The backend does not expose a user directory endpoint, so member selection is unavailable.",
  };
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
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-600">{caption}</p>
    </article>
  );
}

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        verified
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {verified ? (
        <ShieldCheck className="size-3.5" />
      ) : (
        <ShieldAlert className="size-3.5" />
      )}
      {verified ? "Verified" : "Needs Review"}
    </span>
  );
}

function InputField({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </Label>
      <Input id={id} className={cn(inputClassName, className)} {...props} />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function TextAreaField({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </Label>
      <textarea id={id} className={cn(textareaClassName, className)} {...props} />
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function ScientistProfileFields({
  idPrefix,
  values,
  errors,
  onChange,
}: {
  idPrefix: string;
  values: UpdateScientistFormValues;
  errors: UpdateScientistFormErrors;
  onChange: (field: keyof UpdateScientistFormValues, value: string) => void;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {primaryProfileFields.map((field) => (
          <InputField
            key={`${idPrefix}-${field.key}`}
            id={`${idPrefix}-${field.key}`}
            label={field.label}
            placeholder={field.placeholder}
            type={field.type}
            min={field.min}
            step={field.step}
            value={values[field.key]}
            error={errors[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        ))}
      </div>

      <TextAreaField
        id={`${idPrefix}-researchInterests`}
        label="Research interests"
        rows={4}
        placeholder="Cardiac imaging, preventive cardiology"
        value={values.researchInterests}
        error={errors.researchInterests}
        onChange={(event) => onChange("researchInterests", event.target.value)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {secondaryProfileFields.map((field) => (
          <InputField
            key={`${idPrefix}-${field.key}`}
            id={`${idPrefix}-${field.key}`}
            label={field.label}
            placeholder={field.placeholder}
            type={field.type}
            hint={field.hint}
            value={values[field.key]}
            error={errors[field.key]}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        ))}
      </div>
    </>
  );
}

function SpecialtyChecklist({
  items,
  selectedIds,
  idPrefix,
  onToggle,
}: {
  items: Specialty[];
  selectedIds: string[];
  idPrefix: string;
  onToggle: (specialtyId: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {items.map((specialty) => {
        const checked = selectedIds.includes(specialty.id);
        return (
          <label
            key={`${idPrefix}-${specialty.id}`}
            htmlFor={`${idPrefix}-${specialty.id}`}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition",
              checked
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <input
              id={`${idPrefix}-${specialty.id}`}
              type="checkbox"
              className="mt-1 size-4 rounded border-slate-300"
              checked={checked}
              onChange={() => onToggle(specialty.id)}
            />
            <span className="space-y-1">
              <span className="block font-medium text-slate-900">
                {getSpecialtyLabel(specialty)}
              </span>
              <span className="block text-xs text-slate-500">
                {getSpecialtyDescription(specialty) || specialty.id}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default function ScientistsManagementPage() {
  const scientistsQuery = useScientistsQuery();
  const membersQuery = useQuery({
    queryKey: ["users", "scientist-promotion-members"],
    queryFn: getMemberDirectory,
  });
  const specialtiesQuery = useSpecialtiesQuery();
  const createScientistMutation = useCreateScientistMutation();
  const updateScientistMutation = useUpdateScientistMutation();
  const assignSpecialtiesMutation = useAssignScientistSpecialtiesMutation();
  const removeSpecialtyMutation = useRemoveScientistSpecialtyMutation();
  const verifyScientistMutation = useVerifyScientistMutation();
  const deleteScientistMutation = useDeleteScientistMutation();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [createForm, setCreateForm] = useState(initialCreateScientistForm);
  const [createErrors, setCreateErrors] = useState<CreateScientistFormErrors>(
    {},
  );
  const [selectedCreateSpecialtyIds, setSelectedCreateSpecialtyIds] = useState<
    string[]
  >([]);
  const [manualCreateSpecialtyIds, setManualCreateSpecialtyIds] = useState("");
  const [updateFormById, setUpdateFormById] = useState<
    Record<string, UpdateScientistFormValues>
  >({});
  const [updateErrorsById, setUpdateErrorsById] = useState<
    Record<string, UpdateScientistFormErrors>
  >({});
  const [selectedAssignSpecialtyIdsById, setSelectedAssignSpecialtyIdsById] =
    useState<Record<string, string[]>>({});
  const [manualAssignSpecialtyIdsById, setManualAssignSpecialtyIdsById] =
    useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [scientistFilter, setScientistFilter] =
    useState<ScientistFilter>("all");
  const [expandedScientistId, setExpandedScientistId] = useState<string | null>(
    null,
  );

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const scientists = scientistsQuery.data?.data ?? [];
  const memberUsers = membersQuery.data?.users ?? [];
  const memberDirectoryWarning = membersQuery.data?.warning ?? null;

  const specialties = useMemo(
    () =>
      [...(specialtiesQuery.data?.data ?? [])].sort((a, b) =>
        getSpecialtyLabel(a).localeCompare(getSpecialtyLabel(b)),
      ),
    [specialtiesQuery.data?.data],
  );

  const scientistUserIds = useMemo(() => {
    const ids = new Set<string>();

    for (const scientist of scientists) {
      const userId = getScientistUserLabel(scientist).userId;
      if (userId && userId !== "N/A") {
        ids.add(userId);
      }
    }

    return ids;
  }, [scientists]);

  const { availableMembers, memberRoleMetadataMissing } = useMemo(() => {
    const usersWithRole = memberUsers.filter((user) => extractUserRole(user));
    const roleMetadataMissing =
      memberUsers.length > 0 && usersWithRole.length === 0;
    const candidates = roleMetadataMissing
      ? memberUsers
      : memberUsers.filter((user) => extractUserRole(user) === "MEMBER");

    return {
      availableMembers: candidates
        .filter((user) => {
          const userId = getUserRecordId(user);
          return Boolean(userId) && !scientistUserIds.has(userId);
        })
        .sort((a, b) =>
          getUserRecordName(a).localeCompare(getUserRecordName(b)),
        ),
      memberRoleMetadataMissing: roleMetadataMissing,
    };
  }, [memberUsers, scientistUserIds]);

  const sortedScientists = useMemo(
    () =>
      [...scientists].sort((a, b) =>
        getScientistUserLabel(a).userName.localeCompare(
          getScientistUserLabel(b).userName,
        ),
      ),
    [scientists],
  );

  const verifiedCount = useMemo(
    () =>
      sortedScientists.filter((scientist) =>
        getScientistBoolean(scientist, "isVerified"),
      ).length,
    [sortedScientists],
  );

  const withSpecialtiesCount = useMemo(
    () =>
      sortedScientists.filter(
        (scientist) => getScientistSpecialties(scientist).length > 0,
      ).length,
    [sortedScientists],
  );

  const filteredScientists = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return sortedScientists.filter((scientist) => {
      const verified = getScientistBoolean(scientist, "isVerified");

      if (scientistFilter === "verified" && !verified) {
        return false;
      }

      if (scientistFilter === "unverified" && verified) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return getScientistSearchText(scientist).includes(normalizedQuery);
    });
  }, [deferredSearchQuery, scientistFilter, sortedScientists]);

  const createProfileValues: UpdateScientistFormValues = {
    institution: createForm.institution,
    department: createForm.department,
    specialization: createForm.specialization,
    yearsOfExperience: createForm.yearsOfExperience,
    qualification: createForm.qualification,
    researchInterests: createForm.researchInterests,
    contactNumber: createForm.contactNumber,
    address: createForm.address,
    profilePhoto: createForm.profilePhoto,
    linkedinUrl: createForm.linkedinUrl,
    googleScholarUrl: createForm.googleScholarUrl,
    orcid: createForm.orcid,
  };

  const clearFeedback = () => {
    if (feedback) {
      setFeedback(null);
    }
  };

  const onCreateFieldChange = (
    field: keyof CreateScientistFormValues,
    value: string,
  ) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
    clearFeedback();
  };

  const onUpdateFieldChange = (
    scientist: Scientist,
    field: keyof UpdateScientistFormValues,
    value: string,
  ) => {
    setUpdateFormById((prev) => ({
      ...prev,
      [scientist.id]: {
        ...(prev[scientist.id] ?? getInitialUpdateScientistForm(scientist)),
        [field]: value,
      },
    }));

    setUpdateErrorsById((prev) => {
      const current = prev[scientist.id];
      if (!current?.[field]) {
        return prev;
      }

      const nextCurrent = { ...current };
      delete nextCurrent[field];
      return { ...prev, [scientist.id]: nextCurrent };
    });

    clearFeedback();
  };

  const toggleCreateSpecialty = (specialtyId: string) => {
    setSelectedCreateSpecialtyIds((prev) =>
      prev.includes(specialtyId)
        ? prev.filter((id) => id !== specialtyId)
        : [...prev, specialtyId],
    );
    clearFeedback();
  };

  const toggleAssignSpecialty = (scientistId: string, specialtyId: string) => {
    setSelectedAssignSpecialtyIdsById((prev) => {
      const current = prev[scientistId] ?? [];
      return {
        ...prev,
        [scientistId]: current.includes(specialtyId)
          ? current.filter((id) => id !== specialtyId)
          : [...current, specialtyId],
      };
    });
    clearFeedback();
  };

  const onCreateScientist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const specialtyIds =
      selectedCreateSpecialtyIds.length > 0
        ? selectedCreateSpecialtyIds
        : parseIdList(manualCreateSpecialtyIds);

    const validation = validateCreateScientistForm(createForm);
    setCreateErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await createScientistMutation.mutateAsync({
        userId: validation.data.userId,
        scientist: validation.data.scientist,
        specialtyIds: specialtyIds.length > 0 ? specialtyIds : undefined,
      });

      setCreateForm(initialCreateScientistForm);
      setCreateErrors({});
      setSelectedCreateSpecialtyIds([]);
      setManualCreateSpecialtyIds("");
      setFeedback({
        type: "success",
        text: response.message || "Scientist created successfully.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  if (scientistsQuery.isPending) {
    return (
      <LoadingState
        title="Loading scientists"
        description="Fetching scientist records from the backend."
      />
    );
  }

  if (scientistsQuery.isError) {
    return (
      <ErrorState
        title="Could not load scientists"
        description={getApiErrorMessage(scientistsQuery.error)}
        onRetry={() => {
          void scientistsQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 shadow-sm">
        <div className="grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-cyan-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 shadow-sm">
              Admin Workspace
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Scientist governance with a cleaner control surface
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Promote eligible members, verify profiles, update structured
                records, and keep specialty assignments clean from one admin
                workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              label="Scientists"
              value={sortedScientists.length.toLocaleString()}
              caption="Active scientist profiles"
            />
            <SummaryCard
              label="Verified"
              value={verifiedCount.toLocaleString()}
              caption="Profiles already approved"
            />
            <SummaryCard
              label="With Specialties"
              value={withSpecialtiesCount.toLocaleString()}
              caption="Profiles with taxonomy coverage"
            />
            <SummaryCard
              label="Eligible Members"
              value={
                membersQuery.isPending
                  ? "..."
                  : availableMembers.length.toLocaleString()
              }
              caption="Members available for promotion"
            />
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm shadow-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,390px)_minmax(0,1fr)]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Promote Scientist
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Add a new scientist profile
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Start from an eligible member account, complete the profile, and
              assign specialties before publishing.
            </p>
          </div>

          {membersQuery.isError ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Could not load the member directory. Enter a user ID manually.{" "}
              {getApiErrorMessage(membersQuery.error)}
            </div>
          ) : null}

          {memberDirectoryWarning ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {memberDirectoryWarning}
            </div>
          ) : null}

          {memberRoleMetadataMissing ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              User role metadata is missing. All available accounts are shown as
              promotion candidates.
            </div>
          ) : null}

          <form className="mt-6 space-y-6" onSubmit={onCreateScientist}>
            <fieldset
              disabled={createScientistMutation.isPending}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="scientist-create-user-id"
                  className="text-sm font-medium text-slate-800"
                >
                  Member account
                </Label>
                {membersQuery.isError ? (
                  <Input
                    id="scientist-create-user-id"
                    value={createForm.userId}
                    className={inputClassName}
                    placeholder="Enter member user ID"
                    onChange={(event) =>
                      onCreateFieldChange("userId", event.target.value)
                    }
                  />
                ) : (
                  <select
                    id="scientist-create-user-id"
                    className={selectClassName}
                    value={createForm.userId}
                    onChange={(event) =>
                      onCreateFieldChange("userId", event.target.value)
                    }
                    disabled={
                      membersQuery.isPending || availableMembers.length === 0
                    }
                  >
                    <option value="">
                      {membersQuery.isPending
                        ? "Loading eligible members..."
                        : availableMembers.length === 0
                          ? "No eligible members found"
                          : "Select a member"}
                    </option>
                    {availableMembers.map((member) => (
                      <option
                        key={getUserRecordId(member)}
                        value={getUserRecordId(member)}
                      >
                        {getUserRecordName(member)} ({getUserRecordEmail(member)})
                      </option>
                    ))}
                  </select>
                )}
                {createErrors.userId ? (
                  <p className="text-xs text-red-600">{createErrors.userId}</p>
                ) : createForm.userId ? (
                  <p className="text-xs text-slate-500">
                    Selected user ID: {createForm.userId}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Only members without a scientist profile can be promoted.
                  </p>
                )}
              </div>

              <ScientistProfileFields
                idPrefix="create"
                values={createProfileValues}
                errors={createErrors}
                onChange={(field, value) => onCreateFieldChange(field, value)}
              />

              <div className="space-y-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Specialty assignment
                    </p>
                    <p className="text-xs text-slate-500">
                      Optional during creation.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    Selected {selectedCreateSpecialtyIds.length}
                  </span>
                </div>

                {specialtiesQuery.isPending ? (
                  <p className="text-sm text-slate-500">Loading specialties...</p>
                ) : specialtiesQuery.isError ? (
                  <Input
                    id="create-specialty-fallback"
                    className={inputClassName}
                    placeholder="id-1,id-2"
                    value={manualCreateSpecialtyIds}
                    onChange={(event) => {
                      setManualCreateSpecialtyIds(event.target.value);
                      clearFeedback();
                    }}
                  />
                ) : specialties.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No specialties are available in the directory.
                  </p>
                ) : (
                  <SpecialtyChecklist
                    items={specialties}
                    selectedIds={selectedCreateSpecialtyIds}
                    idPrefix="create-specialty"
                    onToggle={toggleCreateSpecialty}
                  />
                )}
              </div>
            </fieldset>

            <Button
              type="submit"
              className="h-11 w-full rounded-2xl text-sm"
              disabled={createScientistMutation.isPending}
            >
              {createScientistMutation.isPending
                ? "Creating scientist..."
                : "Promote member to scientist"}
            </Button>
          </form>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5 border-b border-slate-200 pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Scientist Directory
                </p>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Review and maintain scientist records
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Search by person, organization, specialty, or ID, then open a
                  management panel only when you need to change a record.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Visible now
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {filteredScientists.length.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                  Results after search and status filters
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, institution, specialty, or ID"
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-11 shadow-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All", count: sortedScientists.length },
                  { value: "verified", label: "Verified", count: verifiedCount },
                  {
                    value: "unverified",
                    label: "Needs Review",
                    count: sortedScientists.length - verifiedCount,
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                      scientistFilter === option.value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    )}
                    onClick={() =>
                      setScientistFilter(option.value as ScientistFilter)
                    }
                  >
                    {option.label}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        scientistFilter === option.value
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {sortedScientists.length === 0 ? (
              <EmptyState
                title="No scientist records found"
                description="Create a scientist record from the promotion panel."
              />
            ) : filteredScientists.length === 0 ? (
              <EmptyState
                title="No matching scientists"
                description="Try a different search term or switch the status filter."
              />
            ) : (
              <ul className="space-y-4">
                {filteredScientists.map((scientist) => {
                  const { userName, userEmail, userId } =
                    getScientistUserLabel(scientist);
                  const assignedSpecialties = getScientistSpecialties(scientist);
                  const updateForm =
                    updateFormById[scientist.id] ??
                    getInitialUpdateScientistForm(scientist);
                  const updateErrors = updateErrorsById[scientist.id] ?? {};
                  const selectedAssignIds =
                    selectedAssignSpecialtyIdsById[scientist.id] ?? [];
                  const manualAssignIds =
                    manualAssignSpecialtyIdsById[scientist.id] ?? "";
                  const assignableSpecialties = specialties.filter(
                    (specialty) =>
                      !assignedSpecialties.some((item) => item.id === specialty.id),
                  );
                  const verified = getScientistBoolean(scientist, "isVerified");
                  const isExpanded = expandedScientistId === scientist.id;
                  const isUpdating =
                    updateScientistMutation.isPending &&
                    updateScientistMutation.variables?.id === scientist.id;
                  const isVerifying =
                    verifyScientistMutation.isPending &&
                    verifyScientistMutation.variables?.id === scientist.id;
                  const isDeleting =
                    deleteScientistMutation.isPending &&
                    deleteScientistMutation.variables?.id === scientist.id;
                  const isAssigning =
                    assignSpecialtiesMutation.isPending &&
                    assignSpecialtiesMutation.variables?.id === scientist.id;

                  return (
                    <li
                      key={scientist.id}
                      className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
                    >
                      <div className="space-y-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="text-lg font-semibold text-slate-950">
                                  {userName}
                                </h4>
                                <StatusBadge verified={verified} />
                              </div>
                              <p className="text-sm text-slate-600">
                                {userEmail}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                                  Scientist ID: {scientist.id}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                                  User ID: {userId || "N/A"}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                                  {getScientistString(scientist, "specialization") ||
                                    "No specialization"}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              {[
                                [
                                  "Experience",
                                  formatExperience(
                                    getScientistNumber(
                                      scientist,
                                      "yearsOfExperience",
                                    ),
                                  ),
                                ],
                                [
                                  "Institution",
                                  getScientistString(scientist, "institution") ||
                                    "N/A",
                                ],
                                [
                                  "Department",
                                  getScientistString(scientist, "department") ||
                                    "N/A",
                                ],
                                [
                                  "Updated",
                                  formatDate(
                                    getScientistString(scientist, "updatedAt"),
                                  ),
                                ],
                              ].map(([label, value]) => (
                                <div
                                  key={label}
                                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                >
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                    {label}
                                  </p>
                                  <p className="mt-2 text-sm font-medium text-slate-800">
                                    {value}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {assignedSpecialties.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {assignedSpecialties
                                  .slice(0, 4)
                                  .map((specialty) => (
                                    <span
                                      key={specialty.id}
                                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                                    >
                                      {specialty.label}
                                    </span>
                                  ))}
                                {assignedSpecialties.length > 4 ? (
                                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                    +{assignedSpecialties.length - 4} more
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">
                                No specialties assigned yet.
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            <Button
                              type="button"
                              variant={isExpanded ? "secondary" : "outline"}
                              className="rounded-2xl"
                              onClick={() => {
                                setUpdateFormById((prev) =>
                                  prev[scientist.id]
                                    ? prev
                                    : {
                                        ...prev,
                                        [scientist.id]:
                                          getInitialUpdateScientistForm(
                                            scientist,
                                          ),
                                      },
                                );
                                setExpandedScientistId((prev) =>
                                  prev === scientist.id ? null : scientist.id,
                                );
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="size-4" />
                              ) : (
                                <ChevronDown className="size-4" />
                              )}
                              {isExpanded ? "Hide management" : "Manage profile"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-2xl"
                              disabled={isVerifying}
                              onClick={async () => {
                                setFeedback(null);
                                try {
                                  const response =
                                    await verifyScientistMutation.mutateAsync({
                                      id: scientist.id,
                                      payload: { verified: !verified },
                                    });
                                  setFeedback({
                                    type: "success",
                                    text:
                                      response.message ||
                                      "Scientist verification updated.",
                                  });
                                } catch (error) {
                                  setFeedback({
                                    type: "error",
                                    text: getApiErrorMessage(error),
                                  });
                                }
                              }}
                            >
                              {isVerifying
                                ? "Updating..."
                                : verified
                                  ? "Mark unverified"
                                  : "Verify scientist"}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              className="rounded-2xl"
                              disabled={isDeleting}
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  "Demote this scientist to member? This action removes the scientist record.",
                                );
                                if (!confirmed) {
                                  return;
                                }
                                setFeedback(null);
                                try {
                                  const response =
                                    await deleteScientistMutation.mutateAsync({
                                      id: scientist.id,
                                    });
                                  if (expandedScientistId === scientist.id) {
                                    setExpandedScientistId(null);
                                  }
                                  setUpdateFormById((prev) =>
                                    omitRecordKey(prev, scientist.id),
                                  );
                                  setUpdateErrorsById((prev) =>
                                    omitRecordKey(prev, scientist.id),
                                  );
                                  setSelectedAssignSpecialtyIdsById((prev) =>
                                    omitRecordKey(prev, scientist.id),
                                  );
                                  setManualAssignSpecialtyIdsById((prev) =>
                                    omitRecordKey(prev, scientist.id),
                                  );
                                  setFeedback({
                                    type: "success",
                                    text:
                                      response.message ||
                                      "Scientist demoted successfully.",
                                  });
                                } catch (error) {
                                  setFeedback({
                                    type: "error",
                                    text: getApiErrorMessage(error),
                                  });
                                }
                              }}
                            >
                              {isDeleting ? "Demoting..." : "Demote"}
                            </Button>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="grid gap-4 border-t border-slate-200 pt-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                            <form
                              className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"
                              onSubmit={async (event) => {
                                event.preventDefault();
                                setFeedback(null);
                                const validation =
                                  validateUpdateScientistForm(updateForm);
                                setUpdateErrorsById((prev) => ({
                                  ...prev,
                                  [scientist.id]: validation.errors,
                                }));
                                if (!validation.success) {
                                  setFeedback({
                                    type: "error",
                                    text: validation.message,
                                  });
                                  return;
                                }
                                try {
                                  const response =
                                    await updateScientistMutation.mutateAsync({
                                      id: scientist.id,
                                      payload: validation.data,
                                    });
                                  setFeedback({
                                    type: "success",
                                    text:
                                      response.message ||
                                      "Scientist updated successfully.",
                                  });
                                } catch (error) {
                                  setFeedback({
                                    type: "error",
                                    text: getApiErrorMessage(error),
                                  });
                                }
                              }}
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  Profile Editor
                                </p>
                                <h5 className="text-xl font-semibold tracking-tight text-slate-950">
                                  Update scientist profile
                                </h5>
                              </div>

                              <fieldset
                                disabled={isUpdating}
                                className="mt-5 space-y-5"
                              >
                                <ScientistProfileFields
                                  idPrefix={`update-${scientist.id}`}
                                  values={updateForm}
                                  errors={updateErrors}
                                  onChange={(field, value) =>
                                    onUpdateFieldChange(scientist, field, value)
                                  }
                                />
                              </fieldset>

                              <div className="mt-5 flex justify-end">
                                <Button
                                  type="submit"
                                  className="rounded-2xl"
                                  disabled={isUpdating}
                                >
                                  {isUpdating
                                    ? "Saving changes..."
                                    : "Save profile changes"}
                                </Button>
                              </div>
                            </form>

                            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    Specialty Management
                                  </p>
                                  <h5 className="text-xl font-semibold tracking-tight text-slate-950">
                                    Curate expertise tags
                                  </h5>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                  {assignedSpecialties.length} assigned
                                </span>
                              </div>

                              <div className="mt-4 space-y-4">
                                {assignedSpecialties.length === 0 ? (
                                  <p className="text-sm text-slate-500">
                                    No specialties assigned yet.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {assignedSpecialties.map((specialty) => {
                                      const removingCurrent =
                                        removeSpecialtyMutation.isPending &&
                                        removeSpecialtyMutation.variables?.id ===
                                          scientist.id &&
                                        removeSpecialtyMutation.variables
                                          ?.specialtyId === specialty.id;

                                      return (
                                        <button
                                          key={specialty.id}
                                          type="button"
                                          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                                          disabled={removingCurrent}
                                          onClick={async () => {
                                            setFeedback(null);
                                            try {
                                              const response =
                                                await removeSpecialtyMutation.mutateAsync(
                                                  {
                                                    id: scientist.id,
                                                    specialtyId: specialty.id,
                                                  },
                                                );
                                              setFeedback({
                                                type: "success",
                                                text:
                                                  response.message ||
                                                  `Specialty removed: ${specialty.label}`,
                                              });
                                            } catch (error) {
                                              setFeedback({
                                                type: "error",
                                                text: getApiErrorMessage(error),
                                              });
                                            }
                                          }}
                                        >
                                          {removingCurrent
                                            ? "Removing..."
                                            : `Remove ${specialty.label}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                      Assign new specialties
                                    </p>
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                      Selected {selectedAssignIds.length}
                                    </span>
                                  </div>

                                  {specialtiesQuery.isPending ? (
                                    <p className="mt-4 text-sm text-slate-500">
                                      Loading specialties...
                                    </p>
                                  ) : specialtiesQuery.isError ? (
                                    <Input
                                      id={`assign-fallback-${scientist.id}`}
                                      className={cn(inputClassName, "mt-4")}
                                      placeholder="id-1,id-2"
                                      value={manualAssignIds}
                                      onChange={(event) =>
                                        setManualAssignSpecialtyIdsById(
                                          (prev) => ({
                                            ...prev,
                                            [scientist.id]:
                                              event.target.value,
                                          }),
                                        )
                                      }
                                    />
                                  ) : assignableSpecialties.length === 0 ? (
                                    <p className="mt-4 text-sm text-slate-500">
                                      All available specialties are already
                                      assigned.
                                    </p>
                                  ) : (
                                    <div className="mt-4">
                                      <SpecialtyChecklist
                                        items={assignableSpecialties}
                                        selectedIds={selectedAssignIds}
                                        idPrefix={`assign-${scientist.id}`}
                                        onToggle={(specialtyId) =>
                                          toggleAssignSpecialty(
                                            scientist.id,
                                            specialtyId,
                                          )
                                        }
                                      />
                                    </div>
                                  )}

                                  <div className="mt-4 flex justify-end">
                                    <Button
                                      type="button"
                                      className="rounded-2xl"
                                      disabled={isAssigning}
                                      onClick={async () => {
                                        const specialtyIds =
                                          specialtiesQuery.isError
                                            ? parseIdList(manualAssignIds)
                                            : selectedAssignIds;

                                        if (specialtyIds.length === 0) {
                                          setFeedback({
                                            type: "error",
                                            text: specialtiesQuery.isError
                                              ? "Provide at least one specialty ID to assign."
                                              : "Select at least one specialty to assign.",
                                          });
                                          return;
                                        }

                                        setFeedback(null);
                                        try {
                                          const response =
                                            await assignSpecialtiesMutation.mutateAsync(
                                              {
                                                id: scientist.id,
                                                payload: { specialtyIds },
                                              },
                                            );
                                          setSelectedAssignSpecialtyIdsById(
                                            (prev) => ({
                                              ...prev,
                                              [scientist.id]: [],
                                            }),
                                          );
                                          setManualAssignSpecialtyIdsById(
                                            (prev) => ({
                                              ...prev,
                                              [scientist.id]: "",
                                            }),
                                          );
                                          setFeedback({
                                            type: "success",
                                            text:
                                              response.message ||
                                              "Specialties assigned successfully.",
                                          });
                                        } catch (error) {
                                          setFeedback({
                                            type: "error",
                                            text: getApiErrorMessage(error),
                                          });
                                        }
                                      }}
                                    >
                                      {isAssigning
                                        ? "Assigning..."
                                        : "Assign specialties"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </section>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
