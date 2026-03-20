"use client";

type StatusBarProps = {
  connectionStatus?: string;
  agentsOnlineLabel?: string;
  agentOnlineCount?: number;
  defaultSpaceLabel?: string;
  currentSpace?: string;
  ariaLabel?: string;
  isDemo?: boolean;
  demoLabel?: string;
};

/**
 * 产品区底部状态栏（T-2.3）
 * 连接状态 | Agent 在线数 | 当前空间；Demo 模式显示模拟连接状态而非 "Disconnected"。
 */
export function StatusBar({
  connectionStatus = "Disconnected",
  agentsOnlineLabel = "Agents online",
  agentOnlineCount = 0,
  defaultSpaceLabel = "Default space",
  currentSpace,
  ariaLabel = "Status bar",
  isDemo = true,
  demoLabel = "Demo",
}: StatusBarProps) {
  const space = currentSpace ?? defaultSpaceLabel;
  const displayStatus = isDemo ? demoLabel : connectionStatus;
  const statusColor = isDemo
    ? "text-amber-600"
    : "text-emerald-600";

  return (
    <footer
      className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-border bg-surface px-3 py-1.5 text-[11px] text-muted-foreground sm:px-4 sm:text-xs"
      role="status"
      aria-label={ariaLabel}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusColor}`} />
        {displayStatus}
      </span>
      <span>
        {agentsOnlineLabel} {agentOnlineCount}
      </span>
      <span>{space}</span>
    </footer>
  );
}
