export interface PropertyFilters {
  createdAfter?: string;
  createdBefore?: string;
  durationMin?: number;
  durationMax?: number;
  regions?: string[];
  proxyBytesMin?: number;
  proxyBytesMax?: number;
}

export const KNOWN_REGIONS = [
  "us-west-2",
  "us-east-1",
  "eu-central-1",
  "ap-southeast-1",
] as const;

export const EMPTY_FILTERS: PropertyFilters = {
  regions: [...KNOWN_REGIONS],
};

function isRegionFilterActive(regions: string[] | undefined): boolean {
  if (regions == null || regions.length === 0) return true;
  if (regions.length === KNOWN_REGIONS.length) return false;
  return true;
}

export function isFiltersActive(filters: PropertyFilters): boolean {
  return (
    filters.createdAfter != null ||
    filters.createdBefore != null ||
    filters.durationMin != null ||
    filters.durationMax != null ||
    isRegionFilterActive(filters.regions) ||
    filters.proxyBytesMin != null ||
    filters.proxyBytesMax != null
  );
}

export function countActiveFilters(filters: PropertyFilters): number {
  let count = 0;
  if (filters.createdAfter != null || filters.createdBefore != null) count++;
  if (filters.durationMin != null || filters.durationMax != null) count++;
  if (isRegionFilterActive(filters.regions)) count++;
  if (filters.proxyBytesMin != null || filters.proxyBytesMax != null) count++;
  return count;
}
