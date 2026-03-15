import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface DeployTemplate {
  id: string;
  name: string;
  description: string;
  category: "assistant" | "automation";
  min_plan: "free" | "pro";
}

export interface DeploymentRecord {
  id: string;
  template_id: string;
  actor_id: string;
  agent_name: string;
  status: "provisioning" | "ready" | "failed";
  activated_agent_id?: string;
  created_at: string;
}

interface InstantiateTemplateInput {
  templateId: string;
  actorId: string;
  agentName: string;
}

const defaultTemplates: DeployTemplate[] = [
  {
    id: "starter-assistant",
    name: "Starter Assistant",
    description: "A starter template for first production assistant agent.",
    category: "assistant",
    min_plan: "free",
  },
  {
    id: "ops-automation",
    name: "Ops Automation Agent",
    description: "An operations workflow automation template.",
    category: "automation",
    min_plan: "pro",
  },
];

const deployments: DeploymentRecord[] = [];

const nowIso = (): string => new Date().toISOString();

export const listDeployTemplatesAsync = async (): Promise<DeployTemplate[]> => defaultTemplates;

export const getDeployTemplateByIdAsync = async (templateId: string): Promise<DeployTemplate | null> =>
  defaultTemplates.find((template) => template.id === templateId) ?? null;

export const instantiateTemplateAsync = async (
  input: InstantiateTemplateInput,
): Promise<DeploymentRecord> => {
  if (isPostgresEnabled()) {
    const record: DeploymentRecord = {
      id: randomUUID(),
      template_id: input.templateId,
      actor_id: input.actorId,
      agent_name: input.agentName,
      status: "provisioning",
      created_at: nowIso(),
    };
    await query(
      `INSERT INTO deployment_records (id, template_id, actor_id, agent_name, status, activated_agent_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        record.id,
        record.template_id,
        record.actor_id,
        record.agent_name,
        record.status,
        null,
        record.created_at,
      ],
    );
    return record;
  }

  const record: DeploymentRecord = {
    id: randomUUID(),
    template_id: input.templateId,
    actor_id: input.actorId,
    agent_name: input.agentName,
    status: "provisioning",
    created_at: nowIso(),
  };
  deployments.push(record);
  return record;
};

export const getDeploymentByIdAsync = async (deploymentId: string): Promise<DeploymentRecord | null> =>
  isPostgresEnabled()
    ? (
        await query<DeploymentRecord>(
          `SELECT id, template_id, actor_id, agent_name, status, activated_agent_id, created_at::text
           FROM deployment_records
           WHERE id = $1`,
          [deploymentId],
        )
      )[0] ?? null
    : deployments.find((record) => record.id === deploymentId) ?? null;

export const markDeploymentReadyAsync = async (
  deploymentId: string,
  activatedAgentId: string,
): Promise<DeploymentRecord | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<DeploymentRecord>(
      `UPDATE deployment_records
       SET status = 'ready', activated_agent_id = $2
       WHERE id = $1
       RETURNING id, template_id, actor_id, agent_name, status, activated_agent_id, created_at::text`,
      [deploymentId, activatedAgentId],
    );
    return rows[0] ?? null;
  }

  const deployment = deployments.find((record) => record.id === deploymentId);
  if (!deployment) {
    return null;
  }
  deployment.status = "ready";
  deployment.activated_agent_id = activatedAgentId;
  return deployment;
};

export const resetDeployTemplateStore = (): void => {
  if (isPostgresEnabled()) {
    return;
  }
  deployments.splice(0, deployments.length);
};
