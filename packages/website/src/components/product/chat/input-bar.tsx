"use client";

import { useRef, useState, type FormEvent } from "react";

type InputBarProps = {
  placeholder?: string;
  sendLabel?: string;
  disabled?: boolean;
  /** 点击输入框或发送时若未登录则调用 */
  onRequireLogin?: () => void;
  /** 发送消息；若返回 false 表示未登录应弹窗 */
  onSend: (text: string) => Promise<boolean>;
  /** 当前是否已登录（未登录时 onRequireLogin 会在 focus/send 时触发） */
  isAuthenticated: boolean;
};

/**
 * T-4.2 输入框：文本输入 + 附件按钮（占位）+ 发送按钮。写操作触发登录检查。
 */
export function InputBar({
  placeholder = "Type a message…",
  sendLabel = "Send",
  disabled = false,
  onRequireLogin,
  onSend,
  isAuthenticated,
}: InputBarProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleFocus = () => {
    if (!isAuthenticated && onRequireLogin) {
      onRequireLogin();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!isAuthenticated && onRequireLogin) {
      onRequireLogin();
      return;
    }
    setSending(true);
    try {
      const ok = await onSend(trimmed);
      if (ok) setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Attach file"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
          onClick={handleFocus}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[40px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={disabled || sending || !text.trim()}
          className="flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {sending ? "…" : sendLabel}
        </button>
      </div>
    </form>
  );
}
