"use client";

import { useEffect } from "react";
import { patchFetchToBackendApi } from "@/lib/force-backend-api-fetch";

export default function BackendApiFetchPatch() {
  useEffect(() => {
    patchFetchToBackendApi();
  }, []);

  return null;
}
