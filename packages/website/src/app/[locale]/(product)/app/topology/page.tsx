import type { Metadata } from "next";
import { StatusBadge } from "@/components/status-badge";
import type { Locale } from "@/lib/i18n/locales";

const TOPOLOGY_COPY: Record<
  Locale,
  {
    title: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    flowHeading: string;
    tiers: { id: string; title: string; desc: string }[];
  }
> = {
  en: {
    title: "Conversation topologies (T1–T5)",
    description:
      "We model collaboration as persistent conversations across five topologies, from single user + single agent to delegated agent-to-agent execution.",
    seoTitle: "Session topologies T1–T5 - GaiaLynk Agent IM",
    seoDescription: "Five conversation topologies from single user–agent to delegated A2A.",
    flowHeading: "T1 → T5",
    tiers: [
      { id: "T1", title: "T1 — Single user, single agent", desc: "One human, one agent in one conversation. Default for simple flows." },
      { id: "T2", title: "T2 — Single user, multiple agents", desc: "One human, several agents; user sees one thread, platform routes to the right capability." },
      { id: "T3", title: "T3 — Multi-party (users + agents)", desc: "Multiple humans and agents in one conversation; shared context and visibility." },
      { id: "T4", title: "T4 — Agent-as-orchestrator", desc: "One agent coordinates other agents; user delegates to the orchestrator." },
      { id: "T5", title: "T5 — Delegated agent-to-agent", desc: "Agents act on behalf of users with delegation tickets; scope, revocation, and audit are explicit." },
    ],
  },
  "zh-Hant": {
    title: "會話拓撲（T1–T5）",
    description: "我們用五種拓撲來建模協作：從單一使用者與單一 Agent，到委託的 Agent 對 Agent 執行。",
    seoTitle: "會話拓撲 T1–T5 - GaiaLynk Agent IM",
    seoDescription: "五種會話拓撲：從單一使用者–Agent 到委託 A2A。",
    flowHeading: "T1 → T5",
    tiers: [
      { id: "T1", title: "T1 — 單一使用者、單一 Agent", desc: "一個人類、一個 Agent 在一個會話中，適合最簡單流程。" },
      { id: "T2", title: "T2 — 單一使用者、多 Agent", desc: "一個人類、多個 Agent；使用者看到單一線程，平台負責路由到正確能力。" },
      { id: "T3", title: "T3 — 多方（使用者 + Agent）", desc: "多個人類與 Agent 在同一會話；共享上下文與可見性。" },
      { id: "T4", title: "T4 — Agent 作為編排者", desc: "一個 Agent 協調其他 Agent；使用者委託給編排者。" },
      { id: "T5", title: "T5 — 委託的 Agent 對 Agent", desc: "Agent 憑委託票代表使用者執行；範圍、撤銷與審計皆可明確追蹤。" },
    ],
  },
  "zh-Hans": {
    title: "会话拓扑（T1–T5）",
    description: "我们用五种拓扑来建模协作：从单一用户与单一 Agent，到委托的 Agent 对 Agent 执行。",
    seoTitle: "会话拓扑 T1–T5 - GaiaLynk Agent IM",
    seoDescription: "五种会话拓扑：从单一用户–Agent 到委托 A2A。",
    flowHeading: "T1 → T5",
    tiers: [
      { id: "T1", title: "T1 — 单一用户、单一 Agent", desc: "一个人类、一个 Agent 在一个会话中，适合最简单流程。" },
      { id: "T2", title: "T2 — 单一用户、多 Agent", desc: "一个人类、多个 Agent；用户看到单一线程，平台负责路由到正确能力。" },
      { id: "T3", title: "T3 — 多方（用户 + Agent）", desc: "多个人类与 Agent 在同一会话；共享上下文与可见性。" },
      { id: "T4", title: "T4 — Agent 作为编排者", desc: "一个 Agent 协调其他 Agent；用户委托给编排者。" },
      { id: "T5", title: "T5 — 委托的 Agent 对 Agent", desc: "Agent 凭委托票代表用户执行；范围、撤销与审计皆可明确追踪。" },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = TOPOLOGY_COPY[locale];
  return {
    title: copy.seoTitle,
    description: copy.seoDescription,
    alternates: { canonical: `/${locale}/topology` },
  };
}

export default async function TopologyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = TOPOLOGY_COPY[locale];

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
          <StatusBadge status="In Progress" locale={locale} />
        </div>
        <p className="max-w-3xl text-base text-muted-foreground">{copy.description}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">{copy.flowHeading}</h2>
        <ul className="mt-4 space-y-4">
          {copy.tiers.map((tier) => (
            <li key={tier.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
              <span className="shrink-0 font-mono text-sm font-semibold text-primary">{tier.id}</span>
              <div>
                <p className="font-medium text-foreground">{tier.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tier.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-muted-foreground">
        Conversation metadata includes <code className="rounded bg-muted px-1">conversation_topology</code> (T1–T5), authorization mode, visibility mode, and risk level. See mainline APIs and docs for delegation tickets (T5).
      </p>
    </section>
  );
}
