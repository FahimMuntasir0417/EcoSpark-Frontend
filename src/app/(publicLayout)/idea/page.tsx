"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowDownUp,
  CalendarClock,
  CreditCard,
  Eye,
  Filter,
  Leaf,
  Lock,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  getMyPurchasesQueryOptions,
  useCreateCheckoutSessionMutation,
} from "@/features/commerce";
import { useCategoriesQuery } from "@/features/category";
import { useIdeasQuery } from "@/features/idea";
import {
  getCurrentPurchaseForIdea,
  isPaidIdeaAccessType,
} from "@/features/commerce/utils/purchase-access";
import { getAccessToken } from "@/lib/auth/session";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Category } from "@/services/category.service";
import type { Idea } from "@/services/idea.service";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function getIdeaTitle(idea: Idea) {
  return hasText(idea.title) ? idea.title!.trim() : "Untitled idea";
}

function getIdeaSummary(idea: Idea) {
  if (hasText(idea.excerpt)) {
    return idea.excerpt!.trim();
  }

  if (hasText(idea.description)) {
    return idea.description!.trim();
  }

  return "No summary has been added for this idea yet.";
}

function formatDate(value?: string | null) {
  if (!hasText(value)) {
    return "Not scheduled";
  }

  const parsed = new Date(value!);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid date";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMetric(value: number | string | null | undefined, suffix = "") {
  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    return "N/A";
  }

  return `${numericValue.toLocaleString()}${suffix}`;
}

function formatCurrencyValue(amount: number, currency?: string | null) {
  const normalizedCurrency = currency?.trim().toUpperCase();
  const safeCurrency =
    normalizedCurrency && /^[A-Z]{3}$/.test(normalizedCurrency)
      ? normalizedCurrency
      : "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()}${
      normalizedCurrency ? ` ${normalizedCurrency}` : ""
    }`;
  }
}

function formatPrice(idea: Idea) {
  const rawPrice = idea.price;
  const accessType = hasText(idea.accessType) ? idea.accessType!.toUpperCase() : "";

  if (accessType === "FREE") {
    return "Free";
  }

  if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
    return "Contact for pricing";
  }

  const price =
    typeof rawPrice === "number" ? rawPrice : Number.parseFloat(String(rawPrice));

  if (Number.isNaN(price)) {
    return String(rawPrice);
  }

  return formatCurrencyValue(price, idea.currency);
}

function formatBadgeLabel(value?: string | null) {
  if (!hasText(value)) {
    return "Unknown";
  }

  return value!
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium",
        tone === "accent" && "bg-secondary text-secondary-foreground",
        tone === "success" && "bg-primary/10 text-primary",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted p-4 text-foreground">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

const IDEAS_PAGE_SIZE = 3;
const ALL_FILTER_VALUE = "ALL";
const DEFAULT_IDEA_SORT_OPTION = "updated-desc";

const filterControlClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-card";

const LOCATION_FIELD_KEYS = [
  "location",
  "city",
  "country",
  "region",
  "state",
  "address",
  "targetLocation",
  "implementationLocation",
  "siteLocation",
];

type IdeaSortOption =
  | "updated-desc"
  | "updated-asc"
  | "price-asc"
  | "price-desc"
  | "impact-desc"
  | "eco-desc"
  | "views-desc"
  | "title-asc";

const IDEA_SORT_OPTIONS: Array<{ value: IdeaSortOption; label: string }> = [
  { value: "updated-desc", label: "Newest activity" },
  { value: "updated-asc", label: "Oldest activity" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "impact-desc", label: "Impact score" },
  { value: "eco-desc", label: "Eco score" },
  { value: "views-desc", label: "Most viewed" },
  { value: "title-asc", label: "Title A-Z" },
];

type CategoryOption = {
  value: string;
  label: string;
};

function getTotalPages(totalPages?: number, totalPage?: number) {
  const resolvedTotalPages = totalPages ?? totalPage ?? 1;

  if (!Number.isFinite(resolvedTotalPages) || resolvedTotalPages <= 0) {
    return 1;
  }

  return Math.floor(resolvedTotalPages);
}

function getDateValue(value?: string | null) {
  if (!hasText(value)) {
    return 0;
  }

  const parsed = new Date(value!);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function getIdeaActivityTimestamp(idea: Idea) {
  return Math.max(
    getDateValue(idea.updatedAt),
    getDateValue(idea.lastActivityAt),
    getDateValue(idea.publishedAt),
    getDateValue(idea.submittedAt),
    getDateValue(idea.createdAt),
  );
}

function getDateBoundary(value: string, boundary: "start" | "end") {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const parsed = new Date(`${normalizedValue}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (boundary === "end") {
    parsed.setHours(23, 59, 59, 999);
  }

  return parsed.getTime();
}

