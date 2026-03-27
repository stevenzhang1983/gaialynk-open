import { randomBytes, pbkdf2Sync } from "node:crypto";
import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import { emitProductEventAsync } from "../product-events/product-events.emit";

export type UserRole = "provider" | "consumer";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  /** E-1: default personal Space; set after bootstrap. */
  default_space_id?: string | null;
  /** E-11: optional display name for directory-style member lists. */
  display_name?: string | null;
}

/** E-16: keys align with HTML template filenames / Resend payloads. */
export const EMAIL_NOTIFICATION_TEMPLATE_IDS = [
  "task_completed",
  "human_review_required",
  "quota_warning",
  "agent_status_changed",
  "connector_expired",
  "space_invitation",
] as const;
export type EmailNotificationTemplateId = (typeof EMAIL_NOTIFICATION_TEMPLATE_IDS)[number];
export type UserEmailLocale = "zh" | "en" | "ja";

export interface UserNotificationPreferencesJson {
  email_enabled: boolean;
  email_types: EmailNotificationTemplateId[];
  email_locale: UserEmailLocale;
}

const EMAIL_TEMPLATE_ID_SET = new Set<string>(EMAIL_NOTIFICATION_TEMPLATE_IDS);

export const DEFAULT_USER_NOTIFICATION_PREFERENCES_JSON: UserNotificationPreferencesJson = {
  email_enabled: true,
  email_types: [...EMAIL_NOTIFICATION_TEMPLATE_IDS],
  email_locale: "en",
};

function isEmailTemplateId(s: unknown): s is EmailNotificationTemplateId {
  return typeof s === "string" && EMAIL_TEMPLATE_ID_SET.has(s);
}

/** Merge DB or API input into canonical prefs (drops unknown email_types entries). */
export function mergeUserNotificationPreferencesJson(raw: unknown): UserNotificationPreferencesJson {
  const base = { ...DEFAULT_USER_NOTIFICATION_PREFERENCES_JSON };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  if (typeof o.email_enabled === "boolean") base.email_enabled = o.email_enabled;
  if (o.email_locale === "zh" || o.email_locale === "en" || o.email_locale === "ja") {
    base.email_locale = o.email_locale;
  }
  if (Array.isArray(o.email_types)) {
    const next: EmailNotificationTemplateId[] = [];
    for (const x of o.email_types) {
      if (isEmailTemplateId(x) && !next.includes(x)) next.push(x);
    }
    if (next.length > 0) base.email_types = next;
  }
  return base;
}

/** E-11: mask email for Space member directory (first ≤2 chars of local part + *** + @domain). */
export function maskEmailForMemberList(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const normalized = email.trim();
  const at = normalized.indexOf("@");
  if (at <= 0) return "***";
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (!domain) return "***";
  const prefix = local.length <= 2 ? local : local.slice(0, 2);
  return `${prefix}***@${domain}`;
}

const PBKDF2_ITERATIONS = 100000;
const KEY_LEN = 64;
const SALT_LEN = 32;

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, "sha256").toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const derived = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, "sha256").toString("hex");
  return derived === storedHash;
}

type StoredUser = User & {
  password_hash: string;
  password_salt: string;
  notification_preferences_json?: UserNotificationPreferencesJson | null;
};
const users = new Map<string, StoredUser>();
const refreshTokensByValue = new Map<string, { userId: string; expiresAt: string }>();
/** In-memory email prefs for user ids without a full `users` row (tests / trusted actors). */
const memDetachedEmailPrefs = new Map<string, UserNotificationPreferencesJson>();

function nowIso(): string {
  return new Date().toISOString();
}

export interface CreateUserInput {
  email: string;
  password: string;
  role?: UserRole;
}

