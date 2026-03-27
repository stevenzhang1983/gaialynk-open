import type { CapabilityStatus } from "./vision-coverage";
import type { Dictionary } from "./types";

type GovernanceDictionaryKey = keyof Pick<Dictionary, "ask" | "recovery" | "subscriptions" | "connectors" | "developers" | "trust" | "useCases">;

export type EntryPageGovernanceItem = {
  routeSegment: string;
  dictionaryKey: GovernanceDictionaryKey;
  status: CapabilityStatus;
  enforceVisionStatus: boolean;
};

export const ENTRY_PAGE_GOVERNANCE: EntryPageGovernanceItem[] = [
  { routeSegment: "ask", dictionaryKey: "ask", status: "In Progress", enforceVisionStatus: true },
  { routeSegment: "recovery-hitl", dictionaryKey: "recovery", status: "In Progress", enforceVisionStatus: true },
  { routeSegment: "subscriptions", dictionaryKey: "subscriptions", status: "Coming Soon", enforceVisionStatus: true },
  { routeSegment: "connectors-governance", dictionaryKey: "connectors", status: "In Progress", enforceVisionStatus: true },
  { routeSegment: "developers", dictionaryKey: "developers", status: "Now", enforceVisionStatus: false },
  { routeSegment: "trust", dictionaryKey: "trust", status: "Now", enforceVisionStatus: false },
  { routeSegment: "use-cases", dictionaryKey: "useCases", status: "Now", enforceVisionStatus: false },
];
