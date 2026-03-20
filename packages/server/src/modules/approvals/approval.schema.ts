import { z } from "zod";

/** Request body for confirming a high-risk invocation */
export const approvalConfirmSchema = z.object({
  approver_id: z.string().min(1),
});

/** Request body for rejecting a high-risk invocation */
export const approvalRejectSchema = z.object({
  approver_id: z.string().min(1),
  reason: z.string().max(280).optional(),
});

export type ApprovalConfirmInput = z.infer<typeof approvalConfirmSchema>;
export type ApprovalRejectInput = z.infer<typeof approvalRejectSchema>;