export function createUser(input: CreateUserInput): User {
  if (isPostgresEnabled()) {
    throw new Error("Use createUserAsync in PostgreSQL mode");
  }
  const id = randomUUID();
  const { salt, hash } = hashPassword(input.password);
  const now = nowIso();
  const user: User = {
    id,
    email: input.email.toLowerCase().trim(),
    role: input.role ?? "consumer",
    created_at: now,
    updated_at: now,
    display_name: null,
  };
  const stored: StoredUser = { ...user, password_salt: salt, password_hash: hash, default_space_id: null };
  users.set(id, stored);
  return { ...user, default_space_id: null };
}

export async function createUserAsync(input: CreateUserInput): Promise<User> {
  const email = input.email.toLowerCase().trim();
  if (!isPostgresEnabled()) {
    return createUser(input);
  }
  const id = randomUUID();
  const { salt, hash } = hashPassword(input.password);
  const role = input.role ?? "consumer";
  const now = nowIso();
  await query(
    `INSERT INTO users (id, email, password_salt, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, email, salt, hash, role, now, now],
  );
  void emitProductEventAsync({
    name: "user.registered",
    userId: id,
    payload: { role },
  });
  return { id, email, role, created_at: now, updated_at: now, default_space_id: null, display_name: null };
}

export async function getUserByEmailAsync(email: string): Promise<(User & { password_salt: string; password_hash: string }) | null> {
  const normalized = email.toLowerCase().trim();
  if (!isPostgresEnabled()) {
    const u = [...users.values()].find((x) => x.email === normalized);
    return u ? { id: u.id, email: u.email, role: u.role, created_at: u.created_at, updated_at: u.updated_at, password_salt: u.password_salt, password_hash: u.password_hash } : null;
  }
  const rows = await query<{
    id: string;
    email: string;
    password_salt: string;
    password_hash: string;
    role: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, email, password_salt, password_hash, role, created_at::text, updated_at::text
     FROM users WHERE email = $1`,
    [normalized],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    role: r.role as UserRole,
    created_at: r.created_at,
    updated_at: r.updated_at,
    password_salt: r.password_salt,
    password_hash: r.password_hash,
  };
}

export async function getUserByIdAsync(id: string): Promise<User | null> {
  if (!isPostgresEnabled()) {
    const u = users.get(id);
    return u
      ? {
          id: u.id,
          email: u.email,
          role: u.role,
          created_at: u.created_at,
          updated_at: u.updated_at,
          default_space_id: u.default_space_id ?? null,
          display_name: u.display_name ?? null,
        }
      : null;
  }
  const rows = await query<{
    id: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
    default_space_id: string | null;
    display_name: string | null;
  }>(
    `SELECT id, email, role, created_at::text, updated_at::text, default_space_id::text,
            display_name
     FROM users WHERE id = $1`,
    [id],
  );
  const r = rows[0];
  return r
    ? {
        id: r.id,
        email: r.email,
        role: r.role as UserRole,
        created_at: r.created_at,
        updated_at: r.updated_at,
        default_space_id: r.default_space_id,
        display_name: r.display_name ?? null,
      }
    : null;
}

export async function updateUserDefaultSpaceIdAsync(userId: string, spaceId: string | null): Promise<void> {
  const now = nowIso();
  if (!isPostgresEnabled()) {
    const u = users.get(userId);
    if (u) {
      users.set(userId, { ...u, default_space_id: spaceId, updated_at: now });
    }
    return;
  }
  await query(`UPDATE users SET default_space_id = $2, updated_at = $3 WHERE id = $1`, [userId, spaceId, now]);
}

export async function updateUserRoleAsync(userId: string, role: UserRole): Promise<User | null> {
  const now = nowIso();
  if (!isPostgresEnabled()) {
    const u = users.get(userId);
    if (!u) return null;
    const updated = { ...u, role, updated_at: now };
    users.set(userId, updated);
    return { id: updated.id, email: updated.email, role: updated.role, created_at: updated.created_at, updated_at: updated.updated_at };
  }
  const result = await query<{
    id: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
    default_space_id: string | null;
  }>(
    `UPDATE users SET role = $2, updated_at = $3 WHERE id = $1
     RETURNING id, email, role, created_at::text, updated_at::text, default_space_id::text`,
    [userId, role, now],
  );
  const r = result[0];
  return r
    ? {
        id: r.id,
        email: r.email,
        role: r.role as UserRole,
        created_at: r.created_at,
        updated_at: r.updated_at,
        default_space_id: r.default_space_id,
      }
    : null;
}

