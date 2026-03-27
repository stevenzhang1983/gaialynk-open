"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";

export type MentionCandidate = {
  id: string;
  kind: "user" | "agent";
  label: string;
};

/** 与主线默认 CONNECTOR_UPLOAD_MAX_BYTES 对齐（2 MB） */
const UPLOAD_MAX_BYTES = 2_000_000;

export type ChatAttachmentCopy = {
  attachAria: string;
  uploading: string;
  uploadFailed: string;
  attachedPrefix: string;
  removeAria: string;
  fileTooLarge: string;
  defaultMessageWithFile: string;
};

type InputBarProps = {
  placeholder?: string;
  sendLabel?: string;
  disabled?: boolean;
  onRequireLogin?: () => void;
  onSend: (text: string, options?: { fileRefId?: string }) => Promise<boolean>;
  isAuthenticated: boolean;
  /** W-3：@ 触发提及候选（主线格式 @user:uuid / @agent:uuid） */
  mentionCandidates?: MentionCandidate[];
  mentionEmptyLabel?: string;
  /** W-9：首启「一句话目标」预填（消费后由父级清空） */
  initialDraft?: string;
  /** V1.3：聊天附件文案与上传 */
  attachmentCopy: ChatAttachmentCopy;
  /** W-15：guest 等角色不展示附件/连接器上传入口（与主线 trigger_connector 对齐） */
  showAttachmentButton?: boolean;
  /** W-16：输入活动（由父级经 WS 发送 typing_start，宜节流） */
  onTypingPulse?: () => void;
  onTypingCease?: () => void;
};

function mentionMatch(text: string, cursor: number): { start: number; rawQuery: string } | null {
  const before = text.slice(0, cursor);
  const m = before.match(/@([\w:-]*)$/);
  if (!m) return null;
  return { start: cursor - m[0].length, rawQuery: (m[1] ?? "").toLowerCase() };
}

function insertMention(text: string, replaceStart: number, cursor: number, token: string): { next: string; caret: number } {
  const before = text.slice(0, replaceStart);
  const after = text.slice(cursor);
  const insertion = `${token} `;
  const next = before + insertion + after;
  return { next, caret: before.length + insertion.length };
}

/**
 * T-4.2 / W-3 输入框：支持 @ 提及自动完成；V1.3 浏览器文件上传 → file_ref_id 发消息。
 */
