/*const express = require('express');
const app = express();
const PORT = 3000;


app.use(express.json());

const BASE_URL_BYPASS = 'https://shannz.zone.id';

async function callBypassAPI(endpoint, data = {}) {
    const url = `${BASE_URL_BYPASS}/api/${endpoint.trim()}`;
    try {
        const response = await fetch(url, {
            method: endpoint === 'stats' ? 'GET' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: endpoint === 'stats' ? null : JSON.stringify(data)
        });
        const json = await response.json();
        return json.success ? json.data : null;
    } catch (e) {
        console.error("Error en callBypassAPI:", e.message);
        return null;
    }
}

const shannz = {
    turnstileMin: (url, siteKey) => callBypassAPI('solve-turnstile-min', { url, siteKey })
};


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

app.listen(PORT, () => {
    console.log(`--- Servidor corriendo en http://localhost:${PORT} ---`);
    console.log(`Endpoint listo: /turnstile-solver (GET/POST/PUT)`);
});
*/

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
   UI PRINCIPAL
========================= */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Turnstile Solver API</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Inter, Arial, sans-serif;
      background: linear-gradient(135deg, #0f172a, #111827, #1e293b);
      color: #fff;
      min-height: 100vh;
      padding: 30px 16px;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
    }

    .hero {
      text-align: center;
      margin-bottom: 28px;
    }

    .badge {
      display: inline-block;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      font-size: 14px;
      border: 1px solid rgba(59, 130, 246, 0.25);
      margin-bottom: 16px;
    }

    h1 {
      margin: 0;
      font-size: 42px;
      line-height: 1.1;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .sub {
      margin-top: 14px;
      color: #cbd5e1;
      font-size: 17px;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }

    .grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 20px;
      margin-top: 30px;
    }

    .card {
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 22px;
      padding: 22px;
      box-shadow: 0 15px 50px rgba(0,0,0,0.25);
      backdrop-filter: blur(12px);
    }

    .card h2 {
      margin-top: 0;
      font-size: 22px;
      margin-bottom: 14px;
    }

    .card p {
      color: #cbd5e1;
      line-height: 1.6;
    }

    .field {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #cbd5e1;
      font-weight: 600;
    }

    input, select, textarea {
      width: 100%;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04);
      color: #fff;
      outline: none;
      font-size: 15px;
      transition: 0.2s ease;
    }

    input:focus, select:focus, textarea:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.15);
    }

    textarea {
      min-height: 160px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .btns {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 10px;
    }

    button {
      border: none;
      border-radius: 14px;
      padding: 13px 18px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: white;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.35);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      opacity: 0.96;
    }

    .btn-secondary {
      background: rgba(255,255,255,0.08);
      color: white;
      border: 1px solid rgba(255,255,255,0.08);
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.12);
    }

    .mini-grid {
      display: grid;
      gap: 14px;
    }

    .mini-box {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 18px;
      padding: 16px;
    }

    .mini-box h3 {
      margin: 0 0 8px;
      font-size: 16px;
    }

    .code {
      background: #020617;
      color: #93c5fd;
      border-radius: 16px;
      padding: 16px;
      overflow: auto;
      font-size: 14px;
      line-height: 1.5;
      border: 1px solid rgba(255,255,255,0.06);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .footer {
      margin-top: 26px;
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
    }

    .success {
      color: #4ade80;
    }

    .danger {
      color: #f87171;
    }

    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 32px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div class="badge">⚡ API Playground</div>
      <h1>Turnstile Solver API</h1>
      <div class="sub">
        Prueba tu endpoint desde una interfaz limpia, profesional y funcional.
        Soporta <b>GET</b>, <b>POST</b> y <b>PUT</b>, mostrando tanto la petición como la respuesta.
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>🚀 Probar Endpoint</h2>
        <p>Completa los campos y envía la solicitud directamente a tu API.</p>

        <div class="field">
          <label>Método HTTP</label>
          <select id="method">
            <option value="GET">GET</option>
            <option value="POST" selected>POST</option>
            <option value="PUT">PUT</option>
          </select>
        </div>

        <div class="field">
          <label>URL objetivo</label>
          <input id="url" placeholder="https://ejemplo.com" />
        </div>

        <div class="field">
          <label>Site Key</label>
          <input id="siteKey" placeholder="0x4AAAA..." />
        </div>

        <div class="btns">
          <button class="btn-primary" onclick="sendRequest()">Enviar solicitud</button>
          <button class="btn-secondary" onclick="fillDemo()">Cargar demo</button>
          <button class="btn-secondary" onclick="clearAll()">Limpiar</button>
        </div>

        <div style="margin-top: 24px;">
          <h2 style="font-size:18px;">📤 Request generado</h2>
          <div class="code" id="requestBox">Esperando solicitud...</div>
        </div>

        <div style="margin-top: 20px;">
          <h2 style="font-size:18px;">📥 Respuesta</h2>
          <div class="code" id="responseBox">Esperando respuesta...</div>
        </div>
      </div>

      <div class="mini-grid">
        <div class="card">
          <h2>📘 Endpoint</h2>
          <div class="mini-box">
            <h3>/turnstile-solver</h3>
            <p>Endpoint principal para resolver Turnstile usando el servicio externo.</p>
          </div>
          <div class="mini-box">
            <h3>Métodos soportados</h3>
            <p><span class="success">GET</span>, <span class="success">POST</span>, <span class="success">PUT</span></p>
          </div>
        </div>

        <div class="card">
          <h2>🧪 Ejemplo GET</h2>
          <div class="code">/turnstile-solver?url=https://ejemplo.com&siteKey=0x4AAAA...</div>
        </div>

        <div class="card">
          <h2>🧪 Ejemplo POST</h2>
          <div class="code">{
  "url": "https://ejemplo.com",
  "siteKey": "0x4AAAA..."
}</div>
        </div>

        <div class="card">
          <h2>📌 Respuesta esperada</h2>
          <div class="code">{
  "success": true,
  "data": {
    "token": "..."
  }
}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      Hecho para probar y documentar tu API de forma elegante.
    </div>
  </div>

  <script>
    function fillDemo() {
      document.getElementById("url").value = "https://example.com";
      document.getElementById("siteKey").value = "0x4AAAA-demo-sitekey";
      document.getElementById("method").value = "POST";
    }

    function clearAll() {
      document.getElementById("url").value = "";
      document.getElementById("siteKey").value = "";
      document.getElementById("requestBox").textContent = "Esperando solicitud...";
      document.getElementById("responseBox").textContent = "Esperando respuesta...";
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
          error: "Debes completar URL y Site Key"
        }, null, 2);
        return;
      }

      let endpoint = "/turnstile-solver";
      let fetchOptions = { method, headers: { "Content-Type": "application/json" } };

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

      responseBox.textContent = "Cargando...";

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
</html>
  `);
});

/* =========================
   API ENDPOINT
========================= */
app.all("/turnstile-solver", async (req, res) => {
  const allowedMethods = ["GET", "POST", "PUT"];

  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: "🚩 Método no permitido",
      allowed: allowedMethods,
    });
  }

  const url = req.query.url || req.body.url;
  const siteKey = req.query.siteKey || req.body.siteKey;

  if (!url || !siteKey) {
    return res.status(400).json({
      success: false,
      error: "Faltan parámetros: url y siteKey",
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
        message: "No se pudo obtener una respuesta válida del servicio externo",
      });
    }
  } catch (error) {
    console.error("Error /turnstile-solver:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor",
    });
  }
});

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
  console.log(\`🚀 Servidor corriendo en http://localhost:\${PORT}\`);
  console.log(\`🌐 Playground: http://localhost:\${PORT}/\`);
  console.log(\`📡 Endpoint: http://localhost:\${PORT}/turnstile-solver\`);
});
