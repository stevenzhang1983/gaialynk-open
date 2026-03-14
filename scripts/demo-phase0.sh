#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "[1/13] Create conversation"
CONV_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations" \
  -H "content-type: application/json" \
  -d '{"title":"Phase0 Demo Script Conversation"}')"
CONVERSATION_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$CONV_JSON")"
echo "conversation_id=$CONVERSATION_ID"

echo "[2/13] Register low-risk agent and join conversation"
LOW_AGENT_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/agents" \
  -H "content-type: application/json" \
  -d '{"name":"Low Agent","description":"Demo low risk agent","agent_type":"execution","source_url":"mock://demo-low","capabilities":[{"name":"low_task","risk_level":"low"}]}')"
LOW_AGENT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$LOW_AGENT_JSON")"
curl -sS -X POST "$BASE_URL/api/v1/conversations/$CONVERSATION_ID/agents" \
  -H "content-type: application/json" \
  -d "{\"agent_id\":\"$LOW_AGENT_ID\"}" >/dev/null

echo "[3/13] Send low-risk message (expect allow + receipt)"
LOW_MSG_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations/$CONVERSATION_ID/messages" \
  -H "content-type: application/json" \
  -d '{"sender_id":"demo-user","text":"run low task"}')"
LOW_DECISION="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["trust_decision"]["decision"])' <<<"$LOW_MSG_JSON")"
LOW_RECEIPT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["receipt_id"])' <<<"$LOW_MSG_JSON")"
echo "low_decision=$LOW_DECISION receipt_id=$LOW_RECEIPT_ID"
[[ "$LOW_DECISION" == "allow" ]]

echo "[4/13] Create high-risk conversation + agent"
HIGH_CONV_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations" \
  -H "content-type: application/json" \
  -d '{"title":"Phase0 High Risk Conversation"}')"
HIGH_CONVERSATION_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$HIGH_CONV_JSON")"

HIGH_AGENT_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/agents" \
  -H "content-type: application/json" \
  -d '{"name":"High Agent","description":"Demo high risk agent","agent_type":"execution","source_url":"mock://demo-high","capabilities":[{"name":"high_task","risk_level":"high"}]}')"
HIGH_AGENT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$HIGH_AGENT_JSON")"
curl -sS -X POST "$BASE_URL/api/v1/conversations/$HIGH_CONVERSATION_ID/agents" \
  -H "content-type: application/json" \
  -d "{\"agent_id\":\"$HIGH_AGENT_ID\"}" >/dev/null

echo "[5/13] Send high-risk message (expect need_confirmation)"
HIGH_MSG_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations/$HIGH_CONVERSATION_ID/messages" \
  -H "content-type: application/json" \
  -d '{"sender_id":"demo-user","text":"run high task"}')"
HIGH_DECISION="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["trust_decision"]["decision"])' <<<"$HIGH_MSG_JSON")"
INVOCATION_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["invocation_id"])' <<<"$HIGH_MSG_JSON")"
echo "high_decision=$HIGH_DECISION invocation_id=$INVOCATION_ID"
[[ "$HIGH_DECISION" == "need_confirmation" ]]

echo "[6/13] Verify invocation enters pending review queue"
PENDING_BEFORE_JSON="$(curl -sS "$BASE_URL/api/v1/invocations?status=pending_confirmation&conversation_id=$HIGH_CONVERSATION_ID")"
PENDING_BEFORE_COUNT="$(python -c 'import json,sys; print(len(json.load(sys.stdin)["data"]))' <<<"$PENDING_BEFORE_JSON")"
PENDING_BEFORE_MATCH="$(python -c 'import json,sys; data=json.load(sys.stdin)["data"]; target=sys.argv[1]; print("true" if any(i.get("id")==target for i in data) else "false")' "$INVOCATION_ID" <<<"$PENDING_BEFORE_JSON")"
echo "pending_before_count=$PENDING_BEFORE_COUNT pending_contains_invocation=$PENDING_BEFORE_MATCH"
[[ "$PENDING_BEFORE_COUNT" -ge 1 ]]
[[ "$PENDING_BEFORE_MATCH" == "true" ]]

