"use client";

import { patchFetchToBackendApi } from "@/lib/force-backend-api-fetch";

// Patch before child effects fire (avoids unauthenticated cross-origin `/api/*` calls).
if (typeof window !== "undefined") {
  patchFetchToBackendApi();
}

export default function BackendApiFetchPatch() {
  return null;
}
