import { randomUUID } from "node:crypto";

export type DesktopExecuteJob = {
  userId: string;
  deviceId: string;
  action: "file_list" | "file_read" | "file_write";
  path: string;
  status: "pending" | "completed" | "failed";
  result?: unknown;
  error?: string;
  createdAt: number;
};

const jobs = new Map<string, DesktopExecuteJob>();

const writeChallenges = new Map<
  string,
  { userId: string; deviceId: string; path: string; until: number }
>();

const confirmedWrites = new Map<
  string,
  { userId: string; deviceId: string; path: string; until: number }
>();

export function createDesktopExecuteJob(input: {
  userId: string;
  deviceId: string;
  action: "file_list" | "file_read" | "file_write";
  path: string;
}): string {
  const id = randomUUID();
  jobs.set(id, {
    ...input,
    status: "pending",
    createdAt: Date.now(),
  });
  return id;
}

export function getDesktopExecuteJob(requestId: string): DesktopExecuteJob | undefined {
  return jobs.get(requestId);
}

export function settleDesktopExecuteJob(
  requestId: string,
  ok: boolean,
  result?: unknown,
  error?: string,
): boolean {
  const j = jobs.get(requestId);
  if (!j || j.status !== "pending") {
    return false;
  }
  j.status = ok ? "completed" : "failed";
  if (ok) {
    j.result = result;
  } else {
    j.error = error ?? "error";
  }
  return true;
}

export function createWriteChallenge(userId: string, deviceId: string, path: string): string {
  const id = randomUUID();
  writeChallenges.set(id, { userId, deviceId, path, until: Date.now() + 5 * 60_000 });
  return id;
}

export function confirmWriteChallenge(challengeId: string, userId: string): string | null {
  const c = writeChallenges.get(challengeId);
  if (!c || c.userId !== userId || c.until < Date.now()) {
    writeChallenges.delete(challengeId);
    return null;
  }
  writeChallenges.delete(challengeId);
  const token = randomUUID();
  confirmedWrites.set(token, {
    userId,
    deviceId: c.deviceId,
    path: c.path,
    until: Date.now() + 120_000,
  });
  return token;
}

export function consumeWriteConfirmationToken(
  token: string,
  userId: string,
  deviceId: string,
  path: string,
): boolean {
  const c = confirmedWrites.get(token);
  if (
    !c ||
    c.userId !== userId ||
    c.until < Date.now() ||
    c.deviceId !== deviceId ||
    c.path !== path
  ) {
    return false;
  }
  confirmedWrites.delete(token);
  return true;
}

export function resetDesktopExecuteRuntime(): void {
  jobs.clear();
  writeChallenges.clear();
  confirmedWrites.clear();
}
