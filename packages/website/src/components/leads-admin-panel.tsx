"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";

type LeadsAdminPanelProps = {
  locale: Locale;
};

type ExportRecord = {
  id: string;
  type: "waitlist" | "demo";
  locale: string;
  name: string;
  email: string;
  company: string;
  useCase: string;
  source: string;
  createdAt: string;
};

type ExportJob = {
  id: string;
  status: string;
  format: "json" | "csv";
  createdAt: string;
  updatedAt: string;
  resultCount: number;
  error: string | null;
};

type ExportJobDetail = {
  status?: string;
  format?: "json" | "csv";
  resultCount?: number;
  error?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

export function LeadsAdminPanel({ locale }: LeadsAdminPanelProps) {
  const [accessKey, setAccessKey] = useState("");
  const [type, setType] = useState<"all" | "waitlist" | "demo">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [jobPage, setJobPage] = useState(1);
  const [jobPageSize, setJobPageSize] = useState(20);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobStatusFilter, setJobStatusFilter] = useState<"all" | "queued" | "running" | "completed" | "failed">("all");
  const [jobFrom, setJobFrom] = useState("");
  const [jobTo, setJobTo] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<ExportJobDetail | null>(null);
  const [status, setStatus] = useState("Ready");

  async function loadList() {
    if (!accessKey.trim()) {
      setStatus("Please provide export key.");
      return;
    }
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("order", order);
    if (type !== "all") {
      params.set("type", type);
    }
    if (from) {
      params.set("from", from);
    }
    if (to) {
      params.set("to", to);
    }
    if (query.trim()) {
      params.set("q", query.trim());
    }

    const response = await fetch(`/api/lead/list?${params.toString()}`, {
      headers: {
        "x-leads-export-key": accessKey,
      },
    });

    if (!response.ok) {
      setStatus(`List failed (${response.status}).`);
      return;
    }

    const data = (await response.json()) as { records?: ExportRecord[]; total?: number; page?: number };
    setRecords(data.records || []);
    setTotal(data.total || 0);
    setStatus(`Loaded ${data.records?.length || 0} records (total ${data.total || 0}).`);
  }

  async function runExportJob(format: "json" | "csv") {
    if (!accessKey.trim()) {
      setStatus("Please provide export key.");
      return;
    }

    const create = await fetch("/api/lead/export-jobs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-leads-export-key": accessKey,
      },
      body: JSON.stringify({
        format,
        type: type === "all" ? undefined : type,
        from: from || undefined,
        to: to || undefined,
        q: query || undefined,
      }),
    });

    if (!create.ok) {
      setStatus(`Export job create failed (${create.status}).`);
      return;
    }

    const created = (await create.json()) as { jobId?: string };
    if (!created.jobId) {
      setStatus("Export job id missing.");
      return;
    }
    setActiveJobId(created.jobId);
    setSelectedJobId(created.jobId);
    setSelectedJobDetail({
      status: "running",
      format,
      resultCount: 0,
      error: null,
    });
    setStatus("Export job running...");
    await loadJobHistory();
  }

  async function loadJobHistory() {
    if (!accessKey.trim()) {
      return;
    }
    const params = new URLSearchParams();
    params.set("page", String(jobPage));
    params.set("pageSize", String(jobPageSize));
    if (jobStatusFilter !== "all") {
      params.set("status", jobStatusFilter);
    }
    if (jobFrom) {
      params.set("from", jobFrom);
    }
    if (jobTo) {
      params.set("to", jobTo);
    }
    const response = await fetch(`/api/lead/export-jobs?${params.toString()}`, {
      headers: {
        "x-leads-export-key": accessKey,
      },
    });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { jobs?: ExportJob[]; total?: number };
    setJobs(data.jobs || []);
    setJobTotal(data.total || 0);
  }

  async function pollJob(jobId: string) {
    const detail = await fetch(`/api/lead/export-jobs/${jobId}`, {
      headers: {
        "x-leads-export-key": accessKey,
      },
    });
    if (!detail.ok) {
      setStatus(`Export job check failed (${detail.status}).`);
      setActiveJobId(null);
      return;
    }

    const data = (await detail.json()) as {
      job?: { status?: string; format?: "json" | "csv"; resultCount?: number };
      result?: { records?: ExportRecord[] | null; csv?: string | null } | null;
    };
    const currentStatus = data.job?.status || "unknown";
    if (selectedJobId === jobId) {
      setSelectedJobDetail(data.job || null);
    }
    setStatus(`Export job status: ${currentStatus}`);
    if (currentStatus !== "completed" && currentStatus !== "failed") {
      return;
    }

    setActiveJobId(null);
    await loadJobHistory();

    if (currentStatus === "failed") {
      setStatus("Export job failed.");
      return;
    }

    if (data.job?.format === "csv" && data.result?.csv) {
      const blob = new Blob([data.result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `leads-${locale}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus(`CSV downloaded (${data.job.resultCount || 0}).`);
      return;
    }

    if (data.job?.format === "json" && data.result?.records) {
      setRecords(data.result.records);
      setStatus(`JSON export loaded (${data.job.resultCount || 0}).`);
      return;
    }
  }

  async function loadJobDetail(jobId: string) {
    if (!accessKey.trim()) {
      setStatus("Please provide export key.");
      return;
    }
    setSelectedJobId(jobId);
    const response = await fetch(`/api/lead/export-jobs/${jobId}`, {
      headers: {
        "x-leads-export-key": accessKey,
      },
    });
    if (!response.ok) {
      setSelectedJobDetail(null);
      setStatus(`Job detail failed (${response.status}).`);
      return;
    }
    const data = (await response.json()) as {
      job?: ExportJobDetail;
      result?: { records?: ExportRecord[] | null; csv?: string | null } | null;
    };
    setSelectedJobDetail(data.job || null);
    if (data.job?.format === "json" && data.result?.records) {
      setRecords(data.result.records);
    }
  }

  useEffect(() => {
    if (!accessKey.trim()) {
      return;
    }
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, order, type, from, to, query]);

  useEffect(() => {
    if (!accessKey.trim()) {
      return;
    }
    void loadJobHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessKey]);

  useEffect(() => {
    if (!accessKey.trim()) {
      return;
    }
    void loadJobHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobPage, jobPageSize, jobStatusFilter, jobFrom, jobTo]);

  useEffect(() => {
    if (!accessKey.trim() || !activeJobId) {
      return;
    }
    void pollJob(activeJobId);
    const timer = window.setInterval(() => {
      void pollJob(activeJobId);
    }, 2000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJobId, accessKey]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Leads Admin</h1>
      <p className="text-sm text-muted-foreground">Protected export and inspection view for waitlist/demo leads.</p>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>Export key</span>
            <input
              type="password"
              value={accessKey}
              onChange={(event) => setAccessKey(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as "all" | "waitlist" | "demo")}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              <option value="all">all</option>
              <option value="waitlist">waitlist</option>
              <option value="demo">demo</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>From (ISO)</span>
            <input
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              placeholder="2026-03-01T00:00:00Z"
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>To (ISO)</span>
            <input
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="2026-03-31T23:59:59Z"
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="email / company / use case"
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Order</span>
            <select
              value={order}
              onChange={(event) => setOrder(event.target.value as "asc" | "desc")}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span>Page Size</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value) || 20)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => void loadList()}>
            Load List
          </button>
          <button className="rounded-md border border-border px-4 py-2 text-sm font-semibold" onClick={() => void runExportJob("json")}>
            Export JSON Job
          </button>
          <button className="rounded-md border border-border px-4 py-2 text-sm font-semibold" onClick={() => void runExportJob("csv")}>
            Export CSV Job
          </button>
          <span className="self-center text-xs text-muted-foreground">{status}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Latest Leads</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Page {page} / {Math.max(1, Math.ceil(total / pageSize))}, total {total}
        </p>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          {records.map((record) => (
            <div key={record.id} className="grid grid-cols-[120px_160px_1fr] gap-3 rounded-md border border-border px-3 py-2">
              <span>{record.type}</span>
              <span>{record.email}</span>
              <span>{record.useCase}</span>
            </div>
          ))}
          {!records.length ? <p>No records loaded.</p> : null}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            className="rounded-md border border-border px-3 py-1 text-xs"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </button>
          <button className="rounded-md border border-border px-3 py-1 text-xs" onClick={() => setPage((prev) => prev + 1)}>
            Next
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Export Job History</h2>
          <button className="rounded-md border border-border px-3 py-1 text-xs" onClick={() => void loadJobHistory()}>
            Refresh
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-xs">
            <span>Status</span>
            <select
              value={jobStatusFilter}
              onChange={(event) =>
                setJobStatusFilter(event.target.value as "all" | "queued" | "running" | "completed" | "failed")
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              <option value="all">all</option>
              <option value="queued">queued</option>
              <option value="running">running</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
            </select>
          </label>
          <label className="space-y-2 text-xs">
            <span>Job Page Size</span>
            <input
              type="number"
              min={1}
              max={100}
              value={jobPageSize}
              onChange={(event) => setJobPageSize(Number(event.target.value) || 20)}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-xs">
            <span>Job From (ISO)</span>
            <input
              value={jobFrom}
              onChange={(event) => setJobFrom(event.target.value)}
              placeholder="2026-03-01T00:00:00Z"
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-2 text-xs">
            <span>Job To (ISO)</span>
            <input
              value={jobTo}
              onChange={(event) => setJobTo(event.target.value)}
              placeholder="2026-03-31T23:59:59Z"
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Jobs page {jobPage} / {Math.max(1, Math.ceil(jobTotal / jobPageSize))}, total {jobTotal}
        </p>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          {jobs.map((job) => (
            <button
              type="button"
              key={job.id}
              onClick={() => void loadJobDetail(job.id)}
              className={`grid w-full grid-cols-[160px_80px_80px_1fr] gap-3 rounded-md border px-3 py-2 text-left ${
                job.status === "running"
                  ? "border-amber-500/50 bg-amber-500/10"
                  : selectedJobId === job.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border"
              }`}
            >
              <span className="truncate">{job.id}</span>
              <span>{job.status}</span>
              <span>{job.format}</span>
              <span>{job.resultCount}</span>
            </button>
          ))}
          {!jobs.length ? <p>No jobs yet.</p> : null}
        </div>
        <div className="mt-3 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
          {selectedJobId && selectedJobDetail ? (
            <div className="space-y-1">
              <p>
                Selected: <span className="font-medium text-foreground">{selectedJobId}</span>
              </p>
              <p>Status: {selectedJobDetail.status || "unknown"}</p>
              <p>Format: {selectedJobDetail.format || "unknown"}</p>
              <p>Result count: {selectedJobDetail.resultCount || 0}</p>
              {selectedJobDetail.error ? <p className="text-red-400">Error: {selectedJobDetail.error}</p> : null}
            </div>
          ) : (
            <p>Click a job to view detail.</p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            className="rounded-md border border-border px-3 py-1 text-xs"
            onClick={() => setJobPage((prev) => Math.max(1, prev - 1))}
          >
            Prev Jobs
          </button>
          <button className="rounded-md border border-border px-3 py-1 text-xs" onClick={() => setJobPage((prev) => prev + 1)}>
            Next Jobs
          </button>
        </div>
      </div>
    </section>
  );
}