function parseFilterNumber(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  const parsed = Number.parseFloat(normalizedValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function getIdeaNumericPrice(idea: Idea) {
  const accessType = hasText(idea.accessType)
    ? idea.accessType!.trim().toUpperCase()
    : "";

  if (accessType === "FREE") {
    return 0;
  }

  if (idea.price === null || idea.price === undefined || idea.price === "") {
    return null;
  }

  const price =
    typeof idea.price === "number"
      ? idea.price
      : Number.parseFloat(String(idea.price));

  return Number.isFinite(price) ? price : null;
}

function readRecordString(
  record: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = record?.[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "";
}

function readLocationValuesFromRecord(
  record: Record<string, unknown> | null | undefined,
) {
  const values: string[] = [];

  LOCATION_FIELD_KEYS.forEach((key) => {
    const directValue = readRecordString(record, key);

    if (directValue) {
      values.push(directValue);
      return;
    }

    const nestedValue = record?.[key];

    if (
      nestedValue &&
      typeof nestedValue === "object" &&
      !Array.isArray(nestedValue)
    ) {
      LOCATION_FIELD_KEYS.forEach((nestedKey) => {
        const nestedText = readRecordString(
          nestedValue as Record<string, unknown>,
          nestedKey,
        );

        if (nestedText) {
          values.push(nestedText);
        }
      });
    }
  });

  return values;
}

function getIdeaLocationValues(idea: Idea) {
  const ideaRecord = idea as Record<string, unknown>;
  const authorRecord =
    idea.author && typeof idea.author === "object"
      ? (idea.author as Record<string, unknown>)
      : null;

  return [
    ...readLocationValuesFromRecord(ideaRecord),
    ...readLocationValuesFromRecord(authorRecord),
  ];
}

function getIdeaLocationLabel(idea: Idea) {
  return getIdeaLocationValues(idea)[0] ?? "Location not provided";
}

function getIdeaCategoryCandidates(idea: Idea) {
  return [idea.category?.id, idea.categoryId, idea.category?.slug, idea.category?.name]
    .filter(hasText)
    .map((value) => value!.trim());
}

function getIdeaCategoryFilterValue(idea: Idea) {
  return getIdeaCategoryCandidates(idea)[0] ?? "";
}

function getIdeaCategoryLabel(idea: Idea) {
  return idea.category?.name ?? idea.category?.slug ?? idea.categoryId ?? "";
}

function addCategoryOption(
  options: Map<string, CategoryOption>,
  value: string,
  label: string,
) {
  const normalizedValue = value.trim();
  const normalizedLabel = label.trim();

  if (!normalizedValue || !normalizedLabel || options.has(normalizedValue)) {
    return;
  }

  options.set(normalizedValue, {
    value: normalizedValue,
    label: normalizedLabel,
  });
}

function getCategoryOptions(ideas: Idea[], categories: Category[]) {
  const options = new Map<string, CategoryOption>();

  categories.forEach((category) => {
    if (category.isActive === false) {
      return;
    }

    addCategoryOption(options, category.id, category.name);
  });

  ideas.forEach((idea) => {
    addCategoryOption(
      options,
      getIdeaCategoryFilterValue(idea),
      getIdeaCategoryLabel(idea),
    );
  });

  return [...options.values()].sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

function compareTitles(left: Idea, right: Idea) {
  return getIdeaTitle(left).localeCompare(getIdeaTitle(right));
}

function compareOptionalNumbers(
  left: number | null | undefined,
  right: number | null | undefined,
  direction: "asc" | "desc",
) {
  const hasLeft = typeof left === "number" && Number.isFinite(left);
  const hasRight = typeof right === "number" && Number.isFinite(right);

  if (!hasLeft && !hasRight) {
    return 0;
  }

  if (!hasLeft) {
    return 1;
  }

  if (!hasRight) {
    return -1;
  }

  return direction === "asc" ? left - right : right - left;
}

function sortIdeas(ideas: Idea[], sortOption: IdeaSortOption) {
  return [...ideas].sort((left, right) => {
    let comparison = 0;

    switch (sortOption) {
      case "updated-asc":
        comparison =
          getIdeaActivityTimestamp(left) - getIdeaActivityTimestamp(right);
        break;
      case "price-asc":
        comparison = compareOptionalNumbers(
          getIdeaNumericPrice(left),
          getIdeaNumericPrice(right),
          "asc",
        );
        break;
      case "price-desc":
        comparison = compareOptionalNumbers(
          getIdeaNumericPrice(left),
          getIdeaNumericPrice(right),
          "desc",
        );
        break;
      case "impact-desc":
        comparison = compareOptionalNumbers(
          left.impactScore,
          right.impactScore,
          "desc",
        );
        break;
      case "eco-desc":
        comparison = compareOptionalNumbers(left.ecoScore, right.ecoScore, "desc");
        break;
      case "views-desc":
        comparison = compareOptionalNumbers(
          left.totalViews,
          right.totalViews,
          "desc",
        );
        break;
      case "title-asc":
        comparison = compareTitles(left, right);
        break;
      case "updated-desc":
      default:
        comparison =
          getIdeaActivityTimestamp(right) - getIdeaActivityTimestamp(left);
        break;
    }

    return comparison === 0 ? compareTitles(left, right) : comparison;
  });
}

type PaginationPageItem = number | "ellipsis";

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

function getPaginationItems(totalPages: number, currentPage: number): PaginationPageItem[] {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationPageItem[] = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (typeof previousPage === "number" && page - previousPage > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

function subscribeToAuthSnapshot(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("focus", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
  };
}

function getClientAuthSnapshot() {
  return Boolean(getAccessToken());
}

function getServerAuthSnapshot() {
  return false;
}

export default function IdeaPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [appliedSearchValue, setAppliedSearchValue] = useState("");
  const [selectedCategoryValue, setSelectedCategoryValue] =
    useState(ALL_FILTER_VALUE);
  const [minimumPriceValue, setMinimumPriceValue] = useState("");
  const [maximumPriceValue, setMaximumPriceValue] = useState("");
  const [dateFromValue, setDateFromValue] = useState("");
  const [dateToValue, setDateToValue] = useState("");
  const [locationFilterValue, setLocationFilterValue] = useState("");
  const [sortOption, setSortOption] = useState<IdeaSortOption>(
    DEFAULT_IDEA_SORT_OPTION,
  );
  const hasClientAuth = useSyncExternalStore(
    subscribeToAuthSnapshot,
    getClientAuthSnapshot,
    getServerAuthSnapshot,
  );
  const [checkoutFeedback, setCheckoutFeedback] = useState<Feedback>(null);

  const ideasQueryParams = useMemo(() => {
    const normalizedSearch = appliedSearchValue.trim();
    const params: Record<string, unknown> = {};

    if (normalizedSearch) {
      params.search = normalizedSearch;
    }

    return params;
  }, [appliedSearchValue]);

  const ideasQuery = useIdeasQuery(ideasQueryParams);
  const categoriesQuery = useCategoriesQuery();
  const purchasesQuery = useQuery({
    ...getMyPurchasesQueryOptions(),
    enabled: hasClientAuth,
    retry: false,
  });
  const createCheckoutSessionMutation = useCreateCheckoutSessionMutation();

  useEffect(() => {
    const normalizedSearch = searchInputValue.trim();
    const timer = window.setTimeout(() => {
      setAppliedSearchValue((previousValue) =>
        previousValue === normalizedSearch ? previousValue : normalizedSearch,
      );
      setCurrentPage((previousPage) => (previousPage === 1 ? previousPage : 1));
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInputValue]);

  const sourceIdeas = ideasQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const categoryOptions = useMemo(
    () => getCategoryOptions(sourceIdeas, categories),
    [categories, sourceIdeas],
  );
  const filteredIdeas = useMemo(() => {
    const minimumPrice = parseFilterNumber(minimumPriceValue);
    const maximumPrice = parseFilterNumber(maximumPriceValue);
    const dateFrom = getDateBoundary(dateFromValue, "start");
    const dateTo = getDateBoundary(dateToValue, "end");
    const normalizedLocation = locationFilterValue.trim().toLowerCase();

    return sortIdeas(
      sourceIdeas.filter((idea) => {
        if (
          selectedCategoryValue !== ALL_FILTER_VALUE &&
          !getIdeaCategoryCandidates(idea).includes(selectedCategoryValue)
        ) {
          return false;
        }

        if (minimumPrice !== null || maximumPrice !== null) {
          const price = getIdeaNumericPrice(idea);

          if (price === null) {
            return false;
          }

          if (minimumPrice !== null && price < minimumPrice) {
            return false;
          }

          if (maximumPrice !== null && price > maximumPrice) {
            return false;
          }
        }

        if (dateFrom !== null || dateTo !== null) {
          const activityDate = getIdeaActivityTimestamp(idea);

          if (activityDate <= 0) {
            return false;
          }

          if (dateFrom !== null && activityDate < dateFrom) {
            return false;
          }

          if (dateTo !== null && activityDate > dateTo) {
            return false;
          }
        }

        if (normalizedLocation) {
          const locationText = getIdeaLocationValues(idea).join(" ").toLowerCase();

          if (!locationText.includes(normalizedLocation)) {
            return false;
          }
        }

        return true;
      }),
      sortOption,
    );
  }, [
    dateFromValue,
    dateToValue,
    locationFilterValue,
    maximumPriceValue,
    minimumPriceValue,
    selectedCategoryValue,
    sortOption,
    sourceIdeas,
  ]);
  const purchases = purchasesQuery.data?.data ?? [];
  const totalAvailableIdeas = sourceIdeas.length;
  const totalIdeas = filteredIdeas.length;
  const totalPages = getTotalPages(
    totalIdeas > 0 ? Math.ceil(totalIdeas / IDEAS_PAGE_SIZE) : 1,
    undefined,
  );
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * IDEAS_PAGE_SIZE;
  const pageIdeas = filteredIdeas.slice(
    pageStartIndex,
    pageStartIndex + IDEAS_PAGE_SIZE,
  );
  const rangeStart = totalIdeas === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd =
    totalIdeas === 0 ? 0 : Math.min(pageStartIndex + pageIdeas.length, totalIdeas);
  const hasAppliedSearch = appliedSearchValue.trim().length > 0;
  const hasCategoryFilter = selectedCategoryValue !== ALL_FILTER_VALUE;
  const hasPriceFilter =
    minimumPriceValue.trim().length > 0 || maximumPriceValue.trim().length > 0;
  const hasDateFilter =
    dateFromValue.trim().length > 0 || dateToValue.trim().length > 0;
  const hasLocationFilter = locationFilterValue.trim().length > 0;
  const hasSortOverride = sortOption !== DEFAULT_IDEA_SORT_OPTION;
  const hasFieldFilters =
    hasCategoryFilter || hasPriceFilter || hasDateFilter || hasLocationFilter;
  const hasActiveControls =
    searchInputValue.trim().length > 0 ||
    hasAppliedSearch ||
    hasFieldFilters ||
    hasSortOverride;
  const activeCategoryLabel =
    categoryOptions.find((option) => option.value === selectedCategoryValue)?.label ??
    "";
  const activeSortLabel =
    IDEA_SORT_OPTIONS.find((option) => option.value === sortOption)?.label ??
    "Newest activity";
  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];

    if (hasAppliedSearch) {
      parts.push(`Search: ${appliedSearchValue}`);
    }

    if (hasCategoryFilter && activeCategoryLabel) {
      parts.push(`Category: ${activeCategoryLabel}`);
    }

    if (hasPriceFilter) {
      const minimumLabel = minimumPriceValue.trim() || "0";
      const maximumLabel = maximumPriceValue.trim() || "any";
      parts.push(`Price: ${minimumLabel}-${maximumLabel}`);
    }

    if (hasDateFilter) {
      const fromLabel = dateFromValue.trim() || "any";
      const toLabel = dateToValue.trim() || "any";
      parts.push(`Date: ${fromLabel}-${toLabel}`);
    }

    if (hasLocationFilter) {
      parts.push(`Location: ${locationFilterValue.trim()}`);
    }

    if (hasSortOverride) {
      parts.push(`Sort: ${activeSortLabel}`);
    }

    return parts.join(" | ");
  }, [
    activeCategoryLabel,
    activeSortLabel,
    appliedSearchValue,
    dateFromValue,
    dateToValue,
    hasAppliedSearch,
    hasCategoryFilter,
    hasDateFilter,
    hasLocationFilter,
    hasPriceFilter,
    hasSortOverride,
    locationFilterValue,
    maximumPriceValue,
    minimumPriceValue,
  ]);
  const disablePrevious = activePage <= 1 || ideasQuery.isFetching;
  const disableNext = activePage >= totalPages || ideasQuery.isFetching;
  const paginationItems = useMemo(
    () => getPaginationItems(totalPages, activePage),
    [activePage, totalPages],
  );

  const resetControls = () => {
    setSearchInputValue("");
    setAppliedSearchValue("");
    setSelectedCategoryValue(ALL_FILTER_VALUE);
    setMinimumPriceValue("");
    setMaximumPriceValue("");
    setDateFromValue("");
    setDateToValue("");
    setLocationFilterValue("");
    setSortOption(DEFAULT_IDEA_SORT_OPTION);
    setCurrentPage(1);
  };

  const startCheckout = async (ideaId: string, purchaseId?: string) => {
    setCheckoutFeedback(null);

    if (!hasClientAuth) {
      router.push("/login");
      return;
    }

    if (purchaseId) {
      router.push(`/payments/success?purchaseId=${encodeURIComponent(purchaseId)}`);
      return;
    }

    try {
      const response = await createCheckoutSessionMutation.mutateAsync({
        ideaId,
        payload: {},
      });

      window.location.assign(response.data.checkoutUrl);
    } catch (error) {
      setCheckoutFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    }
  };

  if (ideasQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState
          rows={6}
          title="Loading ideas"
          description="Fetching the latest public ideas from the backend."
        />
      </main>
    );
  }

  if (ideasQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Could not load ideas"
          description={getApiErrorMessage(ideasQuery.error)}
          onRetry={() => {
            void ideasQuery.refetch();
          }}
        />
      </main>
    );
  }

  return (
    <main className="public-page-shell">
      <section className="surface-card grid gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <Badge tone="accent">
            <Sparkles className="mr-1.5 size-3.5" />
            Public Idea Library
          </Badge>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Browse ideas ready for review, adoption, or purchase.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Free ideas open immediately. Paid ideas stay locked until the
              purchase is recorded as paid.
            </p>
            {ideasQuery.data?.message ? (
              <p className="text-sm text-muted-foreground">{ideasQuery.data.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 rounded-lg bg-primary p-5 text-primary-foreground">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">
              Library stats
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {totalIdeas.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">matching ideas</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary-foreground/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/70">
                Page
              </p>
              <p className="mt-2 text-lg font-semibold">
                {activePage}/{totalPages}
              </p>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/70">
                Total
              </p>
              <p className="mt-2 text-lg font-semibold">
                {totalAvailableIdeas.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card grid gap-4 p-4 sm:p-5">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setCurrentPage(1);
            setAppliedSearchValue(searchInputValue.trim());
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search ideas"
                value={searchInputValue}
                onChange={(event) => {
                  setSearchInputValue(event.target.value);
                }}
                placeholder="Search ideas by title, summary, author, or category"
                className="h-10 bg-background pl-9 text-foreground placeholder:text-muted-foreground dark:bg-card"
              />
            </label>

            <Button
              type="submit"
              className="h-10 rounded-full px-5"
            >
              <Filter className="size-4" />
              Apply
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-5"
              onClick={resetControls}
              disabled={!hasActiveControls}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              Category
              <select
                value={selectedCategoryValue}
                onChange={(event) => {
                  setSelectedCategoryValue(event.target.value);
                  setCurrentPage(1);
                }}
                className={filterControlClassName}
              >
                <option value={ALL_FILTER_VALUE}>All categories</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Min price
              <Input
                type="number"
                min="0"
                inputMode="decimal"
                value={minimumPriceValue}
                onChange={(event) => {
                  setMinimumPriceValue(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="0"
                className="h-10 bg-background text-foreground placeholder:text-muted-foreground dark:bg-card"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Max price
              <Input
                type="number"
                min="0"
                inputMode="decimal"
                value={maximumPriceValue}
                onChange={(event) => {
                  setMaximumPriceValue(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Any"
                className="h-10 bg-background text-foreground placeholder:text-muted-foreground dark:bg-card"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Date from
              <Input
                type="date"
                value={dateFromValue}
                onChange={(event) => {
                  setDateFromValue(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 bg-background text-foreground dark:bg-card"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Date to
              <Input
                type="date"
                value={dateToValue}
                onChange={(event) => {
                  setDateToValue(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 bg-background text-foreground dark:bg-card"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground">
              Location
              <span className="relative block">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={locationFilterValue}
                  onChange={(event) => {
                    setLocationFilterValue(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="City, region, or country"
                  className="h-10 bg-background pl-9 text-foreground placeholder:text-muted-foreground dark:bg-card"
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
              <span className="inline-flex items-center gap-2">
                <ArrowDownUp className="size-4 text-muted-foreground" />
                Sort by
              </span>
              <select
                value={sortOption}
                onChange={(event) => {
                  setSortOption(event.target.value as IdeaSortOption);
                  setCurrentPage(1);
                }}
                className={filterControlClassName}
              >
                {IDEA_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
            Showing {rangeStart}-{rangeEnd} of {totalIdeas.toLocaleString()}
            {totalIdeas !== totalAvailableIdeas
              ? ` from ${totalAvailableIdeas.toLocaleString()} total`
              : ""}
          </p>
          {hasActiveControls && activeFilterSummary ? (
            <p className="min-w-0 break-words">
              Active:{" "}
              <span className="font-medium text-foreground">
                {activeFilterSummary}
              </span>
            </p>
          ) : (
            <p>Showing all public ideas</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Search and filters update automatically while typing or changing fields.
        </p>
        {checkoutFeedback ? (
          <p
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm",
              checkoutFeedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {checkoutFeedback.text}
          </p>
        ) : null}
      </section>

      {totalIdeas === 0 ? (
        <EmptyState
          title="No ideas found"
          description={
            totalAvailableIdeas > 0
              ? "Try another keyword, adjust the filters, or reset the controls."
              : "The public catalog is empty right now."
          }
        />
      ) : (
        <section className="grid gap-6">
          {pageIdeas.map((idea) => {
            const isPaidIdea = isPaidIdeaAccessType(idea.accessType);
            const currentPurchase = isPaidIdea
              ? getCurrentPurchaseForIdea(purchases, idea.id)
              : null;
            const purchaseStatus =
              typeof currentPurchase?.status === "string"
                ? currentPurchase.status
                : null;
            const isPurchased = purchaseStatus === "PAID";
            const hasPendingCheckout = purchaseStatus === "PENDING";
            const canOpenDetails = !isPaidIdea || isPurchased;
            const isCheckingPaidAccess =
              isPaidIdea && hasClientAuth && purchasesQuery.isPending;
            const isRedirectingToCheckout =
              createCheckoutSessionMutation.isPending &&
              createCheckoutSessionMutation.variables?.ideaId === idea.id;
            const actionDescription = isPaidIdea
              ? canOpenDetails
                ? "Paid access confirmed."
                : hasPendingCheckout
                  ? "Payment is pending. Verify it before the detail page opens."
                  : "Protected details stay locked until purchase is complete."
              : "Public idea details are available now.";
            const ideaLocation = getIdeaLocationLabel(idea);

            return (
              <article
                key={idea.id}
                className="surface-card overflow-hidden"
              >
                <div className="grid gap-0 lg:grid-cols-[19rem_minmax(0,1fr)]">
                  <div className="relative min-h-60 overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#0ea5e9_100%)]">
                    {hasText(idea.coverImageUrl) ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-80"
                        style={{ backgroundImage: `url(${idea.coverImageUrl})` }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.15),rgba(15,23,42,0.88))]" />
                    <div className="relative flex h-full flex-col justify-end p-5 text-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-200">
                        {idea.category?.name ?? "Uncategorized"}
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold leading-tight">
                        {getIdeaTitle(idea)}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-200">
                        {getIdeaSummary(idea)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 p-6 lg:p-7">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="success">{formatBadgeLabel(idea.status)}</Badge>
                      <Badge>{formatBadgeLabel(idea.visibility)}</Badge>
                      <Badge>{formatBadgeLabel(idea.accessType)}</Badge>
                      {isPaidIdea ? (
                        <Badge tone={canOpenDetails ? "success" : "accent"}>
                          {canOpenDetails ? "Purchased access" : "Purchase required"}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard label="Price" value={formatPrice(idea)} />
                      <StatCard label="Impact Score" value={formatMetric(idea.impactScore)} />
                      <StatCard label="Eco Score" value={formatMetric(idea.ecoScore)} />
                      <StatCard label="Views" value={formatMetric(idea.totalViews)} />
                    </div>

                    <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <UserRound className="size-4 text-muted-foreground" />
                        {idea.author?.name ?? "Unknown author"}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-muted-foreground" />
                        Updated {formatDate(idea.updatedAt)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="size-4 text-muted-foreground" />
                        <span className="min-w-0 break-words">{ideaLocation}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Leaf className="size-4 text-muted-foreground" />
                        CO2 {formatMetric(idea.estimatedCo2ReductionKgMonth, " kg/month")}
                      </p>
                      <p className="flex items-center gap-2">
                        <Eye className="size-4 text-muted-foreground" />
                        {formatMetric(idea.uniqueViews)} unique views
                      </p>
                    </div>

                    <div>
                      {canOpenDetails ? (
                        <Link
                          href={`/idea/${idea.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                        >
                          Open details
                          <ArrowRight className="size-4" />
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full px-5 py-2.5 text-sm font-medium"
                          disabled={isCheckingPaidAccess || isRedirectingToCheckout}
                          onClick={() => {
                            void startCheckout(idea.id, hasPendingCheckout ? currentPurchase?.id : undefined);
                          }}
                        >
                          {isCheckingPaidAccess ? (
                            "Checking purchase..."
                          ) : isRedirectingToCheckout ? (
                            "Redirecting..."
                          ) : hasPendingCheckout ? (
                            "View payment status"
                          ) : (
                            "Purchase access"
                          )}
                          {hasPendingCheckout ? (
                            <ArrowRight className="size-4" />
                          ) : hasClientAuth ? (
                            <CreditCard className="size-4" />
                          ) : (
                            <Lock className="size-4" />
                          )}
                        </Button>
                      )}
                      <p className="mt-3 text-xs text-muted-foreground">{actionDescription}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {totalPages > 1 ? (
        <section
          className="surface-card grid gap-3 p-4"
        >
          <Pagination>
            <PaginationContent className="flex-wrap items-center justify-center gap-2">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={cn(
                    disablePrevious && "pointer-events-none opacity-50",
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    if (disablePrevious) {
                      return;
                    }

                    setCurrentPage(Math.max(1, activePage - 1));
                  }}
                />
              </PaginationItem>

              {paginationItems.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                const isActivePage = item === activePage;

                return (
                  <PaginationItem key={`page-${item}`}>
                    <PaginationLink
                      href="#"
                      isActive={isActivePage}
                      className={cn(
                        ideasQuery.isFetching &&
                          !isActivePage &&
                          "pointer-events-none opacity-60",
                        isActivePage && "pointer-events-none",
                      )}
                      onClick={(event) => {
                        event.preventDefault();

                        if (ideasQuery.isFetching || isActivePage) {
                          return;
                        }

                        setCurrentPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={cn(disableNext && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (disableNext) {
                      return;
                    }

                    setCurrentPage(Math.min(totalPages, activePage + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Page {activePage} of {totalPages}
            </p>
            <p className="text-xs text-muted-foreground">
              {ideasQuery.isFetching ? "Updating results..." : `${pageIdeas.length} ideas on this page`}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
