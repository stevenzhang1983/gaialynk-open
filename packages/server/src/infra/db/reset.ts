import { closePool, getPool } from "./client";

const resetDatabase = async (): Promise<void> => {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is required to reset database");
  }

  await pool.query(`
    TRUNCATE TABLE
      refresh_tokens,
      oauth_accounts,
      users,
      ask_runs,
      ask_sessions,
      template_listing_applications,
      local_action_receipts,
      connector_authorizations,
      disputes,
      user_task_runs,
      offline_run_queues,
      user_task_instances,
      template_quality_evaluations,
      public_agent_templates,
      publishers,
      agent_run_feedback,
      notification_events,
      notification_preferences,
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
  await pool.query(`
    INSERT INTO publishers (id, identity_tier, created_at)
    VALUES ('00000000-0000-0000-0000-000000000001', 'anonymous', NOW())
    ON CONFLICT (id) DO NOTHING;
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
