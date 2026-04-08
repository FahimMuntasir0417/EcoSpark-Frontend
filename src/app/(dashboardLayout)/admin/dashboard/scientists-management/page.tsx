
"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
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
import type { Scientist } from "@/services/scientist.service";
import type { Specialty } from "@/services/specialty.service";
import { userService } from "@/services/user.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type ScientistSpecialty = {
  id: string;
  label: string;
};

type MemberRecord = Record<string, unknown>;

type MemberDirectoryResult = {
  users: MemberRecord[];
  source: "list" | "self" | "none";
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

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateCreateScientistForm(values: CreateScientistFormValues) {
  const errors: CreateScientistFormErrors = {};

  const userId = values.userId.trim();
  const institution = values.institution.trim();
  const department = values.department.trim();
  const specialization = values.specialization.trim();
  const qualification = values.qualification.trim();
  const researchInterests = values.researchInterests.trim();
  const yearsRaw = values.yearsOfExperience.trim();

  if (!userId) {
    errors.userId = "Member selection is required.";
  }

  if (!institution) {
    errors.institution = "Institution is required.";
  }

  if (!department) {
    errors.department = "Department is required.";
  }

  if (!specialization) {
    errors.specialization = "Specialization is required.";
  }

  if (!qualification) {
    errors.qualification = "Qualification is required.";
  }

  if (!researchInterests) {
    errors.researchInterests = "Research interests are required.";
  }

  if (!yearsRaw) {
    errors.yearsOfExperience = "Years of experience is required.";
  }

  const years = Number(yearsRaw);

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
        Object.values(errors).find((error) => Boolean(error)) ??
        "Invalid scientist profile input.",
    };
  }

  const scientistPayload: Record<string, unknown> = {
    institution,
    department,
    specialization,
    yearsOfExperience: years,
    qualification,
    researchInterests,
  };

  const contactNumber = trimToUndefined(values.contactNumber);
  const address = trimToUndefined(values.address);
  const orcid = trimToUndefined(values.orcid);

  if (contactNumber) {
    scientistPayload.contactNumber = contactNumber;
  }

  if (address) {
    scientistPayload.address = address;
  }

  if (profilePhoto) {
    scientistPayload.profilePhoto = profilePhoto;
  }

  if (linkedinUrl) {
    scientistPayload.linkedinUrl = linkedinUrl;
  }

  if (googleScholarUrl) {
    scientistPayload.googleScholarUrl = googleScholarUrl;
  }

  if (orcid) {
    scientistPayload.orcid = orcid;
  }

  return {
    success: true as const,
    data: {
      userId,
      scientist: scientistPayload,
    },
    errors: {} as CreateScientistFormErrors,
  };
}

function validateUpdateScientistForm(values: UpdateScientistFormValues) {
  const errors: UpdateScientistFormErrors = {};

  const institution = values.institution.trim();
  const department = values.department.trim();
  const specialization = values.specialization.trim();
  const qualification = values.qualification.trim();
  const researchInterests = values.researchInterests.trim();
  const yearsRaw = values.yearsOfExperience.trim();

  if (!institution) {
    errors.institution = "Institution is required.";
  }

  if (!department) {
    errors.department = "Department is required.";
  }

  if (!specialization) {
    errors.specialization = "Specialization is required.";
  }

  if (!qualification) {
    errors.qualification = "Qualification is required.";
  }

  if (!researchInterests) {
    errors.researchInterests = "Research interests are required.";
  }

  if (!yearsRaw) {
    errors.yearsOfExperience = "Years of experience is required.";
  }

  const years = Number(yearsRaw);

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
        Object.values(errors).find((error) => Boolean(error)) ??
        "Invalid scientist update input.",
    };
  }

  const payload: Record<string, unknown> = {
    institution,
    department,
    specialization,
    yearsOfExperience: years,
    qualification,
    researchInterests,
  };

  const contactNumber = trimToUndefined(values.contactNumber);
  const address = trimToUndefined(values.address);
  const orcid = trimToUndefined(values.orcid);

  if (contactNumber) {
    payload.contactNumber = contactNumber;
  }

  if (address) {
    payload.address = address;
  }

  if (profilePhoto) {
    payload.profilePhoto = profilePhoto;
  }

  if (linkedinUrl) {
    payload.linkedinUrl = linkedinUrl;
  }

  if (googleScholarUrl) {
    payload.googleScholarUrl = googleScholarUrl;
  }

  if (orcid) {
    payload.orcid = orcid;
  }

  return {
    success: true as const,
    data: payload,
    errors: {} as UpdateScientistFormErrors,
  };
}

