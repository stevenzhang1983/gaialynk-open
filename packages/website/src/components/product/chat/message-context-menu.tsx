"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { W21ModerationCopy } from "@/content/i18n/product-experience";

export type MessageContextMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  destructive?: boolean;
};

type MessageContextMenuProps = {
  children: ReactNode;
  copy: W21ModerationCopy;
  items: MessageContextMenuItem[];
};

const LONG_PRESS_MS = 520;

/**
 * W-21：桌面右键 / 触控长按打开操作菜单。
 */
export function MessageContextMenu({ children, copy, items }: MessageContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = menuRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer, true);
    window.addEventListener("touchstart", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer, true);
      window.removeEventListener("touchstart", onPointer, true);
    };
  }, [open, close]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  if (items.length === 0) {
    return <>{children}</>;
  }

  const openAt = (clientX: number, clientY: number) => {
    const pad = 8;
    const x = Math.min(clientX, typeof window !== "undefined" ? window.innerWidth - 160 : clientX);
    const y = Math.min(clientY, typeof window !== "undefined" ? window.innerHeight - 120 : clientY);
    setCoords({ x: Math.max(pad, x), y: Math.max(pad, y) });
    setOpen(true);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openAt(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      openAt(t.clientX, t.clientY);
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={copy.contextMenuAria}
            className="fixed z-[80] min-w-[11rem] rounded-lg border border-border bg-popover py-1 text-sm text-popover-foreground shadow-lg"
            style={{ left: coords.x, top: coords.y }}
          >
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                role="menuitem"
                className={`block w-full px-3 py-2 text-left text-base hover:bg-muted ${
                  it.destructive ? "text-destructive" : ""
                }`}
                onClick={() => {
                  it.onSelect();
                  close();
                }}
              >
                {it.label}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        onContextMenu={onContextMenu}
        onTouchStart={onTouchStart}
        onTouchEnd={cancelLongPress}
        onTouchCancel={cancelLongPress}
        onTouchMove={cancelLongPress}
        className="max-w-full"
      >
        {children}
      </div>
      {menu}
    </>
  );
}
