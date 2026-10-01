"use client";

import { useEffect } from "react";
import { markErpHydrated, useErpHydrated } from "@/hooks/use-hydrated";
import { useErpStore } from "@/store/erp-store";

/**
 * The store is configured with skipHydration: true so the server never touches
 * sessionStorage and both renders agree on the seeded state. That option also
 * means nothing hydrates the store unless we ask it to, so this component runs
 * the single rehydrate pass on client mount. Without it the store stays on its
 * in-memory seed forever and every HydrationGate renders its skeleton
 * indefinitely, which is what made all pages appear blank.
 */
export function StoreHydrator() {
  useErpHydrated();

  useEffect(() => {
    const persist = useErpStore.persist;
    if (persist.hasHydrated()) {
      markErpHydrated();
      return;
    }
    // Persisted state wins on a version match, so the seed is applied first and
    // then overridden. A rejected read leaves the seeded state in place, which
    // is still a fully usable demo, so the gates get released either way.
    void Promise.resolve(persist.rehydrate()).then(
      () => markErpHydrated(),
      () => markErpHydrated(),
    );
  }, []);

  return null;
}