function formatDate(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString();
}

function getScientistSpecialties(scientist: Scientist): ScientistSpecialty[] {
  const record = scientist as unknown as Record<string, unknown>;
  const rawSpecialties = record.scientistSpecialties;

  if (!Array.isArray(rawSpecialties)) {
    return [];
  }

  const result: ScientistSpecialty[] = [];

  for (const rawItem of rawSpecialties) {
    if (!rawItem || typeof rawItem !== "object") {
      continue;
    }

    const item = rawItem as Record<string, unknown>;
    const nested =
      item.specialty && typeof item.specialty === "object"
        ? (item.specialty as Record<string, unknown>)
        : item;

    const id =
      (typeof nested.id === "string" && nested.id) ||
      (typeof item.specialtyId === "string" && item.specialtyId) ||
      "";

    if (!id) {
      continue;
    }

    const label =
      (typeof nested.name === "string" && nested.name) ||
      (typeof nested.title === "string" && nested.title) ||
      id;

    result.push({ id, label });
  }

  return result;
}

function getScientistUserLabel(scientist: Scientist) {
  const record = scientist as unknown as Record<string, unknown>;
  const linkedUser =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;

  const userName =
    linkedUser && typeof linkedUser.name === "string" && linkedUser.name.trim()
      ? linkedUser.name
      : "Unknown user";

  const userEmail =
    linkedUser && typeof linkedUser.email === "string" && linkedUser.email.trim()
      ? linkedUser.email
      : "N/A";

  const userId =
    (typeof scientist.userId === "string" && scientist.userId) ||
    (linkedUser && typeof linkedUser.id === "string" ? linkedUser.id : "N/A");

  return { userName, userEmail, userId };
}

function getScientistUserId(scientist: Scientist) {
  const userId = getScientistUserLabel(scientist).userId;

  if (!userId || userId === "N/A") {
    return null;
  }

  return userId;
}

function getScientistBoolean(scientist: Scientist, key: string) {
  const record = scientist as unknown as Record<string, unknown>;
  const value = record[key];
  return typeof value === "boolean" ? value : false;
}

