"use client";

import type { SpacePresenceStatus } from "@/lib/product/presence-types";

type PresenceDotProps = {
  status: SpacePresenceStatus;
  onlineLabel: string;
  awayLabel: string;
  offlineLabel: string;
};

/**
 * W-16：成员头像旁在线状态圆点（绿 / 橙 / 灰）。
 */
export function PresenceDot({ status, onlineLabel, awayLabel, offlineLabel }: PresenceDotProps) {
  const label =
    status === "online" ? onlineLabel : status === "away" ? awayLabel : offlineLabel;
  const color =
    status === "online"
      ? "bg-emerald-500"
      : status === "away"
        ? "bg-amber-500"
        : "bg-zinc-400 dark:bg-zinc-500";
  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-background ${color}`}
      title={label}
      aria-label={label}
    />
  );
}
