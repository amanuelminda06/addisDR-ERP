"use client";

import { useSyncExternalStore } from "react";
import { useErpStore } from "@/store/erp-store";

export function useErpHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useErpStore.persist.onFinishHydration(onStoreChange),
    () => useErpStore.persist.hasHydrated(),
    () => false,
  );
}