function getScientistString(scientist: Scientist, key: string) {
  const record = scientist as unknown as Record<string, unknown>;
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function getScientistNumber(scientist: Scientist, key: string) {
  const record = scientist as unknown as Record<string, unknown>;
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getInitialUpdateScientistForm(scientist: Scientist): UpdateScientistFormValues {
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
  return typeof user.email === "string" && user.email.trim() ? user.email : "N/A";
}

function getSpecialtyLabel(specialty: Specialty) {
  const record = specialty as unknown as Record<string, unknown>;

  return (
    (typeof record.name === "string" && record.name) ||
    (typeof record.title === "string" && record.title) ||
    specialty.id
  );
}

function getSpecialtyDescription(specialty: Specialty) {
  const record = specialty as unknown as Record<string, unknown>;
  return typeof record.description === "string" ? record.description : "";
}

function isNotFoundError(error: unknown) {
  const normalized = normalizeApiError(error);

  if (normalized.statusCode === 404) {
    return true;
  }

  return normalized.message.toLowerCase().includes("not found");
}

async function getMemberDirectory(): Promise<MemberDirectoryResult> {
  try {
    const response = await userService.getUsers();
    return {
      users: (response.data ?? []) as MemberRecord[],
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
        users: meResponse.data ? [meResponse.data as MemberRecord] : [],
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
          "The backend does not expose a user directory endpoint, so member selection is unavailable.",
      };
    }
  }
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
  const [createForm, setCreateForm] = useState<CreateScientistFormValues>(
    initialCreateScientistForm,
  );
  const [createErrors, setCreateErrors] = useState<CreateScientistFormErrors>({});
  const [selectedCreateSpecialtyIds, setSelectedCreateSpecialtyIds] = useState<string[]>(
    [],
  );
  const [manualCreateSpecialtyIds, setManualCreateSpecialtyIds] = useState("");
  const [updateFormById, setUpdateFormById] = useState<
    Record<string, UpdateScientistFormValues>
  >({});
  const [updateErrorsById, setUpdateErrorsById] = useState<
    Record<string, UpdateScientistFormErrors>
  >({});
  const [selectedAssignSpecialtyIdsById, setSelectedAssignSpecialtyIdsById] = useState<
    Record<string, string[]>
  >({});
  const [manualAssignSpecialtyIdsById, setManualAssignSpecialtyIdsById] = useState<
    Record<string, string>
  >({});

  const scientists = scientistsQuery.data?.data ?? [];
  const memberDirectory = membersQuery.data;
  const memberUsers = memberDirectory?.users ?? [];
  const memberDirectoryWarning = memberDirectory?.warning ?? null;

  const scientistUserIds = useMemo(() => {
    const ids = new Set<string>();

    for (const scientist of scientists) {
      const userId = getScientistUserId(scientist);

      if (userId) {
        ids.add(userId);
      }
    }

    return ids;
  }, [scientists]);

  const { availableMembers, memberRoleMetadataMissing } = useMemo(() => {
    const usersWithRole = memberUsers.filter((user) => extractUserRole(user));
    const roleMetadataMissing =
      memberUsers.length > 0 && usersWithRole.length === 0;

    const roleFilteredMembers = roleMetadataMissing
      ? memberUsers
      : memberUsers.filter((user) => extractUserRole(user) === "MEMBER");

    const members = roleFilteredMembers
      .filter((user) => {
        const userId = getUserRecordId(user);

        return Boolean(userId) && !scientistUserIds.has(userId);
      })
      .sort((a, b) => getUserRecordName(a).localeCompare(getUserRecordName(b)));

    return {
      availableMembers: members,
      memberRoleMetadataMissing: roleMetadataMissing,
    };
  }, [memberUsers, scientistUserIds]);

  const selectedMember = useMemo(
    () =>
      availableMembers.find((member) => getUserRecordId(member) === createForm.userId) ??
      null,
    [availableMembers, createForm.userId],
  );

  const specialties = useMemo(
    () =>
      [...(specialtiesQuery.data?.data ?? [])].sort((a, b) =>
        getSpecialtyLabel(a).localeCompare(getSpecialtyLabel(b)),
      ),
    [specialtiesQuery.data?.data],
  );

  const onCreateFieldChange = (
    field: keyof CreateScientistFormValues,
    value: string,
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setCreateErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });

    if (feedback) {
      setFeedback(null);
    }
  };

  const toggleCreateSpecialty = (specialtyId: string) => {
    setSelectedCreateSpecialtyIds((prev) =>
      prev.includes(specialtyId)
        ? prev.filter((id) => id !== specialtyId)
        : [...prev, specialtyId],
    );

    if (feedback) {
      setFeedback(null);
    }
  };

  const toggleAssignSpecialty = (scientistId: string, specialtyId: string) => {
    setSelectedAssignSpecialtyIdsById((prev) => {
      const current = prev[scientistId] ?? [];
      const next = current.includes(specialtyId)
        ? current.filter((id) => id !== specialtyId)
        : [...current, specialtyId];

      return {
        ...prev,
        [scientistId]: next,
      };
    });

    if (feedback) {
      setFeedback(null);
    }
  };

  const onCreateScientist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    const specialtyIdsFromSelection =
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
        specialtyIds:
          specialtyIdsFromSelection.length > 0
            ? specialtyIdsFromSelection
            : undefined,
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
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Scientists CRUD Management</h2>
          <p className="text-sm text-muted-foreground">
            Promote members, update structured scientist profiles, verify or
            unverify, assign specialties, remove specialties, and demote
            scientists.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
          Total Scientists: {scientists.length}
        </div>
      </div>

      {feedback ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <section className="rounded-xl border bg-background p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Promote Member To Scientist</h3>
          <p className="text-sm text-muted-foreground">
            Select a member, choose specialties, and complete a structured scientist
            profile form.
          </p>
        </div>

        {memberDirectoryWarning ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {memberDirectoryWarning}
          </p>
        ) : null}

        {memberRoleMetadataMissing ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            User role metadata is missing from the response. Showing all available
            accounts as selectable members.
          </p>
        ) : null}

        <form className="space-y-6" onSubmit={onCreateScientist}>
          <fieldset disabled={createScientistMutation.isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scientist-create-user-id">Member</Label>

                {membersQuery.isError ? (
                  <Input
                    id="scientist-create-user-id"
                    name="userId"
                    placeholder="Enter member user ID"
                    value={createForm.userId}
                    onChange={(event) =>
                      onCreateFieldChange("userId", event.target.value)
                    }
                  />
                ) : (
                  <select
                    id="scientist-create-user-id"
                    name="userId"
                    className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                    value={createForm.userId}
                    onChange={(event) =>
                      onCreateFieldChange("userId", event.target.value)
                    }
                    disabled={membersQuery.isPending || availableMembers.length === 0}
                  >
                    <option value="">
                      {membersQuery.isPending
                        ? "Loading members..."
                        : availableMembers.length === 0
                          ? "No eligible members found"
                          : "Select a member"}
                    </option>
                    {availableMembers.map((member) => {
                      const userId = getUserRecordId(member);
                      const userName = getUserRecordName(member);
                      const userEmail = getUserRecordEmail(member);

                      return (
                        <option key={userId} value={userId}>
                          {userName} ({userEmail})
                        </option>
                      );
                    })}
                  </select>
                )}

                {createErrors.userId ? (
                  <p className="text-xs text-red-600">{createErrors.userId}</p>
                ) : selectedMember ? (
                  <p className="text-xs text-muted-foreground">
                    Selected: {getUserRecordName(selectedMember)} (
                    {getUserRecordEmail(selectedMember)})
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Only non-scientist members are listed.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-years">Years Of Experience</Label>
                <Input
                  id="scientist-create-years"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="8"
                  value={createForm.yearsOfExperience}
                  onChange={(event) =>
                    onCreateFieldChange("yearsOfExperience", event.target.value)
                  }
                  required
                />
                {createErrors.yearsOfExperience ? (
                  <p className="text-xs text-red-600">
                    {createErrors.yearsOfExperience}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scientist-create-institution">Institution</Label>
                <Input
                  id="scientist-create-institution"
                  placeholder="Dhaka Medical College"
                  value={createForm.institution}
                  onChange={(event) =>
                    onCreateFieldChange("institution", event.target.value)
                  }
                  required
                />
                {createErrors.institution ? (
                  <p className="text-xs text-red-600">{createErrors.institution}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-department">Department</Label>
                <Input
                  id="scientist-create-department"
                  placeholder="Cardiology"
                  value={createForm.department}
                  onChange={(event) =>
                    onCreateFieldChange("department", event.target.value)
                  }
                  required
                />
                {createErrors.department ? (
                  <p className="text-xs text-red-600">{createErrors.department}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-specialization">Specialization</Label>
                <Input
                  id="scientist-create-specialization"
                  placeholder="Heart Disease"
                  value={createForm.specialization}
                  onChange={(event) =>
                    onCreateFieldChange("specialization", event.target.value)
                  }
                  required
                />
                {createErrors.specialization ? (
                  <p className="text-xs text-red-600">{createErrors.specialization}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-qualification">Qualification</Label>
                <Input
                  id="scientist-create-qualification"
                  placeholder="MBBS, MD"
                  value={createForm.qualification}
                  onChange={(event) =>
                    onCreateFieldChange("qualification", event.target.value)
                  }
                  required
                />
                {createErrors.qualification ? (
                  <p className="text-xs text-red-600">{createErrors.qualification}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scientist-create-interests">Research Interests</Label>
              <textarea
                id="scientist-create-interests"
                rows={4}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                placeholder="Cardiac imaging, preventive cardiology"
                value={createForm.researchInterests}
                onChange={(event) =>
                  onCreateFieldChange("researchInterests", event.target.value)
                }
                required
              />
              {createErrors.researchInterests ? (
                <p className="text-xs text-red-600">{createErrors.researchInterests}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scientist-create-contact">Contact Number (optional)</Label>
                <Input
                  id="scientist-create-contact"
                  placeholder="01700000000"
                  value={createForm.contactNumber}
                  onChange={(event) =>
                    onCreateFieldChange("contactNumber", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-address">Address (optional)</Label>
                <Input
                  id="scientist-create-address"
                  placeholder="Dhaka, Bangladesh"
                  value={createForm.address}
                  onChange={(event) =>
                    onCreateFieldChange("address", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-photo">Profile Photo URL (optional)</Label>
                <Input
                  id="scientist-create-photo"
                  type="url"
                  placeholder="https://example.com/profile.jpg"
                  value={createForm.profilePhoto}
                  onChange={(event) =>
                    onCreateFieldChange("profilePhoto", event.target.value)
                  }
                />
                {createErrors.profilePhoto ? (
                  <p className="text-xs text-red-600">{createErrors.profilePhoto}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-linkedin">LinkedIn URL (optional)</Label>
                <Input
                  id="scientist-create-linkedin"
                  type="url"
                  placeholder="https://www.linkedin.com/in/example"
                  value={createForm.linkedinUrl}
                  onChange={(event) =>
                    onCreateFieldChange("linkedinUrl", event.target.value)
                  }
                />
                {createErrors.linkedinUrl ? (
                  <p className="text-xs text-red-600">{createErrors.linkedinUrl}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-scholar">
                  Google Scholar URL (optional)
                </Label>
                <Input
                  id="scientist-create-scholar"
                  type="url"
                  placeholder="https://scholar.google.com/citations?user=example"
                  value={createForm.googleScholarUrl}
                  onChange={(event) =>
                    onCreateFieldChange("googleScholarUrl", event.target.value)
                  }
                />
                {createErrors.googleScholarUrl ? (
                  <p className="text-xs text-red-600">
                    {createErrors.googleScholarUrl}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scientist-create-orcid">ORCID (optional)</Label>
                <Input
                  id="scientist-create-orcid"
                  placeholder="0000-0002-1825-0097"
                  value={createForm.orcid}
                  onChange={(event) => onCreateFieldChange("orcid", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Specialties (optional)</p>
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedCreateSpecialtyIds.length}
                </p>
              </div>

              {specialtiesQuery.isPending ? (
                <p className="text-sm text-muted-foreground">
                  Loading specialties...
                </p>
              ) : specialtiesQuery.isError ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">
                    Could not load specialties. Enter specialty IDs manually.
                  </p>
                  <Input
                    id="scientist-create-specialties-fallback"
                    placeholder="id-1,id-2"
                    value={manualCreateSpecialtyIds}
                    onChange={(event) => {
                      setManualCreateSpecialtyIds(event.target.value);
                      if (feedback) {
                        setFeedback(null);
                      }
                    }}
                  />
                </div>
              ) : specialties.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No specialties found in the directory.
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {specialties.map((specialty) => {
                    const label = getSpecialtyLabel(specialty);
                    const description = getSpecialtyDescription(specialty);
                    const checked = selectedCreateSpecialtyIds.includes(specialty.id);

                    return (
                      <label
                        key={specialty.id}
                        htmlFor={`create-specialty-${specialty.id}`}
                        className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <input
                          id={`create-specialty-${specialty.id}`}
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border-slate-300"
                          checked={checked}
                          onChange={() => toggleCreateSpecialty(specialty.id)}
                        />
                        <span className="space-y-1">
                          <span className="block font-medium">{label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {description || specialty.id}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </fieldset>

          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={createScientistMutation.isPending}>
              {createScientistMutation.isPending ? "Creating..." : "Promote Member"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">All Scientists</h3>

        {scientists.length === 0 ? (
          <EmptyState
            title="No scientist records found"
            description="Create a scientist record from the form above."
          />
        ) : (
          <ul className="space-y-4">
            {scientists.map((scientist) => {
              const { userName, userEmail, userId } = getScientistUserLabel(scientist);
              const assignedSpecialties = getScientistSpecialties(scientist);
              const updateForm =
                updateFormById[scientist.id] ?? getInitialUpdateScientistForm(scientist);
              const updateErrors = updateErrorsById[scientist.id] ?? {};
              const selectedAssignSpecialtyIds =
                selectedAssignSpecialtyIdsById[scientist.id] ?? [];
              const manualAssignSpecialtyIds =
                manualAssignSpecialtyIdsById[scientist.id] ?? "";
              const assignedSpecialtyIdSet = new Set(
                assignedSpecialties.map((specialty) => specialty.id),
              );
              const assignableSpecialties = specialties.filter(
                (specialty) => !assignedSpecialtyIdSet.has(specialty.id),
              );
              const isVerifying =
                verifyScientistMutation.isPending &&
                verifyScientistMutation.variables?.id === scientist.id;
              const isDeleting =
                deleteScientistMutation.isPending &&
                deleteScientistMutation.variables?.id === scientist.id;
              const isUpdating =
                updateScientistMutation.isPending &&
                updateScientistMutation.variables?.id === scientist.id;
              const isAssigning =
                assignSpecialtiesMutation.isPending &&
                assignSpecialtiesMutation.variables?.id === scientist.id;
              const isRemovingSpecialty =
                removeSpecialtyMutation.isPending &&
                removeSpecialtyMutation.variables?.id === scientist.id;

              return (
                <li key={scientist.id} className="rounded-xl border bg-background p-4">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium">{userName}</p>
                        <p className="text-sm text-muted-foreground">{userEmail}</p>
                        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                          <p>Scientist ID: {scientist.id}</p>
                          <p>User ID: {userId || "N/A"}</p>
                          <p>
                            Verified:{" "}
                            {getScientistBoolean(scientist, "isVerified") ? "Yes" : "No"}
                          </p>
                          <p>Institution: {getScientistString(scientist, "institution") || "N/A"}</p>
                          <p>Created: {formatDate(getScientistString(scientist, "createdAt"))}</p>
                          <p>Updated: {formatDate(getScientistString(scientist, "updatedAt"))}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isVerifying}
                          onClick={async () => {
                            setFeedback(null);
                            try {
                              const response = await verifyScientistMutation.mutateAsync({
                                id: scientist.id,
                                payload: {
                                  verified: !getScientistBoolean(scientist, "isVerified"),
                                },
                              });
                              setFeedback({
                                type: "success",
                                text: response.message || "Scientist verification updated.",
                              });
                            } catch (error) {
                              setFeedback({ type: "error", text: getApiErrorMessage(error) });
                            }
                          }}
                        >
                          {isVerifying
                            ? "Updating..."
                            : getScientistBoolean(scientist, "isVerified")
                              ? "Mark Unverified"
                              : "Verify"}
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          disabled={isDeleting}
                          onClick={async () => {
                            const confirmed = window.confirm(
                              "Demote this scientist to member? This action removes scientist record.",
                            );

                            if (!confirmed) {
                              return;
                            }

                            setFeedback(null);
                            try {
                              const response = await deleteScientistMutation.mutateAsync({
                                id: scientist.id,
                              });
                              setFeedback({
                                type: "success",
                                text: response.message || "Scientist demoted successfully.",
                              });
                            } catch (error) {
                              setFeedback({ type: "error", text: getApiErrorMessage(error) });
                            }
                          }}
                        >
                          {isDeleting ? "Demoting..." : "Demote"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold">Update Scientist Profile</p>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`update-institution-${scientist.id}`}>Institution</Label>
                          <Input
                            id={`update-institution-${scientist.id}`}
                            value={updateForm.institution}
                            onChange={(event) => {
                              const value = event.target.value;
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  institution: value,
                                },
                              }));

                              setUpdateErrorsById((prev) => {
                                const current = prev[scientist.id];

                                if (!current?.institution) {
                                  return prev;
                                }

                                const nextCurrent = { ...current };
                                delete nextCurrent.institution;

                                return {
                                  ...prev,
                                  [scientist.id]: nextCurrent,
                                };
                              });

                              if (feedback) {
                                setFeedback(null);
                              }
                            }}
                          />
                          {updateErrors.institution ? (
                            <p className="text-xs text-red-600">{updateErrors.institution}</p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`update-department-${scientist.id}`}>Department</Label>
                          <Input
                            id={`update-department-${scientist.id}`}
                            value={updateForm.department}
                            onChange={(event) => {
                              const value = event.target.value;
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  department: value,
                                },
                              }));

                              setUpdateErrorsById((prev) => {
                                const current = prev[scientist.id];

                                if (!current?.department) {
                                  return prev;
                                }

                                const nextCurrent = { ...current };
                                delete nextCurrent.department;

                                return {
                                  ...prev,
                                  [scientist.id]: nextCurrent,
                                };
                              });

                              if (feedback) {
                                setFeedback(null);
                              }
                            }}
                          />
                          {updateErrors.department ? (
                            <p className="text-xs text-red-600">{updateErrors.department}</p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`update-specialization-${scientist.id}`}>
                            Specialization
                          </Label>
                          <Input
                            id={`update-specialization-${scientist.id}`}
                            value={updateForm.specialization}
                            onChange={(event) => {
                              const value = event.target.value;
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  specialization: value,
                                },
                              }));

                              setUpdateErrorsById((prev) => {
                                const current = prev[scientist.id];

                                if (!current?.specialization) {
                                  return prev;
                                }

                                const nextCurrent = { ...current };
                                delete nextCurrent.specialization;

                                return {
                                  ...prev,
                                  [scientist.id]: nextCurrent,
                                };
                              });

                              if (feedback) {
                                setFeedback(null);
                              }
                            }}
                          />
                          {updateErrors.specialization ? (
                            <p className="text-xs text-red-600">
                              {updateErrors.specialization}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`update-years-${scientist.id}`}>
                            Years Of Experience
                          </Label>
                          <Input
                            id={`update-years-${scientist.id}`}
                            type="number"
                            min={0}
                            step={1}
                            value={updateForm.yearsOfExperience}
                            onChange={(event) => {
                              const value = event.target.value;
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  yearsOfExperience: value,
                                },
                              }));

                              setUpdateErrorsById((prev) => {
                                const current = prev[scientist.id];

                                if (!current?.yearsOfExperience) {
                                  return prev;
                                }

                                const nextCurrent = { ...current };
                                delete nextCurrent.yearsOfExperience;

                                return {
                                  ...prev,
                                  [scientist.id]: nextCurrent,
                                };
                              });

                              if (feedback) {
                                setFeedback(null);
                              }
                            }}
                          />
                          {updateErrors.yearsOfExperience ? (
                            <p className="text-xs text-red-600">
                              {updateErrors.yearsOfExperience}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <Label htmlFor={`update-qualification-${scientist.id}`}>
                            Qualification
                          </Label>
                          <Input
                            id={`update-qualification-${scientist.id}`}
                            value={updateForm.qualification}
                            onChange={(event) => {
                              const value = event.target.value;
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  qualification: value,
                                },
                              }));

                              setUpdateErrorsById((prev) => {
                                const current = prev[scientist.id];

                                if (!current?.qualification) {
                                  return prev;
                                }

                                const nextCurrent = { ...current };
                                delete nextCurrent.qualification;

                                return {
                                  ...prev,
                                  [scientist.id]: nextCurrent,
                                };
                              });

                              if (feedback) {
                                setFeedback(null);
                              }
                            }}
                          />
                          {updateErrors.qualification ? (
                            <p className="text-xs text-red-600">{updateErrors.qualification}</p>
                          ) : null}
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <Label htmlFor={`update-interests-${scientist.id}`}>
                            Research Interests
                          </Label>
                          <textarea
                            id={`update-interests-${scientist.id}`}
                            rows={3}
                            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                            value={updateForm.researchInterests}
                            onChange={(event) => {
                              const value = event.target.value;
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  researchInterests: value,
                                },
                              }));

                              setUpdateErrorsById((prev) => {
                                const current = prev[scientist.id];

                                if (!current?.researchInterests) {
                                  return prev;
                                }

                                const nextCurrent = { ...current };
                                delete nextCurrent.researchInterests;

                                return {
                                  ...prev,
                                  [scientist.id]: nextCurrent,
                                };
                              });

                              if (feedback) {
                                setFeedback(null);
                              }
                            }}
                          />
                          {updateErrors.researchInterests ? (
                            <p className="text-xs text-red-600">
                              {updateErrors.researchInterests}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`update-contact-${scientist.id}`}>
                            Contact Number (optional)
                          </Label>
                          <Input
                            id={`update-contact-${scientist.id}`}
                            value={updateForm.contactNumber}
                            onChange={(event) =>
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  contactNumber: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`update-address-${scientist.id}`}>
                            Address (optional)
                          </Label>
                          <Input
                            id={`update-address-${scientist.id}`}
                            value={updateForm.address}
                            onChange={(event) =>
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  address: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`update-linkedin-${scientist.id}`}>
                            LinkedIn URL (optional)
                          </Label>
                          <Input
                            id={`update-linkedin-${scientist.id}`}
                            type="url"
                            value={updateForm.linkedinUrl}
                            onChange={(event) =>
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  linkedinUrl: event.target.value,
                                },
                              }))
                            }
                          />
                          {updateErrors.linkedinUrl ? (
                            <p className="text-xs text-red-600">{updateErrors.linkedinUrl}</p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`update-scholar-${scientist.id}`}>
                            Google Scholar URL (optional)
                          </Label>
                          <Input
                            id={`update-scholar-${scientist.id}`}
                            type="url"
                            value={updateForm.googleScholarUrl}
                            onChange={(event) =>
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  googleScholarUrl: event.target.value,
                                },
                              }))
                            }
                          />
                          {updateErrors.googleScholarUrl ? (
                            <p className="text-xs text-red-600">
                              {updateErrors.googleScholarUrl}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`update-orcid-${scientist.id}`}>
                            ORCID (optional)
                          </Label>
                          <Input
                            id={`update-orcid-${scientist.id}`}
                            value={updateForm.orcid}
                            onChange={(event) =>
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  orcid: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor={`update-photo-${scientist.id}`}>
                            Profile Photo URL (optional)
                          </Label>
                          <Input
                            id={`update-photo-${scientist.id}`}
                            type="url"
                            value={updateForm.profilePhoto}
                            onChange={(event) =>
                              setUpdateFormById((prev) => ({
                                ...prev,
                                [scientist.id]: {
                                  ...(prev[scientist.id] ??
                                    getInitialUpdateScientistForm(scientist)),
                                  profilePhoto: event.target.value,
                                },
                              }))
                            }
                          />
                          {updateErrors.profilePhoto ? (
                            <p className="text-xs text-red-600">{updateErrors.profilePhoto}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={async () => {
                            setFeedback(null);
                            const validation = validateUpdateScientistForm(updateForm);
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
                              const response = await updateScientistMutation.mutateAsync({
                                id: scientist.id,
                                payload: validation.data,
                              });
                              setFeedback({
                                type: "success",
                                text: response.message || "Scientist updated successfully.",
                              });
                            } catch (error) {
                              setFeedback({ type: "error", text: getApiErrorMessage(error) });
                            }
                          }}
                        >
                          {isUpdating ? "Saving..." : "Update Scientist"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold">Specialty Management</p>

                      {assignedSpecialties.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No specialties assigned yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assignedSpecialties.map((specialty) => {
                            const removingCurrent =
                              isRemovingSpecialty &&
                              removeSpecialtyMutation.variables?.specialtyId === specialty.id;

                            return (
                              <button
                                key={specialty.id}
                                type="button"
                                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                                disabled={removingCurrent}
                                onClick={async () => {
                                  setFeedback(null);
                                  try {
                                    const response =
                                      await removeSpecialtyMutation.mutateAsync({
                                        id: scientist.id,
                                        specialtyId: specialty.id,
                                      });
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
                                {removingCurrent ? "Removing..." : `Remove ${specialty.label}`}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">Assign New Specialties</p>
                          <p className="text-xs text-muted-foreground">
                            Selected: {selectedAssignSpecialtyIds.length}
                          </p>
                        </div>

                        {specialtiesQuery.isPending ? (
                          <p className="text-sm text-muted-foreground">
                            Loading specialties...
                          </p>
                        ) : specialtiesQuery.isError ? (
                          <div className="space-y-2">
                            <p className="text-sm text-red-600">
                              Could not load specialties. Enter IDs manually.
                            </p>
                            <Input
                              id={`assign-specialties-fallback-${scientist.id}`}
                              placeholder="id-1,id-2"
                              value={manualAssignSpecialtyIds}
                              onChange={(event) =>
                                setManualAssignSpecialtyIdsById((prev) => ({
                                  ...prev,
                                  [scientist.id]: event.target.value,
                                }))
                              }
                            />
                          </div>
                        ) : assignableSpecialties.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            All available specialties are already assigned.
                          </p>
                        ) : (
                          <div className="grid gap-2 md:grid-cols-2">
                            {assignableSpecialties.map((specialty) => {
                              const label = getSpecialtyLabel(specialty);
                              const description = getSpecialtyDescription(specialty);
                              const checked = selectedAssignSpecialtyIds.includes(specialty.id);

                              return (
                                <label
                                  key={`${scientist.id}-${specialty.id}`}
                                  htmlFor={`assign-specialty-${scientist.id}-${specialty.id}`}
                                  className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                >
                                  <input
                                    id={`assign-specialty-${scientist.id}-${specialty.id}`}
                                    type="checkbox"
                                    className="mt-0.5 size-4 rounded border-slate-300"
                                    checked={checked}
                                    onChange={() =>
                                      toggleAssignSpecialty(scientist.id, specialty.id)
                                    }
                                  />
                                  <span className="space-y-1">
                                    <span className="block font-medium">{label}</span>
                                    <span className="block text-xs text-muted-foreground">
                                      {description || specialty.id}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isAssigning}
                          onClick={async () => {
                            const specialtyIds = specialtiesQuery.isError
                              ? parseIdList(manualAssignSpecialtyIds)
                              : selectedAssignSpecialtyIds;

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
                              const response = await assignSpecialtiesMutation.mutateAsync({
                                id: scientist.id,
                                payload: { specialtyIds },
                              });
                              setFeedback({
                                type: "success",
                                text: response.message || "Specialties assigned successfully.",
                              });
                              setSelectedAssignSpecialtyIdsById((prev) => ({
                                ...prev,
                                [scientist.id]: [],
                              }));
                              setManualAssignSpecialtyIdsById((prev) => ({
                                ...prev,
                                [scientist.id]: "",
                              }));
                            } catch (error) {
                              setFeedback({ type: "error", text: getApiErrorMessage(error) });
                            }
                          }}
                        >
                          {isAssigning ? "Assigning..." : "Assign Specialties"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
