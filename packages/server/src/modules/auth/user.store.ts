import { randomBytes, pbkdf2Sync } from "node:crypto";
import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type UserRole = "provider" | "consumer";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
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

const users = new Map<string, User & { password_hash: string; password_salt: string }>();
const refreshTokensByValue = new Map<string, { userId: string; expiresAt: string }>();

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
  };
  users.set(id, { ...user, password_salt: salt, password_hash: hash });
  return user;
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
  return { id, email, role, created_at: now, updated_at: now };
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
    return u ? { id: u.id, email: u.email, role: u.role, created_at: u.created_at, updated_at: u.updated_at } : null;
  }
  const rows = await query<{ id: string; email: string; role: string; created_at: string; updated_at: string }>(
    `SELECT id, email, role, created_at::text, updated_at::text FROM users WHERE id = $1`,
    [id],
  );
  const r = rows[0];
  return r ? { id: r.id, email: r.email, role: r.role as UserRole, created_at: r.created_at, updated_at: r.updated_at } : null;
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
  const result = await query<{ id: string; email: string; role: string; created_at: string; updated_at: string }>(
    `UPDATE users SET role = $2, updated_at = $3 WHERE id = $1
     RETURNING id, email, role, created_at::text, updated_at::text`,
    [userId, role, now],
  );
  const r = result[0];
  return r ? { id: r.id, email: r.email, role: r.role as UserRole, created_at: r.created_at, updated_at: r.updated_at } : null;
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

export function resetAuthStore(): void {
  users.clear();
  refreshTokensByValue.clear();
}
