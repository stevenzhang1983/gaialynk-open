/**
 * E-13: deterministic stub payloads for Notion connector when mock/stub mode is on (CI, local without credentials).
 */

export const STUB_DATABASE_ID = "00000000-0000-4000-8000-000000000001";
export const STUB_PAGE_ID = "00000000-0000-4000-8000-000000000002";

export function stubListDatabases(): { databases: Array<{ id: string; title: string }>; raw_count: number } {
  return { databases: [{ id: STUB_DATABASE_ID, title: "Stub Database" }], raw_count: 1 };
}

export function stubQueryDatabase(): { result_count: number; has_more: boolean } {
  return { result_count: 0, has_more: false };
}

export function stubCreatePage(): { page_id: string; url: string } {
  return { page_id: STUB_PAGE_ID, url: "https://www.notion.so/stub-page" };
}

export function stubSearch(): { count: number; titles: string[] } {
  return { count: 1, titles: ["Stub Notion Page"] };
}
