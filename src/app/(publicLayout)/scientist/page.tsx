"use client";

import { useDeferredValue, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Compass,
  GraduationCap,
  Mail,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  DirectoryBadge,
  DirectoryDetailCard,
  DirectoryFieldGrid,
  DirectoryPaginationSection,
  DirectorySummaryCard,
} from "../_components/public-directory-primitives";
import {
  PUBLIC_DIRECTORY_PAGE_SIZE,
  getDirectoryFields,
  getPaginationItems,
} from "../_lib/public-directory";
import { useScientistsQuery } from "@/features/scientist";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Scientist } from "@/services/scientist.service";

const SCIENTISTS_PAGE_SIZE = PUBLIC_DIRECTORY_PAGE_SIZE;
const SCIENTIST_FIELD_OPTIONS = {
  maxDepth: 3,
  hideIdentifierFields: true,
  priorityPaths: [
    "isVerified",
    "user.name",
    "user.email",
    "scientist.name",
    "scientist.fullName",
    "institution",
    "scientist.institution",
    "department",
    "scientist.department",
    "specialization",
    "scientist.specialization",
    "yearsOfExperience",
    "scientist.yearsOfExperience",
    "qualification",
    "scientist.qualification",
    "researchInterests",
    "scientist.researchInterests",
    "contactNumber",
    "scientist.contactNumber",
    "address",
    "scientist.address",
    "profilePhoto",
    "scientist.profilePhoto",
    "linkedinUrl",
    "scientist.linkedinUrl",
    "googleScholarUrl",
    "scientist.googleScholarUrl",
    "orcid",
    "scientist.orcid",
    "verifiedAt",
    "createdAt",
    "updatedAt",
  ],
};

type ScientistRecord = Record<string, unknown>;

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as ScientistRecord) : null;
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getImageUrlCandidate(value: unknown) {
  const normalized = getOptionalString(value);

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return normalized;
    }
  } catch {
    return null;
  }

  return null;
}

function getScientistField(scientist: Scientist, key: string) {
  const record = scientist as ScientistRecord;
  const profile = asRecord(record.scientist);

  return profile?.[key] ?? record[key];
}

function getScientistString(scientist: Scientist, key: string) {
  const value = getScientistField(scientist, key);
  return typeof value === "string" ? value.trim() : "";
}

