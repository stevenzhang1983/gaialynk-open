import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface ConnectorUploadedFile {
  id: string;
  user_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  created_at: string;
}

const memFiles = new Map<string, ConnectorUploadedFile>();
const memBytes = new Map<string, Buffer>();

function uploadDir(): string {
  return process.env.CONNECTOR_UPLOAD_DIR?.trim() || join(process.cwd(), ".data", "connector-uploads");
}

export async function saveConnectorUploadAsync(input: {
  userId: string;
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
}): Promise<ConnectorUploadedFile> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const dir = uploadDir();
  const safeName = input.originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const relative = join(dir, `${id}-${safeName}`);

  const row: ConnectorUploadedFile = {
    id,
    user_id: input.userId,
    storage_path: relative,
    original_filename: input.originalFilename,
    mime_type: input.mimeType,
    byte_size: input.buffer.length,
    created_at: createdAt,
  };

  if (isPostgresEnabled()) {
    await mkdir(dir, { recursive: true });
    await writeFile(relative, input.buffer);
    await query(
      `INSERT INTO connector_uploaded_files
       (id, user_id, storage_path, original_filename, mime_type, byte_size, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        row.id,
        row.user_id,
        row.storage_path,
        row.original_filename,
        row.mime_type,
        row.byte_size,
        row.created_at,
      ],
    );
  } else {
    memFiles.set(id, row);
    memBytes.set(id, input.buffer);
  }
  return row;
}

export async function getConnectorUploadForUserAsync(
  id: string,
  userId: string,
): Promise<ConnectorUploadedFile | null> {
  if (isPostgresEnabled()) {
    const rows = await query<ConnectorUploadedFile>(
      `SELECT id, user_id, storage_path, original_filename, mime_type, byte_size, created_at::text
       FROM connector_uploaded_files WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return rows[0] ?? null;
  }
  const f = memFiles.get(id);
  if (!f || f.user_id !== userId) return null;
  return f;
}

export async function readConnectorUploadBytesAsync(meta: ConnectorUploadedFile): Promise<Buffer> {
  if (isPostgresEnabled()) {
    return readFile(meta.storage_path);
  }
  return memBytes.get(meta.id) ?? Buffer.alloc(0);
}

const MAX_EXCERPT = 12_000;

export async function buildUploadExcerptForAgentAsync(
  fileId: string,
  userId: string,
): Promise<{ ok: true; excerpt: string; filename: string } | { ok: false }> {
  const meta = await getConnectorUploadForUserAsync(fileId, userId);
  if (!meta) return { ok: false };
  const buf = await readConnectorUploadBytesAsync(meta);
  const text = buf.toString("utf8");
  const excerpt = text.length > MAX_EXCERPT ? `${text.slice(0, MAX_EXCERPT)}…` : text;
  return { ok: true, excerpt, filename: meta.original_filename };
}

export function resetConnectorUploadStore(): void {
  memFiles.clear();
  memBytes.clear();
}