export function InputBar({
  placeholder = "Type a message…",
  sendLabel = "Send",
  disabled = false,
  onRequireLogin,
  onSend,
  isAuthenticated,
  mentionCandidates = [],
  mentionEmptyLabel = "No matches",
  initialDraft,
  attachmentCopy,
  showAttachmentButton = true,
  onTypingPulse,
  onTypingCease,
}: InputBarProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [openMention, setOpenMention] = useState(false);
  const [mentionStart, setMentionStart] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [pendingFile, setPendingFile] = useState<{ refId: string; name: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = mentionCandidates.filter((c) => {
    if (!mentionQuery) return true;
    const q = mentionQuery;
    return (
      c.label.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      `${c.kind}:${c.id}`.toLowerCase().includes(q)
    );
  });

  const syncMentionFromCursor = useCallback(
    (value: string, cursor: number) => {
      if (!mentionCandidates.length) {
        setOpenMention(false);
        return;
      }
      const mm = mentionMatch(value, cursor);
      if (!mm) {
        setOpenMention(false);
        return;
      }
      setOpenMention(true);
      setMentionStart(mm.start);
      setMentionQuery(mm.rawQuery);
      setHighlightIdx(0);
    },
    [mentionCandidates.length],
  );

  useEffect(() => {
    if (!openMention) return;
    setHighlightIdx((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [openMention, filtered.length]);

  useEffect(() => {
    const t = initialDraft?.trim();
    if (t) setText(t);
  }, [initialDraft]);

  const pickMention = useCallback(
    (c: MentionCandidate) => {
      const el = inputRef.current;
      const cursor = el?.selectionStart ?? text.length;
      const token = c.kind === "user" ? `@user:${c.id}` : `@agent:${c.id}`;
      const { next, caret } = insertMention(text, mentionStart, cursor, token);
      setText(next);
      setOpenMention(false);
      requestAnimationFrame(() => {
        el?.focus();
        try {
          el?.setSelectionRange(caret, caret);
        } catch {
          // ignore
        }
      });
    },
    [mentionStart, text],
  );

  const requireAuthOr = useCallback(() => {
    if (!isAuthenticated && onRequireLogin) {
      onRequireLogin();
      return false;
    }
    return isAuthenticated;
  }, [isAuthenticated, onRequireLogin]);

  const handleTextareaFocus = () => {
    void requireAuthOr();
  };

  const handleAttachClick = () => {
    if (!requireAuthOr()) return;
    if (disabled || uploadingFile) return;
    setUploadErr("");
    fileInputRef.current?.click();
  };

  const onFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !requireAuthOr()) return;
    if (file.size > UPLOAD_MAX_BYTES) {
      setUploadErr(attachmentCopy.fileTooLarge);
      setPendingFile(null);
      return;
    }
    setUploadErr("");
    setUploadingFile(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/mainline/connectors/file-upload", {
        method: "POST",
        body: form,
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: { file_ref_id?: string };
        error?: { message?: string };
      };
      if (!res.ok) {
        setPendingFile(null);
        setUploadErr(json?.error?.message ?? attachmentCopy.uploadFailed);
        return;
      }
      const id = json.data?.file_ref_id;
      if (!id || typeof id !== "string") {
        setUploadErr(attachmentCopy.uploadFailed);
        return;
      }
      setPendingFile({ refId: id, name: file.name || "file" });
    } catch {
      setPendingFile(null);
      setUploadErr(attachmentCopy.uploadFailed);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    const el = inputRef.current;
    const cursor = el?.selectionStart ?? value.length;
    syncMentionFromCursor(value, cursor);
    if (value.trim().length > 0) {
      onTypingPulse?.();
    } else {
      onTypingCease?.();
    }
  };

  const handleSelect = () => {
    const el = inputRef.current;
    if (!el) return;
    syncMentionFromCursor(text, el.selectionStart ?? text.length);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!openMention || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      pickMention(filtered[highlightIdx]!);
    } else if (e.key === "Escape") {
      setOpenMention(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (openMention && filtered.length > 0) {
      pickMention(filtered[highlightIdx]!);
      return;
    }
    const trimmed = text.trim();
    const messageText = trimmed || (pendingFile ? attachmentCopy.defaultMessageWithFile : "");
    if (!messageText || sending || uploadingFile) return;
    if (!isAuthenticated && onRequireLogin) {
      onRequireLogin();
      return;
    }
    setSending(true);
    try {
      const ok = await onSend(messageText, pendingFile ? { fileRefId: pendingFile.refId } : undefined);
      if (ok) {
        setText("");
        setOpenMention(false);
        setPendingFile(null);
        setUploadErr("");
        onTypingCease?.();
      }
    } finally {
      setSending(false);
    }
  };

  const canSubmit =
    !disabled && !sending && !uploadingFile && (text.trim().length > 0 || !!pendingFile) && isAuthenticated;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex shrink-0 flex-col gap-2 border-t border-border bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {showAttachmentButton ? (
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={onFileInputChange}
        />
      ) : null}
      {pendingFile ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-xs">
          <span className="min-w-0 truncate text-foreground">
            <span className="text-muted-foreground">{attachmentCopy.attachedPrefix}</span> {pendingFile.name}
          </span>
          <button
            type="button"
            className="shrink-0 rounded px-2 py-0.5 font-medium text-primary hover:underline"
            aria-label={attachmentCopy.removeAria}
            onClick={() => {
              setPendingFile(null);
              setUploadErr("");
            }}
          >
            ×
          </button>
        </div>
      ) : null}
      {uploadingFile ? (
        <p className="text-xs text-muted-foreground" role="status">
          {attachmentCopy.uploading}
        </p>
      ) : null}
      {uploadErr ? (
        <p className="text-xs text-destructive" role="alert">
          {uploadErr}
        </p>
      ) : null}
      {openMention && mentionCandidates.length > 0 && (
        <ul
          id="mention-listbox"
          ref={listRef}
          role="listbox"
          className="absolute bottom-full left-14 right-16 z-20 mb-1 max-h-40 overflow-auto rounded-md border border-border bg-card py-1 text-sm shadow-elevated"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">{mentionEmptyLabel}</li>
          ) : (
            filtered.map((c, idx) => (
              <li key={`${c.kind}-${c.id}`} role="option" aria-selected={idx === highlightIdx}>
                <button
                  type="button"
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => pickMention(c)}
                  className={`flex w-full flex-col items-start px-3 py-1.5 text-left text-xs ${
                    idx === highlightIdx ? "bg-primary/15 text-foreground" : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {c.kind}:{c.id.slice(0, 8)}…
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      <div className="flex gap-2">
        {showAttachmentButton ? (
          <button
            type="button"
            aria-label={attachmentCopy.attachAria}
            disabled={disabled || uploadingFile}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
            onClick={handleAttachClick}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        ) : null}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          onFocus={handleTextareaFocus}
          onBlur={() => onTypingCease?.()}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[40px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          aria-label="Message input"
          aria-autocomplete={openMention ? "list" : undefined}
          aria-controls={openMention ? "mention-listbox" : undefined}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {sending ? "…" : sendLabel}
        </button>
      </div>
    </form>
  );
}
