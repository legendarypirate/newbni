"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { getAuthToken } from "@/lib/api-client";
import { INVESTMENT_PUBLISH_PATH, investmentPublishLoginPath } from "@/lib/investment-publish";

type Props = {
  className?: string;
  children?: ReactNode;
  as?: "link" | "button";
};

export default function InvestmentPublishLink({
  className,
  children = "Төсөл нийтлэх",
  as = "link",
}: Props) {
  const router = useRouter();
  const loginHref = investmentPublishLoginPath();

  function goPublish(e?: MouseEvent) {
    e?.preventDefault();
    if (getAuthToken()) {
      router.push(INVESTMENT_PUBLISH_PATH);
      return;
    }
    window.location.href = loginHref;
  }

  if (as === "button") {
    return (
      <button type="button" className={className} onClick={goPublish}>
        {children}
      </button>
    );
  }

  return (
    <Link href={loginHref} className={className} onClick={goPublish}>
      {children}
    </Link>
  );
}
