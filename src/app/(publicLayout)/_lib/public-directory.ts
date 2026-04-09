export const PUBLIC_DIRECTORY_PAGE_SIZE = 2;

export type PaginationPageItem = number | "ellipsis";
export type DirectoryField = {
  key: string;
  label: string;
  value: string;
  href?: string;
};

type DirectoryFieldOptions = {
  maxDepth?: number;
  omitPaths?: string[];
  priorityPaths?: string[];
  hideIdentifierFields?: boolean;
};

export function hasText(value?: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function formatDate(
  value?: string | null,
  fallback = "Not scheduled",
) {
  if (!hasText(value)) {
    return fallback;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatBadgeLabel(
  value?: string | null,
  fallback = "Unknown",
) {
  if (!hasText(value)) {
    return fallback;
  }

  return value
    .trim()
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getDateSortValue(value?: string | null) {
  if (!hasText(value)) {
    return 0;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }

  return parsed.getTime();
}

export function getPaginationItems(
  totalPages: number,
  currentPage: number,
): PaginationPageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages,
  ]);

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toDisplayToken(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => {
      const lowered = part.toLowerCase();

      if (lowered === "id") {
        return "ID";
      }

      if (lowered === "url") {
        return "URL";
      }

      if (lowered === "api") {
        return "API";
      }

      if (lowered === "co2") {
        return "CO2";
      }

      return lowered.charAt(0).toUpperCase() + lowered.slice(1);
    })
    .join(" ");
}

function getFieldLabel(path: string[]) {
  return path.map(toDisplayToken).join(" ");
}

function isIdentifierKey(key: string) {
  return (
    key === "id" ||
    /(?:^|[_-])id(?:s)?$/i.test(key) ||
    /[a-z0-9]Id(s)?$/.test(key) ||
    /[A-Z]ID(s)?$/.test(key)
  );
}

function isLikelyUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLikelyDateKey(key: string) {
  return /(date|at)$/i.test(key);
}

function formatDateValue(value: string, includeTime: boolean) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return includeTime ? parsed.toLocaleString() : parsed.toLocaleDateString();
}

function getObjectSummary(value: Record<string, unknown>) {
  const candidates = [
    value.name,
    value.title,
    value.label,
    value.slug,
    value.id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function formatPrimitiveValue(path: string[], value: unknown) {
  const leafKey = path[path.length - 1] ?? "";

  if (value === null || value === undefined) {
    return "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString() : String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Empty";
    }

    if (isLikelyDateKey(leafKey)) {
      return formatDateValue(trimmed, /at$/i.test(leafKey));
    }

    return trimmed;
  }

  return String(value);
}

function formatArrayValue(path: string[], value: unknown[]) {
  if (value.length === 0) {
    return "None";
  }

  if (
    value.every(
      (item) =>
        item === null ||
        item === undefined ||
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean",
    )
  ) {
    return value
      .map((item) => formatPrimitiveValue(path, item))
      .join(", ");
  }

  const summarizedItems = value
    .map((item) => (isPlainObject(item) ? getObjectSummary(item) : null))
    .filter((item): item is string => Boolean(item));

  if (summarizedItems.length === value.length) {
    return summarizedItems.join(", ");
  }

  return `${value.length} items`;
}

function appendDirectoryFields(
  fields: DirectoryField[],
  value: unknown,
  path: string[],
  maxDepth: number,
) {
  if (path.length > 0) {
    const key = path.join(".");

    if (Array.isArray(value)) {
      fields.push({
        key,
        label: getFieldLabel(path),
        value: formatArrayValue(path, value),
      });
      return;
    }

    if (!isPlainObject(value)) {
      const formattedValue = formatPrimitiveValue(path, value);
      fields.push({
        key,
        label: getFieldLabel(path),
        value: formattedValue,
        href:
          typeof value === "string" && isLikelyUrl(value.trim())
            ? value.trim()
            : undefined,
      });
      return;
    }
  }

  if (!isPlainObject(value)) {
    return;
  }

  if (path.length >= maxDepth) {
    const summary = getObjectSummary(value);

    if (summary) {
      fields.push({
        key: path.join("."),
        label: getFieldLabel(path),
        value: summary,
      });
    }

    return;
  }

  Object.entries(value).forEach(([nextKey, nextValue]) => {
    appendDirectoryFields(fields, nextValue, [...path, nextKey], maxDepth);
  });
}

export function getDirectoryFields(
  value: unknown,
  options: DirectoryFieldOptions = {},
) {
  const fields: DirectoryField[] = [];
  appendDirectoryFields(fields, value, [], options.maxDepth ?? 3);

  const omitPathSet = new Set(options.omitPaths ?? []);
  const priorityPathMap = new Map(
    (options.priorityPaths ?? []).map((path, index) => [path, index]),
  );

  return fields
    .filter((field) => !omitPathSet.has(field.key))
    .filter((field) => {
      if (!options.hideIdentifierFields) {
        return true;
      }

      const leafKey = field.key.split(".").at(-1) ?? "";
      return !isIdentifierKey(leafKey);
    })
    .sort((left, right) => {
      const leftPriority = priorityPathMap.get(left.key);
      const rightPriority = priorityPathMap.get(right.key);

      if (leftPriority !== undefined || rightPriority !== undefined) {
        return (leftPriority ?? Number.MAX_SAFE_INTEGER) -
          (rightPriority ?? Number.MAX_SAFE_INTEGER);
      }

      return left.label.localeCompare(right.label);
    });
}