function getScientistNumber(scientist: Scientist, key: string) {
  const value = getScientistField(scientist, key);

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

function getScientistUserMeta(scientist: Scientist) {
  const record = scientist as ScientistRecord;
  const profile = asRecord(record.scientist);
  const user = asRecord(record.user);

  const userName =
    (typeof user?.name === "string" && user.name.trim()) ||
    (typeof profile?.name === "string" && profile.name.trim()) ||
    (typeof profile?.fullName === "string" && profile.fullName.trim()) ||
    (typeof record.name === "string" && record.name.trim()) ||
    (typeof record.fullName === "string" && record.fullName.trim()) ||
    "";

  const userEmail =
    (typeof user?.email === "string" && user.email.trim()) ||
    (typeof record.email === "string" && record.email.trim()) ||
    "";

  const userId =
    (typeof scientist.userId === "string" && scientist.userId.trim()) ||
    (typeof user?.id === "string" && user.id.trim()) ||
    "";

  return { userName, userEmail, userId };
}

function getScientistName(scientist: Scientist) {
  const name = getScientistUserMeta(scientist).userName;

  if (name) {
    return name;
  }

  return "Scientist profile";
}

function getScientistInstitution(scientist: Scientist) {
  const institution = getScientistString(scientist, "institution");
  return institution || "Institution not listed";
}

function getScientistSpecialization(scientist: Scientist) {
  const specialization = getScientistString(scientist, "specialization");
  return specialization || "Specialization not listed";
}

function getScientistQualification(scientist: Scientist) {
  const qualification = getScientistString(scientist, "qualification");
  return qualification || "Qualification not listed";
}

function getScientistResearchFocus(scientist: Scientist) {
  const researchFocus =
    getScientistString(scientist, "researchInterests") ||
    getScientistString(scientist, "bio") ||
    getScientistString(scientist, "summary");

  return researchFocus || "Research focus not listed";
}

function getScientistExperience(scientist: Scientist) {
  const years = getScientistNumber(scientist, "yearsOfExperience");

  if (years === null) {
    return "Experience not listed";
  }

  return `${years} years`;
}

function getScientistProfilePhoto(scientist: Scientist) {
  const record = scientist as ScientistRecord;
  const profile = asRecord(record.scientist);
  const user = asRecord(record.user);
  const candidates = [
    profile?.profilePhoto,
    profile?.avatar,
    profile?.avatarUrl,
    profile?.photo,
    profile?.photoUrl,
    profile?.image,
    profile?.imageUrl,
    record.profilePhoto,
    record.avatar,
    record.avatarUrl,
    record.photo,
    record.photoUrl,
    record.image,
    record.imageUrl,
    user?.profilePhoto,
    user?.avatar,
    user?.avatarUrl,
    user?.photo,
    user?.photoUrl,
    user?.image,
    user?.imageUrl,
  ];

  for (const candidate of candidates) {
    const imageUrl = getImageUrlCandidate(candidate);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return "";
}

function getScientistLinkedAccount(scientist: Scientist) {
  const { userEmail } = getScientistUserMeta(scientist);

  if (userEmail) {
    return userEmail;
  }

  return "Linked member account available";
}

function getScientistFields(scientist: Scientist) {
  return getDirectoryFields(scientist, SCIENTIST_FIELD_OPTIONS);
}

function getScientistSummary(scientist: Scientist) {
  const explicitSummary =
    getScientistString(scientist, "bio") || getScientistString(scientist, "summary");

  if (explicitSummary) {
    return explicitSummary;
  }

  const specialization = getScientistSpecialization(scientist);
  const qualification = getScientistQualification(scientist);

  if (
    specialization !== "Specialization not listed" &&
    qualification !== "Qualification not listed"
  ) {
    return `${qualification} with a public specialization in ${specialization.toLowerCase()}.`;
  }

  if (specialization !== "Specialization not listed") {
    return `Public profile focus: ${specialization}.`;
  }

  return "Public profile information is limited for this scientist record.";
}

function getScientistSearchText(scientist: Scientist) {
  return getScientistFields(scientist)
    .map((field) => `${field.label} ${field.value}`)
    .join(" ")
    .toLowerCase();
}

function compareScientists(a: Scientist, b: Scientist) {
  if (a.isVerified === true && b.isVerified !== true) {
    return -1;
  }

  if (a.isVerified !== true && b.isVerified === true) {
    return 1;
  }

  return getScientistName(a).localeCompare(getScientistName(b));
}

export default function ScientistPage() {
  const scientistsQuery = useScientistsQuery({ page: 1, limit: 100 });
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchValue = useDeferredValue(searchValue);

  const scientists = [...(scientistsQuery.data?.data ?? [])].sort(compareScientists);
  const activeQuery = deferredSearchValue.trim();
  const normalizedSearch = activeQuery.toLowerCase();
  const filteredScientists = normalizedSearch
    ? scientists.filter((scientist) =>
        getScientistSearchText(scientist).includes(normalizedSearch),
      )
    : scientists;

  const totalScientists = filteredScientists.length;
  const verifiedCount = filteredScientists.filter(
    (scientist) => scientist.isVerified === true,
  ).length;
  const linkedAccountsCount = filteredScientists.filter((scientist) => {
    const { userEmail, userId } = getScientistUserMeta(scientist);
    return Boolean(userEmail || userId);
  }).length;
  const institutionCount = filteredScientists.filter((scientist) =>
    getScientistInstitution(scientist) !== "Institution not listed",
  ).length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalScientists / SCIENTISTS_PAGE_SIZE),
  );

  if (scientistsQuery.isPending) {
    return (
      <main className="public-page-shell">
        <LoadingState
          rows={4}
          title="Loading scientists"
          description="Fetching scientist profiles from the backend."
          className="surface-card p-5"
        />
      </main>
    );
  }

  if (scientistsQuery.isError) {
    return (
      <main className="public-page-shell">
        <ErrorState
          title="Could not load scientists"
          description={getApiErrorMessage(scientistsQuery.error)}
          className="surface-card p-5"
          onRetry={() => {
            void scientistsQuery.refetch();
          }}
        />
      </main>
    );
  }

  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * SCIENTISTS_PAGE_SIZE;
  const pageScientists = filteredScientists.slice(
    pageStartIndex,
    pageStartIndex + SCIENTISTS_PAGE_SIZE,
  );
  const rangeStart = totalScientists === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd =
    totalScientists === 0
      ? 0
      : Math.min(pageStartIndex + pageScientists.length, totalScientists);
  const paginationItems = getPaginationItems(totalPages, activePage);
  const disablePrevious = activePage <= 1;
  const disableNext = activePage >= totalPages;

  return (
    <main className="public-page-shell">
      <section className="surface-card overflow-hidden">
        <div className="grid gap-6 p-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)] lg:p-8">
          <div className="space-y-5">
            <DirectoryBadge
              icon={Sparkles}
              label="Expert Directory"
              tone="accent"
            />

            <div className="space-y-3">
              <h1 className="section-title">
                Present scientist profiles with a more credible, review-ready
                structure.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                This public directory highlights verification status, linked
                accounts, institutional context, and subject focus in a format
                that reads more like a professional expert registry.
              </p>
              {scientistsQuery.data?.message ? (
                <p className="text-sm text-slate-500">
                  {scientistsQuery.data.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-900">
                Verified profiles appear first
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-900">
                Two profiles per page
              </span>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-emerald-200/60 bg-[linear-gradient(155deg,rgba(240,253,244,0.96),rgba(239,246,255,0.96))] p-5 shadow-[0_30px_70px_-45px_rgba(6,95,70,0.4)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
              Directory overview
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DirectorySummaryCard
                label="Matching"
                value={totalScientists.toLocaleString()}
                caption="Profiles in the current view"
                className="border-emerald-100 bg-white/80"
              />
              <DirectorySummaryCard
                label="Verified"
                value={verifiedCount.toLocaleString()}
                caption="Profiles already approved"
                className="border-sky-100 bg-white/80"
              />
              <DirectorySummaryCard
                label="Linked"
                value={linkedAccountsCount.toLocaleString()}
                caption="Profiles with visible account details"
                className="border-cyan-100 bg-white/80"
              />
              <DirectorySummaryCard
                label="Institutions"
                value={institutionCount.toLocaleString()}
                caption="Profiles with listed institutions"
                className="border-teal-100 bg-white/80"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-kicker">Directory Controls</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Search by expert name, institution, or linked account
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Filter by scientist name, institution, specialization, qualification,
              research focus, or email.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Page Status
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              Page {activePage} of {totalPages}
            </p>
            <p className="text-xs text-slate-500">
              {SCIENTISTS_PAGE_SIZE} scientists per page
            </p>
          </div>
        </div>

        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by scientist name, institution, specialization, or email"
              className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-sm"
            />
          </label>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 px-5 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSearchValue("");
              setCurrentPage(1);
            }}
            disabled={!searchValue.trim()}
          >
            Clear search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
            Showing {rangeStart}-{rangeEnd} of {totalScientists.toLocaleString()}
          </span>
          {activeQuery ? (
            <p>
              Search:{" "}
              <span className="font-medium text-slate-900">{activeQuery}</span>
            </p>
          ) : (
            <p>Showing all public scientist profiles</p>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Results update as you type and keep verification-first ordering in place.
        </p>
      </section>

      {totalScientists === 0 ? (
        <EmptyState
          title="No scientists found"
          description={
            activeQuery
              ? "Try another keyword or clear the search field."
              : "No scientist profiles are available right now."
          }
          className="surface-card p-6"
        />
      ) : (
        <section className="space-y-5">
          {pageScientists.map((scientist) => (
            <article key={scientist.id} className="surface-card overflow-hidden">
              <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(239,246,255,0.96))] px-6 py-6">
                <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)_18rem] lg:items-start">
                  <div className="flex justify-center lg:justify-start">
                    <div className="relative size-24 overflow-hidden rounded-[1.6rem] border border-emerald-200 bg-white shadow-sm">
                      {getScientistProfilePhoto(scientist) ? (
                        <img
                          src={getScientistProfilePhoto(scientist)}
                          alt={`${getScientistName(scientist)} profile`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(14,165,233,0.14))] text-emerald-800">
                          <UserRound className="size-9" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <DirectoryBadge
                        icon={BadgeCheck}
                        label={
                          scientist.isVerified === true
                            ? "Verified"
                            : "Pending review"
                        }
                        tone={
                          scientist.isVerified === true ? "success" : "neutral"
                        }
                        className="normal-case tracking-normal"
                      />
                      {getScientistQualification(scientist) !==
                      "Qualification not listed" ? (
                        <DirectoryBadge
                          icon={GraduationCap}
                          label={getScientistQualification(scientist)}
                          tone="accent"
                          className="normal-case tracking-normal"
                        />
                      ) : null}
                    </div>

                    <div>
                      <p className="section-kicker">Scientist Profile</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        {getScientistName(scientist)}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {getScientistSpecialization(scientist)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-emerald-200 bg-white/90 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Institution
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {getScientistInstitution(scientist)}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Qualification: {getScientistQualification(scientist)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_19rem]">
                  <div className="space-y-4">
                    <div>
                      <p className="section-kicker">Profile Summary</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {getScientistSummary(scientist)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                      <p className="section-kicker">Research Note</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Focus area: {getScientistResearchFocus(scientist)}.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <DirectoryDetailCard
                      icon={Building2}
                      label="Institution"
                      value={getScientistInstitution(scientist)}
                      className="border-emerald-100 bg-emerald-50/60"
                    />
                    <DirectoryDetailCard
                      icon={UserRound}
                      label="Specialization"
                      value={getScientistSpecialization(scientist)}
                      className="border-sky-100 bg-sky-50/60"
                    />
                    <DirectoryDetailCard
                      icon={Briefcase}
                      label="Experience"
                      value={getScientistExperience(scientist)}
                      className="border-cyan-100 bg-cyan-50/60"
                    />
                    <DirectoryDetailCard
                      icon={Mail}
                      label="Contact Channel"
                      value={getScientistLinkedAccount(scientist)}
                      className="border-teal-100 bg-teal-50/60"
                    />
                    <DirectoryDetailCard
                      icon={Compass}
                      label="Public Presence"
                      value={
                        getScientistProfilePhoto(scientist)
                          ? "Profile includes a public photo"
                          : "Profile currently relies on text-based identity"
                      }
                      className="border-emerald-100 bg-white"
                    />
                  </div>
                </div>

                <DirectoryFieldGrid
                  title="Published Fields"
                  fields={getScientistFields(scientist)}
                />
              </div>
            </article>
          ))}
        </section>
      )}

      {totalPages > 1 ? (
        <DirectoryPaginationSection
          currentPage={activePage}
          totalPages={totalPages}
          paginationItems={paginationItems}
          onPageChange={(page) => {
            setCurrentPage(page);
          }}
          disablePrevious={disablePrevious}
          disableNext={disableNext}
          description={`Page ${activePage} of ${totalPages}. ${pageScientists.length} scientists are shown on this page.`}
        />
      ) : null}
    </main>
  );
}
