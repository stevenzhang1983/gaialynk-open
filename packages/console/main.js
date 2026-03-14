const byId = (id) => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element;
};

const serverUrlInput = byId("serverUrl");

const fetchJson = async (path, init = {}) => {
  const response = await fetch(`${serverUrlInput.value}${path}`, init);
  const data = await response.json();
  return { status: response.status, data };
};

byId("bootstrapBtn").addEventListener("click", async () => {
  const title = byId("conversationTitle").value;
  const agentName = byId("agentName").value;
  const risk = byId("riskLevel").value;
  const resultEl = byId("bootstrapResult");

  const conversation = await fetchJson("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (conversation.status !== 201) {
    resultEl.textContent = JSON.stringify(conversation.data, null, 2);
    return;
  }

  const conversationId = conversation.data.data.id;

  const agent = await fetchJson("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: agentName,
      description: "console-created agent",
      agent_type: "execution",
      source_url: "mock://console-agent",
      source_origin: "self_hosted",
      capabilities: [{ name: "run_task", risk_level: risk }],
    }),
  });

  if (agent.status !== 201) {
    resultEl.textContent = JSON.stringify(agent.data, null, 2);
    return;
  }

  const agentId = agent.data.data.id;

  const join = await fetchJson(`/api/v1/conversations/${conversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
  });

  byId("conversationId").value = conversationId;
  resultEl.textContent = JSON.stringify(
    { conversation_id: conversationId, agent_id: agentId, join_status: join.status },
    null,
    2,
  );
});

byId("sendBtn").addEventListener("click", async () => {
  const conversationId = byId("conversationId").value;
  const text = byId("messageText").value;
  const resultEl = byId("sendResult");

  const response = await fetchJson(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sender_id: "console-user", text }),
  });

  if (response.data.meta?.invocation_id) {
    byId("invocationId").value = response.data.meta.invocation_id;
  }

  resultEl.textContent = JSON.stringify({ status: response.status, ...response.data }, null, 2);
});

byId("confirmBtn").addEventListener("click", async () => {
  const invocationId = byId("invocationId").value;
  const resultEl = byId("confirmResult");

  const response = await fetchJson(`/api/v1/invocations/${invocationId}/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ approver_id: "console-user" }),
  });

  resultEl.textContent = JSON.stringify({ status: response.status, ...response.data }, null, 2);
});

byId("refreshBtn").addEventListener("click", async () => {
  const conversationId = byId("conversationId").value;
  const audit = await fetchJson("/api/v1/audit-events");
  const metrics = await fetchJson("/api/v1/metrics");
  const agents = await fetchJson("/api/v1/agents");
  const pendingInvocations = await fetchJson(
    `/api/v1/invocations?status=pending_confirmation${conversationId ? `&conversation_id=${conversationId}` : ""}`,
  );
  const auditList = byId("auditList");
  const agentList = byId("agentList");
  const pendingInvocationList = byId("pendingInvocationList");
  const northStarOutput = byId("northStarOutput");
  const metricsOutput = byId("metricsOutput");

  auditList.innerHTML = "";
  if (Array.isArray(audit.data.data)) {
    for (const event of audit.data.data) {
      const li = document.createElement("li");
      const risk = event.trust_decision?.risk_level ?? "-";
      const decision = event.trust_decision?.decision ?? "-";
      li.textContent = `${event.event_type} [risk:${risk} decision:${decision}] (${event.actor_type}:${event.actor_id})`;
      auditList.appendChild(li);
    }
  }

  agentList.innerHTML = "";
  if (Array.isArray(agents.data.data)) {
    for (const agent of agents.data.data) {
      const capability = Array.isArray(agent.capabilities) ? agent.capabilities[0] : null;
      const risk = capability?.risk_level ?? "-";
      const li = document.createElement("li");
      li.textContent = `${agent.name} [${agent.source_origin ?? "official"}] [risk:${risk}] (${agent.source_url})`;
      agentList.appendChild(li);
    }
  }

  pendingInvocationList.innerHTML = "";
  if (Array.isArray(pendingInvocations.data.data)) {
    for (const invocation of pendingInvocations.data.data) {
      const li = document.createElement("li");
      li.textContent = `${invocation.id} [conversation:${invocation.conversation_id}] [agent:${invocation.agent_id}]`;
      pendingInvocationList.appendChild(li);
    }
  }

  const northStar = metrics.data.data?.weekly_trusted_invocations ?? 0;
  northStarOutput.textContent = JSON.stringify(
    {
      weekly_trusted_invocations: northStar,
      high_risk_interception_ratio: metrics.data.data?.high_risk_interception_ratio ?? 0,
      key_receipt_coverage_ratio: metrics.data.data?.key_receipt_coverage_ratio ?? 0,
      audit_event_coverage_ratio: metrics.data.data?.audit_event_coverage_ratio ?? 0,
      weekly_active_conversations: metrics.data.data?.weekly_active_conversations ?? 0,
      first_session_success_rate: metrics.data.data?.first_session_success_rate ?? 0,
      connected_nodes_total: metrics.data.data?.connected_nodes_total ?? 0,
      go_no_go: metrics.data.data?.go_no_go ?? { decision: "hold", reasons: ["metrics_unavailable"] },
    },
    null,
    2,
  );

  metricsOutput.textContent = JSON.stringify(metrics.data.data ?? {}, null, 2);
});
