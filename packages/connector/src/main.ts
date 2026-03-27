import { invoke } from "@tauri-apps/api/core";

type StatusPayload = {
  pairing_code: string;
  connected: boolean;
  mainline_base_url: string;
  local_api_base: string | null;
  mounted_roots: string[];
  device_id: string | null;
};

async function refresh(): Promise<StatusPayload> {
  return invoke<StatusPayload>("get_status");
}

function el(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  const n = t.content.firstElementChild;
  if (!n || !(n instanceof HTMLElement)) throw new Error("template");
  return n;
}

async function render() {
  const root = document.getElementById("app");
  if (!root) return;
  const s = await refresh().catch((e) => {
    root.textContent = String(e);
    return null;
  });
  if (!s) return;

  root.replaceChildren(
    el(`
    <main class="wrap">
      <h1>GaiaLynk 桌面 Connector</h1>
      <section class="card">
        <h2>连接状态</h2>
        <p class="muted">${s.connected ? "已连接主网" : "等待配对"}</p>
        <p><strong>配对码</strong>（6 位，请在 Web 设置中输入）</p>
        <p class="code">${s.pairing_code}</p>
        <div class="row">
          <button id="btn-refresh-code" type="button">重新生成配对码</button>
          <button id="btn-copy" type="button">复制配对码</button>
        </div>
      </section>
      <section class="card">
        <h2>主网地址</h2>
        <input id="mainline" type="text" value="${escapeAttr(s.mainline_base_url)}" />
        <button id="btn-save-url" type="button">保存</button>
      </section>
      <section class="card">
        <h2>本机 API</h2>
        <p class="muted">仅监听 127.0.0.1，需 Bearer <code>device_token</code> + 允许的 Origin。</p>
        <p><code>${s.local_api_base ?? "启动中…"}</code></p>
      </section>
      <section class="card">
        <h2>已挂载工作区（≤5）</h2>
        <ul id="roots">${s.mounted_roots.map((r) => `<li>${escapeAttr(r)}</li>`).join("")}</ul>
        <button id="btn-add-root" type="button">选择目录…</button>
      </section>
    </main>
  `),
  );

  document.getElementById("btn-refresh-code")?.addEventListener("click", async () => {
    await invoke("regenerate_pairing_code");
    await render();
  });
  document.getElementById("btn-copy")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(s.pairing_code);
  });
  document.getElementById("btn-save-url")?.addEventListener("click", async () => {
    const v = (document.getElementById("mainline") as HTMLInputElement).value.trim();
    await invoke("set_mainline_base_url", { url: v });
    await render();
  });
  document.getElementById("btn-add-root")?.addEventListener("click", async () => {
    await invoke("add_mount_directory");
    await render();
  });
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const style = document.createElement("style");
style.textContent = `
  body { font-family: system-ui, sans-serif; margin: 0; background: #0f1419; color: #e6edf3; }
  .wrap { max-width: 440px; margin: 0 auto; padding: 1.25rem; }
  h1 { font-size: 1.15rem; font-weight: 600; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
  h2 { font-size: 0.95rem; margin: 0 0 0.5rem; }
  .muted { color: #8b949e; font-size: 0.85rem; }
  .code { font-size: 1.75rem; letter-spacing: 0.2em; font-weight: 700; font-family: ui-monospace, monospace; }
  .row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
  button { background: #238636; color: #fff; border: none; padding: 0.45rem 0.75rem; border-radius: 6px; cursor: pointer; }
  button:hover { filter: brightness(1.08); }
  input[type=text] { width: 100%; box-sizing: border-box; padding: 0.45rem; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: inherit; margin-bottom: 0.5rem; }
  ul { padding-left: 1.1rem; margin: 0.5rem 0; }
  code { font-size: 0.85rem; }
`;
document.head.appendChild(style);

void render();
