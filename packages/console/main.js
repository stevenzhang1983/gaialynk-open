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
      source_url: "https://console-agent.example.com",
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
  const audit = await fetchJson("/api/v1/audit-events");
  const metrics = await fetchJson("/api/v1/metrics");
  const auditList = byId("auditList");
  const metricsOutput = byId("metricsOutput");

  auditList.innerHTML = "";
  if (Array.isArray(audit.data.data)) {
    for (const event of audit.data.data) {
      const li = document.createElement("li");
      li.textContent = `${event.event_type} (${event.actor_type}:${event.actor_id})`;
      auditList.appendChild(li);
    }
  }

  metricsOutput.textContent = JSON.stringify(metrics.data.data ?? {}, null, 2);
});
