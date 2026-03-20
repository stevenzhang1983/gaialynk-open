"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useIdentity } from "@/lib/identity/context";

export type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  /** 登录成功后调用，可用来恢复输入内容与 conversation 上下文 */
  onSuccess?: () => void;
  /** 未登录时希望登录后回到的 URL（如当前 chat 页），用于「前往登录页」链接 */
  returnUrl?: string;
  title?: string;
  loginLabel?: string;
  cancelLabel?: string;
  goToSignInLabel?: string;
};

/**
 * T-4.6 触发式登录弹窗：产品区写操作触发时弹出，邮箱+密码登录或跳转登录页（带 return_url），成功后关闭并回调 onSuccess。
 */
export function LoginModal({
  open,
  onClose,
  onSuccess,
  returnUrl,
  title = "Sign in to send messages",
  loginLabel = "Sign in",
  cancelLabel = "Cancel",
  goToSignInLabel = "Go to sign in",
}: LoginModalProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const { signInWithPassword } = useIdentity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resolvedReturnUrl =
    returnUrl ?? (typeof window !== "undefined" ? window.location.pathname : `/${locale}/app/chat`);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password) return;
      setLoading(true);
      setError("");
      try {
        const ok = await signInWithPassword(email.trim(), password);
        if (ok) {
          setEmail("");
          setPassword("");
          onClose();
          onSuccess?.();
        } else {
          setError("Invalid email or password. Try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, signInWithPassword, onClose, onSuccess],
  );

  const handleCancel = useCallback(() => {
    setError("");
    setEmail("");
    setPassword("");
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-elevated">
        <h2 id="login-modal-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with your email to continue. Your session is required for sending messages.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="email"
            aria-label="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="current-password"
            aria-label="Password"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "…" : loginLabel}
            </button>
          </div>
        </form>
        <p className="mt-3 text-sm text-muted-foreground">
          Prefer the full login page?{" "}
          <Link
            href={`/${locale}/app/login?return_url=${encodeURIComponent(resolvedReturnUrl)}`}
            className="text-primary underline"
          >
            {goToSignInLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
