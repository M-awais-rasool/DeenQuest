import { useEffect, useState } from "react";
import api from "./api";
import type { ContentRegistry, ContentSchema, EnumOption } from "../types";

// Module-level cache so the registry is fetched once per session and shared
// across the editor pages.
let cached: ContentRegistry | null = null;
let inflight: Promise<ContentRegistry> | null = null;

const EMPTY: ContentRegistry = {
  lesson_components: [],
  mini_games: [],
  blocks: [],
  enums: {},
};

async function load(): Promise<ContentRegistry> {
  if (cached) return cached;
  if (!inflight) {
    inflight = api
      .get("/v1/admin/registry")
      .then((res) => {
        cached = res.data.data as ContentRegistry;
        return cached;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useRegistry() {
  const [registry, setRegistry] = useState<ContentRegistry>(cached ?? EMPTY);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) {
      setRegistry(cached);
      setLoading(false);
      return;
    }
    let active = true;
    load()
      .then((r) => active && setRegistry(r))
      .catch(() => active && setError("Failed to load component registry"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { registry, loading, error };
}

// ─── Helpers ───

export function findSchema(
  list: ContentSchema[],
  name: string,
): ContentSchema | undefined {
  return list.find((s) => s.name === name);
}

export function enumLabel(
  options: EnumOption[] | undefined,
  value: string,
): string {
  const opt = options?.find((o) => o.value === value);
  return opt ? `${opt.icon ? opt.icon + " " : ""}${opt.label}` : value;
}
