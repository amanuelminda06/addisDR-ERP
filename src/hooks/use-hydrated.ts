"use client";

import { useSyncExternalStore } from "react";

/**
 * Hydration state is tracked here rather than read straight from
 * useErpStore.persist.hasHydrated(). That flag is internal to Zustand and stays
 * false when the storage read fails, which would strand every HydrationGate on
 * its skeleton. Owning the flag lets us unblock the UI even when sessionStorage
 * is unavailable, while keeping the server snapshot false so SSR and the first
 * client render agree.
 */
let hydrated = false;
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): boolean {
  return hydrated;
}

function getServerSnapshot(): boolean {
  return false;
}

export function markErpHydrated(): void {
  if (hydrated) return;
  hydrated = true;
  for (const listener of listeners) listener();
}

export function useErpHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
