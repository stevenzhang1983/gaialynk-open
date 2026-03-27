export const PRODUCT_EVENT_NAMES = [
  "user.registered",
  "user.first_conversation",
  "user.first_valuable_reply",
  "conversation.created",
  "conversation.message_sent",
  "agent.invoked",
  "agent.invoked_multi_step",
  "trust.blocked",
  "trust.confirmed",
  "trust.human_reviewed",
  "connector.authorized",
  "connector.action_executed",
  "orchestration.started",
  "orchestration.completed",
  "orchestration.failed",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

export function isProductEventName(value: string): value is ProductEventName {
  return (PRODUCT_EVENT_NAMES as readonly string[]).includes(value);
}
