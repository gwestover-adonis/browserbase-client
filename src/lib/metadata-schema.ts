import { useMemo } from "react";
import type { Session } from "./types";

export type MetadataSchema = Map<string, Set<string>>;

const MAX_DEPTH = 5;

function walkObject(
  obj: Record<string, unknown>,
  schema: MetadataSchema,
  prefix: string,
  depth: number,
) {
  if (depth > MAX_DEPTH) return;

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      walkObject(value as Record<string, unknown>, schema, path, depth + 1);
    } else {
      let set = schema.get(path);
      if (!set) {
        set = new Set();
        schema.set(path, set);
      }
      set.add(String(value));
    }
  }
}

export function extractMetadataSchema(sessions: Session[]): MetadataSchema {
  const schema: MetadataSchema = new Map();

  for (const session of sessions) {
    if (!session.userMetadata) continue;
    walkObject(session.userMetadata, schema, "", 0);
  }

  return schema;
}

export function useMetadataSchema(sessions: Session[]) {
  return useMemo(() => {
    const schema = extractMetadataSchema(sessions);

    const keyPaths = [...schema.keys()].sort();

    function valuesForKey(keyPath: string): string[] {
      const set = schema.get(keyPath);
      if (!set) return [];
      return [...set].sort();
    }

    return { keyPaths, valuesForKey };
  }, [sessions]);
}
