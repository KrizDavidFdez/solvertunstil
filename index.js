const express = require('express');
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
