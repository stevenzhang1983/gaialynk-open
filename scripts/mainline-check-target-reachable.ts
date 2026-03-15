const targetBaseUrl = process.env.MAINLINE_BASE_URL?.trim();

const print = (message: string): void => {
  console.log(`[target-check] ${message}`);
};

async function run(): Promise<void> {
  if (!targetBaseUrl) {
    print("skip: MAINLINE_BASE_URL is not set");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${targetBaseUrl}/api/v1/meta`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`target reachable check failed with HTTP ${response.status}`);
    }

    const body = (await response.json().catch(() => ({}))) as { data?: { api_version?: string } };
    if (!body.data?.api_version) {
      throw new Error("target reachable check failed: missing api_version");
    }
    print(`ok: ${targetBaseUrl} (api_version=${body.data.api_version})`);
  } finally {
    clearTimeout(timeout);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
