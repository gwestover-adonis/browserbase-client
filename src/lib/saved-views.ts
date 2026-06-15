import type { SessionStatus } from "./types";
import type { PropertyFilters } from "./property-filters";

export interface SavedView {
  id: string;
  name: string;
  status: string;
  q?: string;
  propertyFilters: PropertyFilters;
  savedAt: string;
}

interface SavedViewsState {
  views: SavedView[];
}

const STORAGE_KEY = "browserbase-saved-views";

function load(): SavedViewsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SavedViewsState;
  } catch {
    // ignore
  }
  return { views: [] };
}

function save(state: SavedViewsState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getSavedViews(): SavedView[] {
  return load().views;
}

export function saveView(
  name: string,
  status: string,
  q: string | undefined,
  propertyFilters: PropertyFilters,
): SavedView {
  const state = load();
  const view: SavedView = {
    id: `view_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    status,
    q,
    propertyFilters,
    savedAt: new Date().toISOString(),
  };
  state.views = [view, ...state.views];
  save(state);
  return view;
}

export function deleteSavedView(id: string): void {
  const state = load();
  state.views = state.views.filter((v) => v.id !== id);
  save(state);
}

export type { SessionStatus };
