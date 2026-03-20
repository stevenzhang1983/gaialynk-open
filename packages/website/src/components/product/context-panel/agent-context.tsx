"use client";

import type { Agent, AgentRiskLevel } from "@/lib/product/agent-types";

const RISK_LABEL: Record<AgentRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const RISK_CLASS: Record<AgentRiskLevel, string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-600 dark:text-red-400",
};

type AgentContextProps = {
  agent: Agent;
};

/**
 * T-4.4 Agent 视图：Agent 详情、身份验证状态、能力声明、信誉评分、历史成功率、风险等级、费用估算。
 * 与 T-4.1 Agent 详情面板内容一致，并增加费用估算占位。
 */
export function AgentContext({ agent }: AgentContextProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">ID: {agent.id}</p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Identity verification</h4>
        <p className="mt-1 text-sm text-foreground">{agent.identityVerificationStatus}</p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Capability statement</h4>
        <p className="mt-1 text-sm text-foreground">{agent.capabilityStatement}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground">Reputation score</h4>
          <p className="mt-1 text-sm font-medium text-foreground">{agent.reputationScore}</p>
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground">History success rate</h4>
          <p className="mt-1 text-sm font-medium text-foreground">{agent.historySuccessRate}%</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Risk level</h4>
        <p className={`mt-1 text-sm font-medium ${RISK_CLASS[agent.riskLevel]}`}>
          {RISK_LABEL[agent.riskLevel]}
        </p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Cost estimate</h4>
        <p className="mt-1 text-sm text-muted-foreground">—</p>
      </div>
    </div>
  );
}