export function createRefreshToken(userId: string, ttlSeconds: number): { token: string; expiresAt: string } {
  const token = randomUUID() + randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  if (!isPostgresEnabled()) {
    refreshTokensByValue.set(token, { userId, expiresAt });
    return { token, expiresAt };
  }
  throw new Error("Use createRefreshTokenAsync in PostgreSQL mode");
}

export async function createRefreshTokenAsync(userId: string, ttlSeconds: number): Promise<{ token: string; expiresAt: string }> {
  const token = randomUUID() + randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const tokenHash = hashToken(token);
  if (!isPostgresEnabled()) {
    refreshTokensByValue.set(token, { userId, expiresAt });
    return { token, expiresAt };
  }
  const id = randomUUID();
  const now = nowIso();
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, tokenHash, expiresAt, now],
  );
  return { token, expiresAt };
}

function hashToken(token: string): string {
  return pbkdf2Sync(token, "refresh", 1, 32, "sha256").toString("hex");
}

export async function findUserIdByRefreshTokenAsync(token: string): Promise<string | null> {
  if (!isPostgresEnabled()) {
    const entry = refreshTokensByValue.get(token);
    if (!entry) return null;
    if (new Date(entry.expiresAt) <= new Date()) return null;
    return entry.userId;
  }
  const tokenHash = hashToken(token);
  const rows = await query<{ user_id: string }>(
    `SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash],
  );
  return rows[0]?.user_id ?? null;
}

export async function revokeRefreshTokenAsync(token: string): Promise<void> {
  if (!isPostgresEnabled()) {
    refreshTokensByValue.delete(token);
    return;
  }
  const tokenHash = hashToken(token);
  await query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
}

export async function getUserNotificationPreferencesJsonAsync(
  userId: string,
): Promise<UserNotificationPreferencesJson> {
  if (!isPostgresEnabled()) {
    const u = users.get(userId);
    if (u?.notification_preferences_json) {
      return mergeUserNotificationPreferencesJson(u.notification_preferences_json);
    }
    const detached = memDetachedEmailPrefs.get(userId);
    if (detached) return mergeUserNotificationPreferencesJson(detached);
    return mergeUserNotificationPreferencesJson(null);
  }
  const rows = await query<{ notification_preferences: unknown }>(
    `SELECT notification_preferences FROM users WHERE id = $1`,
    [userId],
  );
  return mergeUserNotificationPreferencesJson(rows[0]?.notification_preferences ?? null);
}

export async function patchUserNotificationPreferencesJsonAsync(
  userId: string,
  patch: Partial<Pick<UserNotificationPreferencesJson, "email_enabled" | "email_types" | "email_locale">>,
): Promise<UserNotificationPreferencesJson> {
  const current = await getUserNotificationPreferencesJsonAsync(userId);
  const next: UserNotificationPreferencesJson = {
    email_enabled: patch.email_enabled !== undefined ? patch.email_enabled : current.email_enabled,
    email_types: patch.email_types !== undefined ? patch.email_types : current.email_types,
    email_locale: patch.email_locale !== undefined ? patch.email_locale : current.email_locale,
  };
  const now = nowIso();
  if (!isPostgresEnabled()) {
    const u = users.get(userId);
    if (u) {
      users.set(userId, { ...u, notification_preferences_json: next, updated_at: now });
    } else {
      memDetachedEmailPrefs.set(userId, next);
    }
    return next;
  }
  await query(
    `UPDATE users SET notification_preferences = $2::jsonb, updated_at = $3 WHERE id = $1`,
    [userId, JSON.stringify(next), now],
  );
  return next;
}

export function resetAuthStore(): void {
  users.clear();
  refreshTokensByValue.clear();
  memDetachedEmailPrefs.clear();
}
