/** E-18 / W-21：与主线 `conversation.store` 占位正文一致，用于识别已隐藏消息。 */
export const MODERATION_HIDDEN_PLACEHOLDER = "[该消息已被管理员隐藏]";

export function isModerationHiddenMessageText(text: string): boolean {
  return text.trim() === MODERATION_HIDDEN_PLACEHOLDER;
}
