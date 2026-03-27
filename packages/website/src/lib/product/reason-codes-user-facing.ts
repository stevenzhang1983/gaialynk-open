/**
 * Re-exports shared trust reason_code → user-facing copy (E-15).
 * Prefer importing `@gaialynk/shared` directly in new code.
 */
export {
  buildUserFacingMessageFromReasonCodes,
  REASON_CODE_USER_FACING,
  type UserFacingLocaleBundle,
} from "@gaialynk/shared";
