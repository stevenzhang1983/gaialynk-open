"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** 舊「企業治理」子頁對應總旅程第五章（關鍵裁決回到人）。Hash 需由客戶端寫入。 */
const TARGET_HASH = "journey-chapter-5";

export function UseCasesEnterpriseRedirect({ message }: { message: string }) {
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "";

  useEffect(() => {
    if (!locale) return;
    router.replace(`/${locale}/use-cases#${TARGET_HASH}`);
  }, [locale, router]);

  return (
    <p className="text-sm leading-relaxed text-muted-foreground" role="status">
      {message}
    </p>
  );
}
