"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCookieCopy } from "@/content/i18n/product-experience";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

const STORAGE_KEY = "gl_cookie_consent";

function localeFromPathname(pathname: string | null): Locale {
  if (!pathname) return "en";
  const seg = pathname.split("/").filter(Boolean)[0];
  return isSupportedLocale(seg) ? seg : "en";
}

/**
 * T-6.5：文案随当前路由 locale 切换（根 layout 无 locale 参数，故用 pathname 推断）。
 */
export function CookieBanner() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const { message, accept } = getCookieCopy(locale);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = window.localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-border bg-card p-4 shadow-xl md:inset-x-auto md:right-6 md:w-[420px]">
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "accepted");
          setVisible(false);
        }}
      >
        {accept}
      </button>
    </div>
  );
}
