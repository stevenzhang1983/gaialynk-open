"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getProductUiCopy,
  getSpaceUiCopy,
  getW15RbacUiCopy,
} from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";
import type { SpaceMemberRow, SpaceMemberRole } from "@/components/product/space-context";
import { useSpace } from "@/components/product/space-context";
import { useIdentity } from "@/lib/identity/context";
import { useSpacePermissions } from "@/hooks/use-space-permissions";

function roleLabel(locale: Locale, role: SpaceMemberRole): string {
  const c = getSpaceUiCopy(locale);
  const map: Record<SpaceMemberRole, string> = {
    owner: c.roleOwner,
    admin: c.roleAdmin,
    member: c.roleMember,
    guest: c.roleGuest,
  };
  return map[role] ?? role;
}

type PresenceStatus = "online" | "away" | "offline";

function PresenceDot({
  status,
  labels,
}: {
  status: PresenceStatus | undefined;
  labels: { online: string; away: string; offline: string };
}) {
  const s = status ?? "offline";
  const color =
    s === "online" ? "bg-emerald-500" : s === "away" ? "bg-amber-500" : "bg-muted-foreground/40";
  const title = s === "online" ? labels.online : s === "away" ? labels.away : labels.offline;
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`}
      title={title}
      aria-label={title}
    />
  );
}

/**
 * W-3 + W-15：成员展示（display_name / email_masked / 在线状态）、owner 角色管理与移除、审计导出、Agent 代邀请说明。
 */
export function SpaceMembersPanel({ locale }: { locale: Locale }) {
  const copy = getSpaceUiCopy(locale);
  const productUi = getProductUiCopy(locale);
  const w15 = getW15RbacUiCopy(locale);
  const { userId } = useIdentity();
  const { currentSpaceId, currentSpace, canInviteToSpace, isGuestInSpace, myRole, refreshSpaces } = useSpace();
  const perms = useSpacePermissions(myRole);

  const [members, setMembers] = useState<SpaceMemberRow[]>([]);
  const [presenceByUser, setPresenceByUser] = useState<Record<string, PresenceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [presetRole, setPresetRole] = useState<"member" | "admin" | "guest">("member");
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [roleBusyUserId, setRoleBusyUserId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SpaceMemberRow | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);

  const showBanner = useCallback((kind: "ok" | "err", text: string) => {
    setBanner({ kind, text });
    window.setTimeout(() => setBanner(null), 5000);
  }, []);

  const loadData = useCallback(async () => {
    if (!currentSpaceId) {
      setMembers([]);
      setPresenceByUser({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [mr, pr] = await Promise.all([
        fetch(`/api/mainline/spaces/${currentSpaceId}/members`, { cache: "no-store" }),
        fetch(`/api/mainline/spaces/${currentSpaceId}/presence`, { cache: "no-store" }),
      ]);
      const mj = await mr.json().catch(() => ({}));
      const pj = await pr.json().catch(() => ({}));
      setMembers(Array.isArray(mj.data) ? mj.data : []);
      const map: Record<string, PresenceStatus> = {};
      const rows = pj?.data?.members;
      if (Array.isArray(rows)) {
        for (const row of rows as { user_id?: string; presence_status?: string }[]) {
          if (row.user_id && row.presence_status) {
            const ps = row.presence_status as PresenceStatus;
            if (ps === "online" || ps === "away" || ps === "offline") map[row.user_id] = ps;
          }
        }
      }
      setPresenceByUser(map);
    } catch {
      setMembers([]);
      setPresenceByUser({});
    } finally {
      setLoading(false);
    }
  }, [currentSpaceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const buildJoinUrl = (token: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/${locale}/app/join-space?token=${encodeURIComponent(token)}`;
  };

  const handleInvite = async () => {
    if (!currentSpaceId || !canInviteToSpace || inviteBusy) return;
    setInviteBusy(true);
    setInviteToken(null);
    try {
      const res = await fetch(`/api/mainline/spaces/${currentSpaceId}/invitations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preset_role: presetRole, ttl_hours: 24 }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data?.token) {
        setInviteToken(json.data.token as string);
      }
    } finally {
      setInviteBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteToken) return;
    const url = buildJoinUrl(inviteToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleRoleChange = async (target: SpaceMemberRow, next: SpaceMemberRole) => {
    if (!currentSpaceId || !perms.mayEditMemberRolesInUi || next === target.role) return;
    setRoleBusyUserId(target.user_id);
    try {
      const res = await fetch(`/api/mainline/spaces/${currentSpaceId}/members/${target.user_id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        showBanner("ok", w15.roleUpdated);
        await loadData();
        void refreshSpaces();
      } else {
        showBanner("err", (json as { error?: { message?: string } }).error?.message ?? w15.roleSaveFailed);
      }
    } finally {
      setRoleBusyUserId(null);
    }
  };

  const handleRemove = async () => {
    if (!currentSpaceId || !removeTarget) return;
    setRemoveBusy(true);
    try {
      const res = await fetch(`/api/mainline/spaces/${currentSpaceId}/members/${removeTarget.user_id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        showBanner("ok", w15.memberRemoved);
        setRemoveTarget(null);
        await loadData();
        void refreshSpaces();
      } else {
        showBanner("err", (json as { error?: { message?: string } }).error?.message ?? w15.roleSaveFailed);
      }
    } finally {
      setRemoveBusy(false);
    }
  };

  const handleAuditExport = async () => {
    if (!currentSpaceId || !perms.mayExportAudit || auditBusy) return;
    setAuditBusy(true);
    try {
      const res = await fetch(
        `/api/mainline/audit-events?space_id=${encodeURIComponent(currentSpaceId)}&limit=200`,
        { cache: "no-store" },
      );
      const text = await res.text();
      if (!res.ok) {
        showBanner("err", w15.exportFailed);
        return;
      }
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-space-${currentSpaceId.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showBanner("ok", w15.auditExportDone);
    } catch {
      showBanner("err", w15.exportFailed);
    } finally {
      setAuditBusy(false);
    }
  };

  const presenceLabels = { online: w15.presenceOnline, away: w15.presenceAway, offline: w15.presenceOffline };

  if (!currentSpaceId) {
    return <p className="text-sm text-muted-foreground">{copy.noMembers}</p>;
  }

  return (
    <div className="space-y-8">
      {banner ? (
        <div
          role="status"
          className={`rounded-lg border px-3 py-2 text-sm ${
            banner.kind === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-foreground"
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold text-foreground">{currentSpace?.name ?? copy.membersTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.membersDescription}</p>
      </div>

      {perms.mayExportAudit ? (
        <section aria-labelledby="space-audit-export-heading" className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h3 id="space-audit-export-heading" className="text-sm font-semibold text-foreground">
            {w15.exportAuditJson}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{w15.auditExportHint}</p>
          <button
            type="button"
            disabled={auditBusy}
            onClick={() => void handleAuditExport()}
            className="mt-3 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {auditBusy ? w15.exporting : w15.exportAuditJson}
          </button>
        </section>
      ) : null}

      <section aria-labelledby="space-members-heading">
        <h3 id="space-members-heading" className="text-sm font-semibold text-foreground">
          {copy.memberRosterHeading}
        </h3>
        {loading ? (
          <p className="mt-2 text-sm text-muted-foreground">…</p>
        ) : members.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{copy.noMembers}</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-3 py-2 font-medium">{copy.memberColumnUser}</th>
                  <th className="px-3 py-2 font-medium w-10" aria-hidden />
                  <th className="px-3 py-2 font-medium">{copy.memberColumnRole}</th>
                  <th className="px-3 py-2 font-medium">{w15.agentDelegateTitle}</th>
                  <th className="px-3 py-2 font-medium">{copy.memberColumnJoined}</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isSelf = Boolean(userId && m.user_id === userId);
                  const primary =
                    (m.display_name && m.display_name.trim()) ||
                    (m.email_masked && m.email_masked.trim()) ||
                    w15.memberDisplayFallback;
                  const secondary =
                    m.display_name?.trim() && m.email_masked?.trim() ? m.email_masked.trim() : null;
                  const subId = (
                    <span className="font-mono text-[10px] text-muted-foreground">{m.user_id.slice(0, 8)}…</span>
                  );
                  const canEditThis =
                    perms.mayEditMemberRolesInUi && !isSelf && m.role !== "owner" && Boolean(userId);
                  const canRemoveThis =
                    perms.mayRemoveMembersInUi && !isSelf && m.role !== "owner" && Boolean(userId);
                  const delegateChecked = m.role === "owner" || m.role === "admin";
                  return (
                    <tr key={`${m.space_id}-${m.user_id}`} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {primary}
                            {isSelf ? (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">({w15.youLabel})</span>
                            ) : null}
                          </span>
                          {secondary ? (
                            <span className="text-xs text-muted-foreground">{secondary}</span>
                          ) : null}
                          {subId}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <PresenceDot status={presenceByUser[m.user_id]} labels={presenceLabels} />
                      </td>
                      <td className="px-3 py-2 align-top text-muted-foreground">
                        {canEditThis ? (
                          <select
                            value={m.role}
                            disabled={roleBusyUserId === m.user_id}
                            onChange={(e) =>
                              void handleRoleChange(m, e.target.value as SpaceMemberRole)
                            }
                            className="max-w-[9rem] rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                            aria-label={`${copy.memberColumnRole} — ${primary}`}
                          >
                            <option value="admin">{roleLabel(locale, "admin")}</option>
                            <option value="member">{roleLabel(locale, "member")}</option>
                            <option value="guest">{roleLabel(locale, "guest")}</option>
                          </select>
                        ) : (
                          roleLabel(locale, m.role)
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            readOnly
                            checked={delegateChecked}
                            tabIndex={-1}
                            className="mt-0.5 accent-primary"
                            title={
                              delegateChecked ? w15.agentDelegateEligible : w15.agentDelegateNotEligible
                            }
                            aria-label={w15.agentDelegateTitle}
                          />
                          <span className="text-xs text-muted-foreground leading-snug">
                            {delegateChecked ? w15.agentDelegateEligible : w15.agentDelegateNotEligible}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                        {m.joined_at.slice(0, 10)}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {canRemoveThis ? (
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(m)}
                            className="text-xs font-medium text-destructive hover:underline"
                          >
                            {w15.removeMember}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="space-invite-heading" className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 id="space-invite-heading" className="text-sm font-semibold text-foreground">
          {copy.inviteSectionTitle}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{copy.inviteShareNote}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {copy.invitePresetRole}
            <select
              value={presetRole}
              onChange={(e) => setPresetRole(e.target.value as typeof presetRole)}
              disabled={!canInviteToSpace}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="member">{roleLabel(locale, "member")}</option>
              <option value="admin">{roleLabel(locale, "admin")}</option>
              <option value="guest">{roleLabel(locale, "guest")}</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canInviteToSpace || inviteBusy}
            title={isGuestInSpace ? copy.guestNoInviteTooltip : undefined}
            onClick={() => void handleInvite()}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            {inviteBusy ? "…" : copy.inviteGenerate}
          </button>
        </div>
        {inviteToken && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{copy.inviteLinkLabel}</label>
            <div className="flex flex-wrap gap-2">
              <input
                readOnly
                value={buildJoinUrl(inviteToken)}
                className="min-w-[200px] flex-1 rounded-md border border-border bg-muted/20 px-2 py-1.5 font-mono text-[11px] text-foreground"
              />
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
              >
                {copied ? copy.inviteCopied : copy.inviteCopy}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">{copy.inviteTtlHint}</p>
          </div>
        )}
      </section>

      <p className="text-sm">
        <Link href={`/${locale}/app/chat`} className="font-medium text-primary hover:underline">
          ← {productUi.chat}
        </Link>
      </p>

      {removeTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-member-title"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 id="remove-member-title" className="text-lg font-semibold text-foreground">
              {w15.removeConfirmTitle}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{w15.removeConfirmBody}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {w15.cancel}
              </button>
              <button
                type="button"
                disabled={removeBusy}
                onClick={() => void handleRemove()}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
              >
                {removeBusy ? "…" : w15.removeConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