echo "[7/13] Confirm high-risk invocation"
CONFIRM_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/invocations/$INVOCATION_ID/confirm" \
  -H "content-type: application/json" \
  -d '{"approver_id":"demo-user"}')"
CONFIRM_RECEIPT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["meta"]["receipt_id"])' <<<"$CONFIRM_JSON")"
echo "confirm_receipt_id=$CONFIRM_RECEIPT_ID"

echo "[8/13] Verify invocation leaves pending review queue"
PENDING_AFTER_JSON="$(curl -sS "$BASE_URL/api/v1/invocations?status=pending_confirmation&conversation_id=$HIGH_CONVERSATION_ID")"
PENDING_AFTER_COUNT="$(python -c 'import json,sys; print(len(json.load(sys.stdin)["data"]))' <<<"$PENDING_AFTER_JSON")"
echo "pending_after_count=$PENDING_AFTER_COUNT"
[[ "$PENDING_AFTER_COUNT" == "0" ]]

echo "[9/13] Query audit and verify receipt"
AUDIT_JSON="$(curl -sS "$BASE_URL/api/v1/audit-events?conversation_id=$HIGH_CONVERSATION_ID")"
AUDIT_COUNT="$(python -c 'import json,sys; print(len(json.load(sys.stdin)["data"]))' <<<"$AUDIT_JSON")"
echo "audit_count=$AUDIT_COUNT"

RECEIPT_JSON="$(curl -sS "$BASE_URL/api/v1/receipts/$CONFIRM_RECEIPT_ID")"
RECEIPT_VALID="$(python -c 'import json,sys; print(str(json.load(sys.stdin)["meta"]["is_valid"]).lower())' <<<"$RECEIPT_JSON")"
echo "receipt_valid=$RECEIPT_VALID"
[[ "$RECEIPT_VALID" == "true" ]]

echo "[10/13] Query metrics and assert go/no-go status"
METRICS_JSON="$(curl -sS "$BASE_URL/api/v1/metrics")"
GO_NO_GO_DECISION="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["go_no_go"]["decision"])' <<<"$METRICS_JSON")"
HIGH_RISK_INTERCEPTION_RATIO="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["high_risk_interception_ratio"])' <<<"$METRICS_JSON")"
KEY_RECEIPT_COVERAGE_RATIO="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["key_receipt_coverage_ratio"])' <<<"$METRICS_JSON")"
AUDIT_EVENT_COVERAGE_RATIO="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["audit_event_coverage_ratio"])' <<<"$METRICS_JSON")"
echo "go_no_go=$GO_NO_GO_DECISION high_risk_interception_ratio=$HIGH_RISK_INTERCEPTION_RATIO key_receipt_coverage_ratio=$KEY_RECEIPT_COVERAGE_RATIO audit_event_coverage_ratio=$AUDIT_EVENT_COVERAGE_RATIO"
[[ "$GO_NO_GO_DECISION" == "go" ]]

echo "[11/13] Register node and sync partner agent directory"
NODE_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/nodes/register" \
  -H "content-type: application/json" \
  -d '{"name":"Demo Partner Node","endpoint":"https://demo-partner-node.example.com"}')"
NODE_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["node_id"])' <<<"$NODE_JSON")"
echo "node_id=$NODE_ID"

SYNC_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/nodes/sync-directory" \
  -H "content-type: application/json" \
  -d "{\"node_id\":\"$NODE_ID\",\"agents\":[{\"name\":\"Partner Demo Agent\",\"description\":\"Node synced demo agent\",\"agent_type\":\"execution\",\"source_url\":\"mock://partner-demo-agent\",\"capabilities\":[{\"name\":\"partner_task\",\"risk_level\":\"low\"}]}]}")"
