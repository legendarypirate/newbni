"use client";

import Link from "next/link";
import { Suspense } from "react";
import PitchDeckEditor from "@/app/investments/PitchDeckEditor";

export default function InvestmentsPlatformPanel() {
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Хөрөнгө оруулалтын удирдлага</h1>
          <p className="text-muted small mb-0">
            Pitch Deck бэлтгэж, төслөө нийтэлж хөрөнгө оруулагчтай холбогдоно уу.
          </p>
        </div>
        <Link href="/investments" className="btn btn-sm btn-outline-primary">
          <i className="fa-solid fa-magnifying-glass me-1" aria-hidden="true" />
          Төсөл хайх
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="py-5 text-center text-muted small" aria-busy="true">
            Pitch Deck ачаалж байна…
          </div>
        }
      >
        <PitchDeckEditor />
      </Suspense>
    </>
  );
}
