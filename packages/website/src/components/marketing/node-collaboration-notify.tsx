"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<
  Locale,
  {
    title: string;
    badge: string;
    visionTitle: string;
    visionBody: string;
    notifyTitle: string;
    notifyPlaceholder: string;
    notifySubmit: string;
    notifySuccess: string;
    notifyError: string;
    ctaDevelopers: string;
    backHome: string;
  }
> = {
  en: {
    title: "Node collaboration",
    badge: "Coming Soon",
    visionTitle: "Cross-node trusted collaboration",
    visionBody:
      "Connect distributed nodes while preserving trust boundaries and governance controls. Directory sync, traceable invocation origin per node, and consistent policy enforcement across the network. We are building this next—get notified when it's ready.",
    notifyTitle: "Get notified",
    notifyPlaceholder: "your@email.com",
    notifySubmit: "Notify me",
    notifySuccess: "Thanks, we'll notify you.",
    notifyError: "Something went wrong. Try again or contact us.",
    ctaDevelopers: "Developers",
    backHome: "Back to Home",
  },
  "zh-Hant": {
    title: "節點協作",
    badge: "即將推出",
    visionTitle: "跨節點可信協作",
    visionBody:
      "連接分散節點，同時維持信任邊界與治理控制。目錄同步、每次調用可追溯來源節點，以及全網一致的策略執行。我們正在建造中，上線時通知你。",
    notifyTitle: "訂閱通知",
    notifyPlaceholder: "your@email.com",
    notifySubmit: "通知我",
    notifySuccess: "已記錄，我們會通知你。",
    notifyError: "提交失敗，請重試或聯絡我們。",
    ctaDevelopers: "開發者",
    backHome: "返回首頁",
  },
  "zh-Hans": {
    title: "节点协作",
    badge: "即将推出",
    visionTitle: "跨节点可信协作",
    visionBody:
      "连接分布式节点，同时保持信任边界与治理控制。目录同步、每次调用可追溯来源节点，以及全网一致的策略执行。我们正在建造中，上线时通知你。",
    notifyTitle: "订阅通知",
    notifyPlaceholder: "your@email.com",
    notifySubmit: "通知我",
    notifySuccess: "已记录，我们会通知你。",
    notifyError: "提交失败，请重试或联系我们。",
    ctaDevelopers: "开发者",
    backHome: "返回首页",
  },
};

type NodeCollaborationNotifyProps = {
  locale: Locale;
};

export function NodeCollaborationNotify({ locale }: NodeCollaborationNotifyProps) {
  const c = COPY[locale];
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "demo",
        locale,
        name: "Node collaboration subscriber",
        email: email.trim(),
        company: "-",
        useCase: "Node collaboration updates",
        source: "node_collaboration_notify",
      }),
    });

    const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!res.ok || !result?.ok) {
      setStatus("error");
      setMessage(result?.error || c.notifyError);
      return;
    }
    setStatus("success");
    setMessage(c.notifySuccess);
  }

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={`/${locale}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {c.backHome}
        </Link>
      </div>

      <header className="space-y-3">
        <span className="inline-flex rounded-md border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {c.badge}
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {c.title}
        </h1>
      </header>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.visionTitle}</h2>
        <p className="mt-3 text-muted-foreground">{c.visionBody}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.notifyTitle}</h2>
        <form onSubmit={onSubmit} className="mt-4 flex flex-wrap gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={c.notifyPlaceholder}
            required
            className="min-w-[200px] rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {status === "loading" ? "..." : c.notifySubmit}
          </button>
        </form>
        {message ? (
          <p className={`mt-3 text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            {message}
          </p>
        ) : null}
      </section>

      <div>
        <Link
          href={`/${locale}/developers`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {c.ctaDevelopers} →
        </Link>
      </div>
    </div>
  );
}