SYNC_COUNT="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["synced_count"])' <<<"$SYNC_JSON")"
PARTNER_AGENT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["agents"][0]["id"])' <<<"$SYNC_JSON")"
PARTNER_SOURCE_ORIGIN="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["agents"][0]["source_origin"])' <<<"$SYNC_JSON")"
echo "synced_count=$SYNC_COUNT partner_agent_id=$PARTNER_AGENT_ID source_origin=$PARTNER_SOURCE_ORIGIN"
[[ "$SYNC_COUNT" == "1" ]]
[[ "$PARTNER_SOURCE_ORIGIN" == "connected_node" ]]

echo "[12/13] Create local agent and run multi-agent collaboration"
LOCAL_AGENT_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/agents" \
  -H "content-type: application/json" \
  -d '{"name":"Local Demo Agent","description":"Self hosted demo agent","agent_type":"execution","source_url":"mock://local-demo-agent","source_origin":"self_hosted","capabilities":[{"name":"local_task","risk_level":"low"}]}')"
LOCAL_AGENT_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$LOCAL_AGENT_JSON")"
echo "local_agent_id=$LOCAL_AGENT_ID"

NETWORK_CONV_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations" \
  -H "content-type: application/json" \
  -d '{"title":"Node and Local Collaboration Conversation"}')"
NETWORK_CONVERSATION_ID="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["id"])' <<<"$NETWORK_CONV_JSON")"
echo "network_conversation_id=$NETWORK_CONVERSATION_ID"

curl -sS -X POST "$BASE_URL/api/v1/conversations/$NETWORK_CONVERSATION_ID/agents" \
  -H "content-type: application/json" \
  -d "{\"agent_id\":\"$PARTNER_AGENT_ID\"}" >/dev/null
curl -sS -X POST "$BASE_URL/api/v1/conversations/$NETWORK_CONVERSATION_ID/agents" \
  -H "content-type: application/json" \
  -d "{\"agent_id\":\"$LOCAL_AGENT_ID\"}" >/dev/null

NETWORK_INVOKE_JSON="$(curl -sS -X POST "$BASE_URL/api/v1/conversations/$NETWORK_CONVERSATION_ID/messages" \
  -H "content-type: application/json" \
  -d "{\"sender_id\":\"demo-user\",\"text\":\"execute partner and local tasks\",\"target_agent_ids\":[\"$PARTNER_AGENT_ID\",\"$LOCAL_AGENT_ID\"]}")"
NETWORK_STATUS="$(python -c 'import json,sys; print("ok" if "data" in json.load(sys.stdin) else "bad")' <<<"$NETWORK_INVOKE_JSON")"
NETWORK_RECEIPT_COUNT="$(python -c 'import json,sys; print(len(json.load(sys.stdin)["meta"]["completed_receipts"]))' <<<"$NETWORK_INVOKE_JSON")"
echo "network_status=$NETWORK_STATUS network_receipt_count=$NETWORK_RECEIPT_COUNT"
[[ "$NETWORK_STATUS" == "ok" ]]
[[ "$NETWORK_RECEIPT_COUNT" == "2" ]]

echo "[13/13] Verify collaboration audit coverage and connected nodes metric"
NETWORK_AUDIT_JSON="$(curl -sS "$BASE_URL/api/v1/audit-events?conversation_id=$NETWORK_CONVERSATION_ID")"
NETWORK_COMPLETED_COUNT="$(python -c 'import json,sys; data=json.load(sys.stdin)["data"]; print(sum(1 for e in data if e.get("event_type")=="invocation.completed"))' <<<"$NETWORK_AUDIT_JSON")"
echo "network_invocation_completed_count=$NETWORK_COMPLETED_COUNT"
[[ "$NETWORK_COMPLETED_COUNT" == "2" ]]

FINAL_METRICS_JSON="$(curl -sS "$BASE_URL/api/v1/metrics")"
CONNECTED_NODES_TOTAL="$(python -c 'import json,sys; print(json.load(sys.stdin)["data"]["connected_nodes_total"])' <<<"$FINAL_METRICS_JSON")"
echo "connected_nodes_total=$CONNECTED_NODES_TOTAL"
[[ "$CONNECTED_NODES_TOTAL" -ge 1 ]]

echo "Phase0 demo script passed."
