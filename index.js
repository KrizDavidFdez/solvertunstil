const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BASE_URL_BYPASS = "https://shannz.zone.id";

async function callBypassAPI(endpoint, data = {}) {
  const url = `${BASE_URL_BYPASS}/api/${endpoint.trim()}`;

  try {
    const response = await fetch(url, {
      method: endpoint === "stats" ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: endpoint === "stats" ? null : JSON.stringify(data),
    });

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      return json.success ? json.data : json;
    } catch {
      return {
        success: false,
        raw: text,
      };
    }
  } catch (e) {
    console.error("Error en callBypassAPI:", e.message);
    return {
      success: false,
      error: e.message,
    };
  }
}

const shannz = {
  turnstileMin: (url, siteKey) =>
    callBypassAPI("solve-turnstile-min", { url, siteKey }),
};

/* =========================
   UI PRINCIPAL PROFESIONAL
========================= */
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Turnstile Solver API</title>
  <meta name="description" content="Professional API Playground for Turnstile Solver" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050505;
      --bg-soft: rgba(255, 255, 255, 0.035);
      --bg-soft-2: rgba(255, 255, 255, 0.055);
      --stroke: rgba(255, 255, 255, 0.09);
      --stroke-2: rgba(255, 255, 255, 0.14);
      --text: #ffffff;
      --muted: rgba(255, 255, 255, 0.68);
      --muted-2: rgba(255, 255, 255, 0.45);
      --accent: #ffffff;
      --shadow: 0 20px 80px rgba(0, 0, 0, 0.45);
      --radius: 24px;
      --radius-sm: 18px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      font-family: "Inter", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 28%),
        radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 25%),
        radial-gradient(circle at bottom, rgba(255,255,255,0.02), transparent 30%),
        linear-gradient(180deg, #030303 0%, #080808 45%, #050505 100%);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }

    .noise {
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.04;
      background-image:
        radial-gradient(circle at 20% 20%, white 0.6px, transparent 0.8px),
        radial-gradient(circle at 80% 40%, white 0.6px, transparent 0.8px),
        radial-gradient(circle at 60% 80%, white 0.6px, transparent 0.8px);
      background-size: 180px 180px;
      z-index: 0;
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 1320px;
      margin: 0 auto;
      padding: 42px 18px 60px;
    }

    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 28px;
      padding: 18px 22px;
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(16px);
      border-radius: 22px;
      box-shadow: var(--shadow);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background:
        linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04));
      border: 1px solid rgba(255,255,255,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: white;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }

    .brand h1 {
      margin: 0;
      font-size: 17px;
      letter-spacing: -0.03em;
      font-weight: 700;
    }

    .brand p {
      margin: 2px 0 0;
      color: var(--muted-2);
      font-size: 13px;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font-size: 13px;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: #ffffff;
      box-shadow: 0 0 14px rgba(255,255,255,0.7);
    }

    .hero {
      margin-bottom: 26px;
      padding: 34px 30px;
      border-radius: 30px;
      border: 1px solid var(--stroke);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
      backdrop-filter: blur(18px);
      box-shadow: var(--shadow);
    }

    .hero-label {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      color: var(--muted);
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 18px;
    }

    .hero h2 {
      margin: 0;
      font-size: clamp(34px, 6vw, 62px);
      line-height: 0.98;
      letter-spacing: -0.05em;
      font-weight: 800;
      max-width: 880px;
    }

    .hero p {
      margin-top: 18px;
      font-size: 16px;
      line-height: 1.8;
      color: var(--muted);
      max-width: 820px;
    }

    .hero-actions {
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .button {
      appearance: none;
      border: none;
      outline: none;
      cursor: pointer;
      padding: 14px 18px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 700;
      transition: transform .18s ease, opacity .18s ease, background .18s ease, border-color .18s ease;
    }

    .button:hover {
      transform: translateY(-1px);
    }

    .button-primary {
      background: #ffffff;
      color: #000000;
      box-shadow: 0 10px 40px rgba(255,255,255,0.08);
    }

    .button-secondary {
      background: rgba(255,255,255,0.045);
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.09);
    }

    .layout {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 22px;
      align-items: start;
    }

    .panel {
      border-radius: var(--radius);
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(16px);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .panel-header {
      padding: 24px 24px 0;
    }

    .panel-title {
      margin: 0;
      font-size: 22px;
      letter-spacing: -0.03em;
      font-weight: 750;
    }

    .panel-subtitle {
      margin-top: 8px;
      color: var(--muted);
      line-height: 1.7;
      font-size: 14px;
    }

    .panel-body {
      padding: 24px;
    }

    .form-grid {
      display: grid;
      gap: 16px;
    }

    .field {
      display: grid;
      gap: 10px;
    }

    .field label {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.85);
      letter-spacing: 0.01em;
    }

    input, select, textarea {
      width: 100%;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      color: #ffffff;
      border-radius: 16px;
      padding: 15px 16px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
    }

    input::placeholder,
    textarea::placeholder {
      color: rgba(255,255,255,0.35);
    }

    input:focus,
    select:focus,
    textarea:focus {
      border-color: rgba(255,255,255,0.22);
      background: rgba(255,255,255,0.055);
      box-shadow: 0 0 0 4px rgba(255,255,255,0.035);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }

    .code-wrap {
      margin-top: 18px;
      display: grid;
      gap: 18px;
    }

    .code-card {
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.28);
      border-radius: 20px;
      overflow: hidden;
    }

    .code-top {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255,255,255,0.02);
    }

    .code-top strong {
      font-size: 13px;
      letter-spacing: 0.02em;
      color: rgba(255,255,255,0.88);
    }

    .copy-btn {
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      color: white;
      border-radius: 12px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    pre {
      margin: 0;
      padding: 18px;
      overflow: auto;
      color: rgba(255,255,255,0.92);
      font-family: var(--mono);
      font-size: 13px;
      line-height: 1.75;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .stack {
      display: grid;
      gap: 22px;
    }

    .mini-card {
      padding: 22px;
      border-radius: 24px;
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(16px);
      box-shadow: var(--shadow);
    }

    .mini-card h3 {
      margin: 0 0 14px;
      font-size: 18px;
      letter-spacing: -0.03em;
    }

    .mini-card p {
      margin: 0;
      color: var(--muted);
      line-height: 1.8;
      font-size: 14px;
    }

    .api-list {
      display: grid;
      gap: 12px;
      margin-top: 14px;
    }

    .api-item {
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      border-radius: 18px;
      padding: 14px 15px;
    }

    .method {
      display: inline-flex;
      min-width: 58px;
      justify-content: center;
      padding: 7px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      margin-right: 10px;
    }

    .path {
      font-family: var(--mono);
      font-size: 13px;
      color: rgba(255,255,255,0.95);
    }

    .footer {
      margin-top: 28px;
      padding: 18px 20px;
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,0.03);
      border-radius: 20px;
      color: var(--muted-2);
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .muted {
      color: var(--muted-2);
    }

    .response-success {
      color: #ffffff;
    }

    .response-error {
      color: #ffb4b4;
    }

    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 680px) {
      .container {
        padding: 18px 14px 40px;
      }

      .topbar {
        flex-direction: column;
        align-items: flex-start;
      }

      .hero {
        padding: 24px 20px;
      }

      .panel-body,
      .panel-header,
      .mini-card {
        padding-left: 18px;
        padding-right: 18px;
      }

      .hero h2 {
        font-size: 34px;
      }
    }
  </style>
</head>
<body>
  <div class="noise"></div>

  <div class="container">
    <div class="topbar">
      <div class="brand">
        <div class="brand-mark">TS</div>
        <div>
          <h1>Turnstile Solver API</h1>
          <p>Production-style interface for testing and documentation</p>
        </div>
      </div>
      <div class="status">
        <span class="status-dot"></span>
        Service Available
      </div>
    </div>

    <section class="hero">
      <div class="hero-label">API Playground</div>
      <h2>Elegant interface for testing your Turnstile endpoint.</h2>
      <p>
        Send requests directly from the browser using GET, POST or PUT.
        Inspect payloads, preview responses and document the endpoint with a clean, professional dark interface.
      </p>
      <div class="hero-actions">
        <button class="button button-primary" onclick="scrollToPlayground()">Open Playground</button>
        <button class="button button-secondary" onclick="fillDemo()">Load Example</button>
      </div>
    </section>

    <div class="layout">
      <section class="panel" id="playground">
        <div class="panel-header">
          <h3 class="panel-title">Request Playground</h3>
          <div class="panel-subtitle">
            Test the endpoint in real time and inspect the exact request and response.
          </div>
        </div>

        <div class="panel-body">
          <div class="form-grid">
            <div class="field">
              <label>HTTP Method</label>
              <select id="method">
                <option value="GET">GET</option>
                <option value="POST" selected>POST</option>
                <option value="PUT">PUT</option>
              </select>
            </div>

            <div class="field">
              <label>Target URL</label>
              <input id="url" placeholder="https://example.com" />
            </div>

            <div class="field">
              <label>Site Key</label>
              <input id="siteKey" placeholder="0x4AAAA..." />
            </div>

            <div class="actions">
              <button class="button button-primary" onclick="sendRequest()">Send Request</button>
              <button class="button button-secondary" onclick="fillDemo()">Load Demo</button>
              <button class="button button-secondary" onclick="clearAll()">Clear</button>
            </div>
          </div>

          <div class="code-wrap">
            <div class="code-card">
              <div class="code-top">
                <strong>Generated Request</strong>
                <button class="copy-btn" onclick="copyText('requestBox')">Copy</button>
              </div>
              <pre id="requestBox">Waiting for request...</pre>
            </div>

            <div class="code-card">
              <div class="code-top">
                <strong>Response</strong>
                <button class="copy-btn" onclick="copyText('responseBox')">Copy</button>
              </div>
              <pre id="responseBox">Waiting for response...</pre>
            </div>
          </div>
        </div>
      </section>

      <aside class="stack">
        <div class="mini-card">
          <h3>Available Endpoint</h3>
          <p>Primary endpoint for resolving Cloudflare Turnstile through the external service.</p>

          <div class="api-list">
            <div class="api-item">
              <span class="method">GET</span>
              <span class="path">/turnstile-solver</span>
            </div>
            <div class="api-item">
              <span class="method">POST</span>
              <span class="path">/turnstile-solver</span>
            </div>
            <div class="api-item">
              <span class="method">PUT</span>
              <span class="path">/turnstile-solver</span>
            </div>
          </div>
        </div>

        <div class="mini-card">
          <h3>GET Example</h3>
          <div class="code-card" style="margin-top:14px;">
            <pre>/turnstile-solver?url=https://example.com&siteKey=0x4AAAA...</pre>
          </div>
        </div>

        <div class="mini-card">
          <h3>POST Example</h3>
          <div class="code-card" style="margin-top:14px;">
            <pre>{
  "url": "https://example.com",
  "siteKey": "0x4AAAA..."
}</pre>
          </div>
        </div>

        <div class="mini-card">
          <h3>Expected Response</h3>
          <div class="code-card" style="margin-top:14px;">
            <pre>{
  "success": true,
  "method": "POST",
  "endpoint": "/turnstile-solver",
  "request": {
    "url": "https://example.com",
    "siteKey": "0x4AAAA..."
  },
  "data": {
    "token": "..."
  }
}</pre>
          </div>
        </div>
      </aside>
    </div>

    <div class="footer">
      <div>Turnstile Solver API Interface</div>
      <div class="muted">Dark Professional Playground</div>
    </div>
  </div>

  <script>
    function scrollToPlayground() {
      document.getElementById("playground").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function fillDemo() {
      document.getElementById("url").value = "https://example.com";
      document.getElementById("siteKey").value = "0x4AAAA-demo-sitekey";
      document.getElementById("method").value = "POST";

      document.getElementById("requestBox").textContent = JSON.stringify({
        method: "POST",
        endpoint: "/turnstile-solver",
        body: {
          url: "https://example.com",
          siteKey: "0x4AAAA-demo-sitekey"
        }
      }, null, 2);

      document.getElementById("responseBox").textContent = "Ready to send request...";
    }

    function clearAll() {
      document.getElementById("url").value = "";
      document.getElementById("siteKey").value = "";
      document.getElementById("requestBox").textContent = "Waiting for request...";
      document.getElementById("responseBox").textContent = "Waiting for response...";
    }

    function copyText(id) {
      const el = document.getElementById(id);
      navigator.clipboard.writeText(el.textContent || "");
    }

    async function sendRequest() {
      const method = document.getElementById("method").value;
      const url = document.getElementById("url").value.trim();
      const siteKey = document.getElementById("siteKey").value.trim();

      const requestBox = document.getElementById("requestBox");
      const responseBox = document.getElementById("responseBox");

      if (!url || !siteKey) {
        responseBox.textContent = JSON.stringify({
          success: false,
          error: "Both 'url' and 'siteKey' are required."
        }, null, 2);
        return;
      }

      let endpoint = "/turnstile-solver";
      let fetchOptions = {
        method,
        headers: { "Content-Type": "application/json" }
      };

      if (method === "GET") {
        endpoint += \`?url=\${encodeURIComponent(url)}&siteKey=\${encodeURIComponent(siteKey)}\`;
      } else {
        fetchOptions.body = JSON.stringify({ url, siteKey });
      }

      requestBox.textContent = JSON.stringify({
        method,
        endpoint,
        ...(fetchOptions.body ? { body: JSON.parse(fetchOptions.body) } : {})
      }, null, 2);

      responseBox.textContent = "Sending request...";

      try {
        const res = await fetch(endpoint, fetchOptions);
        const text = await res.text();

        try {
          const json = JSON.parse(text);
          responseBox.textContent = JSON.stringify(json, null, 2);
        } catch {
          responseBox.textContent = text;
        }
      } catch (err) {
        responseBox.textContent = JSON.stringify({
          success: false,
          error: err.message
        }, null, 2);
      }
    }
  </script>
</body>
</html>`);
});

/* =========================
   API ENDPOINT
========================= */

app.all('/turnstile-solver', async (req, res) => {
    const allowedMethods = ['GET', 'POST', 'PUT'];
    if (!allowedMethods.includes(req.method)) {
        return res.status(405).json({ error: '🚩 Método no permitido' });
    }
    const url = req.query.url || req.body.url;
    const siteKey = req.query.siteKey || req.body.siteKey;

    try {
        const result = await shannz.turnstileMin(url, siteKey);
        
        if (result) {
            return res.json({ success: true, data: result });
        } else {
            return res.status(500).json({ success: false, message: '' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});
/*app.all("/turnstile-solver", async (req, res) => {
  const allowedMethods = ["GET", "POST", "PUT"];

  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      allowed: allowedMethods,
    });
  }

  const url = req.query.url || req.body.url;
  const siteKey = req.query.siteKey || req.body.siteKey;

  if (!url || !siteKey) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: url and siteKey",
      example: {
        GET: "/turnstile-solver?url=https://example.com&siteKey=0x4AAAA...",
        POST: {
          url: "https://example.com",
          siteKey: "0x4AAAA...",
        },
      },
    });
  }

  try {
    const result = await shannz.turnstileMin(url, siteKey);

    if (result) {
      return res.json({
        success: true,
        method: req.method,
        endpoint: "/turnstile-solver",
        request: { url, siteKey },
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Could not retrieve a valid response from the external service",
      });
    }
  } catch (error) {
    console.error("Error /turnstile-solver:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});
*/
/* =========================
   INFO GENERAL API
========================= */
app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "Turnstile Solver API",
    version: "1.0.0",
    endpoints: {
      playground: "/",
      solver: "/turnstile-solver",
    },
    methods: ["GET", "POST", "PUT"],
    examples: {
      get: "/turnstile-solver?url=https://example.com&siteKey=0x4AAAA...",
      post: {
        url: "https://example.com",
        siteKey: "0x4AAAA...",
      },
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost: ${PORT}`);
  console.log(`Playground: http://localhost:${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/turnstile-solver`);
});
