import { closePool, getPool } from "./client";

const resetDatabase = async (): Promise<void> => {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is required to reset database");
  }

  await pool.query(`
    TRUNCATE TABLE
      receipts,
      audit_events,
      invocations,
      messages,
      participants,
      nodes,
      deployment_records,
      agents,
      conversations
    RESTART IDENTITY CASCADE;
  `);

  console.log("database reset completed");
};

resetDatabase()
  .then(async () => {
    await closePool();
  })
  .catch(async (error: unknown) => {
    console.error("database reset failed", error);
    await closePool();
    process.exitCode = 1;
  });
