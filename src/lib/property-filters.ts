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

export function defaultFilters(): PropertyFilters {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const createdAfter = d.toISOString().slice(0, 10);
  return { regions: [...KNOWN_REGIONS], createdAfter };
}

export function isFiltersActive(filters: PropertyFilters): boolean {
  const regionActive =
    filters.regions != null &&
    filters.regions.length > 0 &&
    filters.regions.length < KNOWN_REGIONS.length;
  return (
    filters.createdAfter != null ||
    filters.createdBefore != null ||
    filters.durationMin != null ||
    filters.durationMax != null ||
    regionActive ||
    filters.proxyBytesMin != null ||
    filters.proxyBytesMax != null
  );
}
