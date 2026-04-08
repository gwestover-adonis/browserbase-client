export interface MetadataCondition {
  id: string;
  keyPath: string;
  value: string;
}

let nextId = 0;

export function createCondition(
  keyPath = "",
  value = "",
): MetadataCondition {
  return { id: String(++nextId), keyPath, value };
}

/**
 * Converts a dot-separated key path like "order.status" into
 * the Browserbase bracket notation: ['order']['status']
 */
function keyPathToBrackets(keyPath: string): string {
  return keyPath
    .split(".")
    .filter(Boolean)
    .map((segment) => `['${segment}']`)
    .join("");
}

/**
 * Builds a single condition string:
 *   user_metadata['order']['status']:'shipped'
 */
function conditionToQuery(c: MetadataCondition): string | null {
  const key = c.keyPath.trim();
  const val = c.value.trim();
  if (!key || !val) return null;
  return `user_metadata${keyPathToBrackets(key)}:'${val}'`;
}

/**
 * Builds the full `q` parameter value from an array of conditions.
 * Multiple conditions are space-separated (AND semantics per the BB API).
 */
export function conditionsToQuery(conditions: MetadataCondition[]): string {
  return conditions
    .map(conditionToQuery)
    .filter((s): s is string => s !== null)
    .join(" ");
}

/**
 * Best-effort parse of a raw query string back into structured conditions.
 * Handles the format: user_metadata['a']['b']:'value'
 * Returns null if the string doesn't match the expected pattern.
 */
export function queryToConditions(
  raw: string,
): MetadataCondition[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const pattern = /user_metadata((?:\['[^']*'\])+):'([^']*)'/g;
  const conditions: MetadataCondition[] = [];
  let lastIndex = 0;

  for (const match of trimmed.matchAll(pattern)) {
    if (match.index !== undefined && match.index > lastIndex) {
      const gap = trimmed.slice(lastIndex, match.index).trim();
      if (gap.length > 0) return null;
    }
    lastIndex = (match.index ?? 0) + match[0].length;

    const bracketStr = match[1];
    const value = match[2];
    const keyPath = [...bracketStr.matchAll(/\['([^']*)'\]/g)]
      .map((m) => m[1])
      .join(".");

    conditions.push(createCondition(keyPath, value));
  }

  if (conditions.length === 0) return null;

  const trailing = trimmed.slice(lastIndex).trim();
  if (trailing.length > 0) return null;

  return conditions;
}
