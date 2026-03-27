import {
  attachOrchestrationRunAbortController,
  executeOrchestrationRunAsync,
  maybeDetachOrchestrationAbortOnTerminalAsync,
} from "./orchestration.engine";
import { claimScheduledRunsDueAsync, resetOrchestrationStepsForRunAsync } from "./orchestration.store";

let timer: ReturnType<typeof setInterval> | undefined;

/** 每分钟轮询（可配置）领取到期的 B 类 Run 并执行。 */
export function startOrchestrationSchedulerLoop(intervalMs = 60_000): void {
  if (timer) return;
  timer = setInterval(() => {
    void runScheduledOrchestrationTickAsync();
  }, intervalMs);
}

/**
 * 单轮调度：测试与运维可显式调用；生产由 `startOrchestrationSchedulerLoop` 驱动。
 */
export async function runScheduledOrchestrationTickAsync(): Promise<void> {
  const claimed = await claimScheduledRunsDueAsync(8);
  for (const run of claimed) {
    try {
      await resetOrchestrationStepsForRunAsync(run.id);
    } catch {
      await maybeDetachOrchestrationAbortOnTerminalAsync(run.id);
      continue;
    }
    const signal = attachOrchestrationRunAbortController(run.id);
    void executeOrchestrationRunAsync({
      runId: run.id,
      startFromStep: 0,
      actorId: run.user_id,
      abortSignal: signal,
      invocationSource: "scheduled",
    })
      .catch(() => {})
      .finally(() => {
        void maybeDetachOrchestrationAbortOnTerminalAsync(run.id);
      });
  }
}
