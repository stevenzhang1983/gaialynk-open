"use client";

type StatusBarProps = {
  connectionStatus?: string;
  agentsOnlineLabel?: string;
  agentOnlineCount?: number;
  defaultSpaceLabel?: string;
  currentSpace?: string;
  ariaLabel?: string;
};

/**
 * 产品区底部状态栏（T-2.3）
 * 连接状态 | Agent 在线数 | 当前空间；未登录可正常展示，使用 Mock 数据。
 */
export function StatusBar({
  connectionStatus = "Disconnected",
  agentsOnlineLabel = "Agents online",
  agentOnlineCount = 0,
  defaultSpaceLabel = "Default space",
  currentSpace,
  ariaLabel = "Status bar",
}: StatusBarProps) {
  const space = currentSpace ?? defaultSpaceLabel;
  return (
    <footer
      className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-border bg-surface px-3 py-1.5 text-[11px] text-muted-foreground sm:px-4 sm:text-xs"
      role="status"
      aria-label={ariaLabel}
    >
      <span>{connectionStatus}</span>
      <span>
        {agentsOnlineLabel} {agentOnlineCount}
      </span>
      <span>{space}</span>
    </footer>
  );
}
