import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render() {
  const worker = await loadWorker();

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    workerEnv(),
    executionContext(),
  );
}

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

function workerEnv(overrides = {}) {
  return { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, ...overrides };
}

function executionContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

test("server-renders the Creator Agent product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>星伴 Creator Agent｜你的 AI 经纪人与内容团队<\/title>/);
  assert.match(html, /帮助红人智能选品、连接品牌、创作爆款、生成视频并持续复盘成长/);
  assert.match(html, /合作机会/);
  assert.match(html, /爆款创作/);
  assert.match(html, /AI 视频/);
  assert.match(html, /数据复盘/);
  assert.match(html, /Momcozy 新品合作/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships product metadata and a bespoke social card", async () => {
  const [page, layout, packageJson, og] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    stat(new URL("../public/og.png", import.meta.url)),
  ]);

  assert.match(page, /VIRAL CONTENT STUDIO/);
  assert.match(page, /AI VIDEO LAB/);
  assert.match(page, /GROWTH REVIEW/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /summary_large_image/);
  assert.match(packageJson, /"name": "xingban-creator-agent"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.ok(og.size > 100_000);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("keeps navigation, product work, and secondary actions wired", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(page, /window\.history\.pushState/);
  assert.match(page, /window\.history\.back\(\)/);
  assert.match(page, /window\.history\.forward\(\)/);
  assert.match(page, /addEventListener\("popstate"/);
  assert.match(page, /applicationStates\[selectedProduct\.id\]/);
  assert.match(page, /creativeProfiles\[product\.id\]/);
  assert.match(page, /setVideoReady\(false\)/);
  assert.match(page, /type="file"/);
  assert.match(page, /URL\.createObjectURL/);
  assert.deepEqual(
    page.split("\n").filter((line) => line.includes("useEffect(() =>") && !line.includes("useEffect(() => {")),
    [],
    "effects must not accidentally return DOM method results as cleanup functions",
  );

  for (const productId of ["s12", "klean", "e12"]) {
    assert.match(page, new RegExp(`${productId}: \\{`));
  }

  for (const sheet of ["notifications", "brief", "compliance", "privacy", "videoMenu", "evidence", "profile", "publish", "contentDetail", "application"]) {
    assert.match(page, new RegExp(`case "${sheet}"|kind === "${sheet}"`));
  }

  const buttonTags = page.match(/<button\b[\s\S]*?>/g) ?? [];
  assert.ok(buttonTags.length > 30);
  assert.deepEqual(
    buttonTags.filter((tag) => !/onClick=/.test(tag)),
    [],
    "every visible button should have an interaction handler",
  );
});

test("reports an honest configuration state when the model secret is missing", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const worker = await loadWorker();
  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/agent", { headers: { accept: "application/json" } }),
      workerEnv(),
      executionContext(),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { configured: false, model: null });
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("proxies a grounded, private streaming conversation to the Responses API", async () => {
  const worker = await loadWorker();
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_MODEL;
  process.env.OPENAI_API_KEY = "test-secret";
  process.env.OPENAI_MODEL = "gpt-6-astra";
  let upstreamRequest;
  globalThis.fetch = async (input, init) => {
    if (String(input) !== "https://api.openai.com/v1/responses") return originalFetch(input, init);
    upstreamRequest = { input, init, body: JSON.parse(String(init?.body)) };
    return new Response(
      'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"建议优先申请"}\n\n' +
      'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":" S12 Pro。"}\n\n' +
      'event: response.completed\ndata: {"type":"response.completed"}\n\n',
      { status: 200, headers: { "content-type": "text/event-stream" } },
    );
  };

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "我应该先申请哪个合作？" }],
          context: { view: "opportunities", product: { id: "s12", code: "S12", name: "S12 Pro 穿戴式吸奶器" } },
        }),
      }),
      workerEnv(),
      executionContext(),
    );

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/event-stream/);
    assert.match(await response.text(), /建议优先申请.*S12 Pro/s);
    assert.equal(upstreamRequest?.init?.headers?.Authorization, "Bearer test-secret");
    assert.equal(upstreamRequest?.body?.model, "gpt-6-astra");
    assert.equal(upstreamRequest?.body?.store, false);
    assert.equal(upstreamRequest?.body?.stream, true);
    assert.equal(upstreamRequest?.body?.reasoning?.effort, "low");
    assert.match(upstreamRequest?.body?.instructions ?? "", /不得声称已经替创作者提交申请/);
    assert.match(JSON.stringify(upstreamRequest?.body?.input), /opportunityCatalog/);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = previousModel;
  }
});
