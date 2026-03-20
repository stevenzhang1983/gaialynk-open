"use client";

import { useCallback, useEffect, useState } from "react";

/** T-5.5 GET /api/v1/approvals/:id 返回的详情 */
type ApprovalDetail = {
  id: string;
  conversation_id: string;
  agent_id: string;
  requester_id: string;
  user_text: string;
  status: string;
  created_at: string;
  updated_at: string;
  agent: {
    id: string;
    name: string;
    description?: string;
    agent_type?: string;
    capabilities?: unknown;
  };
};

/** T-5.5 GET /api/v1/approvals/:id/chain 返回的链事件 */
type ApprovalChainEvent = {
  event_type: string;
  actor_type: string;
  actor_id: string;
  trust_decision?: unknown;
  created_at: string;
  payload?: Record<string, unknown>;
};

type ApprovalContextProps = {
  approvalId: string;
};

/**
 * T-4.4 审批视图：审批详情、触发原因、调用链摘要。
 * 对接 T-5.5 GET /api/mainline/approvals/:id 与 GET /api/mainline/approvals/:id/chain。
 */
export function ApprovalContext({ approvalId }: ApprovalContextProps) {
  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [chain, setChain] = useState<ApprovalChainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [detailRes, chainRes] = await Promise.all([
        fetch(`/api/mainline/approvals/${approvalId}`, { cache: "no-store" }),
        fetch(`/api/mainline/approvals/${approvalId}/chain`, { cache: "no-store" }),
      ]);
      const detailJson = await detailRes.json().catch(() => ({}));
      const chainJson = await chainRes.json().catch(() => ({}));

      if (detailRes.ok && detailJson.data) {
        setDetail(detailJson.data);
      } else {
        setDetail(null);
        if (!detailRes.ok && detailJson?.error?.message) {
          setError(detailJson.error.message);
        }
      }

      if (chainRes.ok && Array.isArray(chainJson.data)) {
        setChain(chainJson.data);
      } else {
        setChain([]);
      }
    } catch {
      setDetail(null);
      setChain([]);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [approvalId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Loading approval…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">{error ?? "Approval not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Approval</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">ID: {detail.id.slice(0, 12)}…</p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Status</h4>
        <p className="mt-1 text-sm font-medium text-foreground capitalize">{detail.status.replace(/_/g, " ")}</p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Trigger (user request)</h4>
        <p className="mt-1 text-sm text-foreground">{detail.user_text || "—"}</p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Agent</h4>
        <p className="mt-1 text-sm text-foreground">{detail.agent?.name ?? detail.agent_id}</p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Call chain summary</h4>
        {chain.length > 0 ? (
          <ol className="mt-1.5 list-inside list-decimal space-y-1 text-sm text-foreground">
            {chain.map((event, i) => (
              <li key={i}>
                <span className="font-medium">{event.actor_id}</span> · {event.event_type}
                {event.created_at && (
                  <span className="ml-1 text-muted-foreground">
                    ({new Date(event.created_at).toLocaleString()})
                  </span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}
