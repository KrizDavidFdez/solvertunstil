const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const http = require("http");
const https = require("https");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Agentes optimizados para Koyeb: keep-alive pero limitado para no matar el server
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 20, maxFreeSockets: 5, timeout: 25000, freeSocketTimeout: 25000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20, maxFreeSockets: 5, timeout: 25000, freeSocketTimeout: 25000 });

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
      return { success: false, raw: text };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}

const shannz = {
  turnstileMin: (url, siteKey) => callBypassAPI("solve-turnstile-min", { url, siteKey }),
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

class HentaiLaDownloader {
  constructor(options = {}) {
    this.BASE = "https://cdn.hvidserv.com";
    // 12 workers = máxima velocidad sin matar la memoria de Koyeb
    this.concurrency = options.concurrency || 12;
    this.timeout = options.timeout || 25000;

    this.HEADERS = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
      Accept: "*/*",
      "Accept-Language": "es-419,es;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Origin: this.BASE,
      Referer: `${this.BASE}/`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      Connection: "keep-alive",
      ...(options.headers || {}),
    };
  }

  formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  }

  formatTitle(slug = "") {
    return String(slug)
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  extractId(input) {
    const m = String(input).match(/([a-f0-9]{32})/i);
    return m ? m[1] : null;
  }

  sanitizeFileName(name = "video") {
    return name.replace(/[\/:*?"<>|]/g, "").replace(/\s+/g, "_").trim();
  }

  async fetchBuf(url, headers = this.HEADERS) {
    const res = await fetch(url, { 
      headers,
      agent: url.startsWith('https:') ? httpsAgent : httpAgent
    });
    return Buffer.from(await res.arrayBuffer());
  }

  read32(buf, off) {
    return buf.readUInt32BE(off);
  }

  write32(buf, off, val) {
    buf.writeUInt32BE(val >>> 0, off);
  }

  write64(buf, off, hi, lo) {
    buf.writeUInt32BE(hi >>> 0, off);
    buf.writeUInt32BE(lo >>> 0, off + 4);
  }

  findBox(buf, type, start = 0, end = buf.length) {
    let i = start;
    while (i + 8 <= end) {
      const size = this.read32(buf, i);
      const name = buf.slice(i + 4, i + 8).toString("ascii");
      if (name === type) return { offset: i, size };
      i += Math.max(size, 8);
    }
    return null;
  }

  patchDuration(initBuf, totalSeconds) {
    const buf = Buffer.from(initBuf);
    const moov = this.findBox(buf, "moov");
    if (!moov) return buf;
    const moovEnd = moov.offset + moov.size;
    const mvhd = this.findBox(buf, "mvhd", moov.offset + 8, moovEnd);

    if (mvhd) {
      const version = buf[mvhd.offset + 8];
      let timescale, durationOff;
      if (version === 1) {
        timescale = this.read32(buf, mvhd.offset + 28);
        durationOff = mvhd.offset + 32;
        const durationUnits = Math.round(totalSeconds * timescale);
        this.write64(buf, durationOff, Math.floor(durationUnits / 0x100000000), durationUnits >>> 0);
      } else {
        timescale = this.read32(buf, mvhd.offset + 20);
        durationOff = mvhd.offset + 24;
        const durationUnits = Math.round(totalSeconds * timescale);
        this.write32(buf, durationOff, durationUnits);
      }
    }

    let search = moov.offset + 8;
    while (search < moovEnd) {
      const trak = this.findBox(buf, "trak", search, moovEnd);
      if (!trak) break;
      const trakEnd = trak.offset + trak.size;
      const tkhd = this.findBox(buf, "tkhd", trak.offset + 8, trakEnd);
      if (tkhd) {
        const version = buf[tkhd.offset + 8];
        const mdia = this.findBox(buf, "mdia", trak.offset + 8, trakEnd);
        if (mdia) {
          const mdhd = this.findBox(buf, "mdhd", mdia.offset + 8, mdia.offset + mdia.size);
          if (mdhd) {
            const mdhdV = buf[mdhd.offset + 8];
            let timescale = 1;
            if (mdhdV === 1) {
              timescale = this.read32(buf, mdhd.offset + 28);
            } else {
              timescale = this.read32(buf, mdhd.offset + 20);
            }
            const mdhdDurUnits = Math.round(totalSeconds * timescale);
            if (mdhdV === 1) {
              this.write64(buf, mdhd.offset + 32, Math.floor(mdhdDurUnits / 0x100000000), mdhdDurUnits >>> 0);
            } else {
              this.write32(buf, mdhd.offset + 24, mdhdDurUnits);
            }
          }
        }
        if (mvhd) {
          const mvhdV = buf[mvhd.offset + 8];
          let movieTS = mvhdV === 1 ? this.read32(buf, mvhd.offset + 28) : this.read32(buf, mvhd.offset + 20);
          const units = Math.round(totalSeconds * movieTS);
          if (version === 1) {
            this.write64(buf, tkhd.offset + 32, Math.floor(units / 0x100000000), units >>> 0);
          } else {
            this.write32(buf, tkhd.offset + 24, units);
          }
        }
      }
      search = trak.offset + trak.size;
    }
    return buf;
  }

  async getPlaylist(videoId) {
    const url = `${this.BASE}/m3u8/${videoId}`;
    const res = await fetch(url, { headers: this.HEADERS, agent: httpsAgent });
    const text = await res.text();

    let initUrl = null;
    const segments = [];
    let pendingDuration = null;

    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (line.startsWith("#EXT-X-MAP:URI=")) {
        initUrl = line.match(/URI="([^"]+)"/)?.[1] || null;
      } else if (line.startsWith("#EXTINF:")) {
        pendingDuration = parseFloat(line.slice(8));
      } else if (line.startsWith("http")) {
        segments.push({ url: line, duration: pendingDuration || 0 });
        pendingDuration = null;
      }
    }

    const totalSeconds = segments.reduce((s, seg) => s + seg.duration, 0);
    return { initUrl, segments, totalSeconds };
  }

  // DESCARGA CONTROLADA: batches de 12 en paralelo, sin saturar memoria
  async downloadAll(urls, concurrency = this.concurrency) {
    const results = new Array(urls.length);

    const downloadBatch = async (batch) => {
      await Promise.all(batch.map(async ({ url, index }) => {
        try {
          const res = await fetch(url, { 
            headers: this.HEADERS,
            agent: url.startsWith('https:') ? httpsAgent : httpAgent
          });
          results[index] = Buffer.from(await res.arrayBuffer());
        } catch (e) {
          results[index] = null;
        }
      }));
    };

    // Procesar en batches
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = [];
      for (let j = i; j < i + concurrency && j < urls.length; j++) {
        batch.push({ url: urls[j].url || urls[j], index: j });
      }
      await downloadBatch(batch);
    }

    // Reintentar fallidos una sola vez
    const failed = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i] === null) failed.push({ url: urls[i].url || urls[i], index: i });
    }
    if (failed.length > 0) {
      await downloadBatch(failed);
    }

    return results;
  }

  async scrape(url) {
    try {
      const cleanUrl = url.replace(/\/+$/, "");
      const parts = cleanUrl.split("/");
      const episode = Number(parts[parts.length - 1]) || null;
      const slugIndex = parts.findIndex((v) => v === "media");
      const rawTitle = slugIndex !== -1 ? parts[slugIndex + 1] : null;
      const title = this.formatTitle(rawTitle);
      const dataUrl = `${cleanUrl}/__data.json?x-sveltekit-invalidated=0001`;

      const { data: json } = await axios.get(dataUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json,text/plain",
          Referer: cleanUrl,
        },
        timeout: this.timeout,
        httpAgent,
        httpsAgent,
      });

      const dataNode = json?.nodes?.find((v) => v?.type === "data");
      const arr = dataNode?.data || [];

      const resolve = (value, seen = new WeakSet()) => {
        if (typeof value === "number") {
          if (value === -1) return null;
          if (value >= 0 && value < arr.length) return resolve(arr[value], seen);
          return value;
        }
        if (Array.isArray(value)) return value.map((v) => resolve(v, seen));
        if (value && typeof value === "object") {
          if (seen.has(value)) return value;
          seen.add(value);
          const out = {};
          for (const [k, v] of Object.entries(value)) out[k] = resolve(v, seen);
          return out;
        }
        return value;
      };

      const resolved = arr.map((v) => {
        try { return resolve(v); } catch { return v; }
      });

      const episodeObj = resolved.find((v) => v && typeof v === "object" && (v.id || v.episodeNumber || v.publishedAt || v.filler !== undefined)) || {};
      const embedsObj = resolved.find((v) => v && typeof v === "object" && (Array.isArray(v.SUB) || Array.isArray(v.DUB) || Array.isArray(v.RAW))) || {};
      const downloadsObj = resolved.find((v) => v && typeof v === "object" && (Array.isArray(v.SUB) || Array.isArray(v.DUB) || Array.isArray(v.RAW)) && JSON.stringify(v).includes("server")) || {};

      const getHvidData = (playUrl) => {
        const id = playUrl?.match(/\/play\/([a-f0-9]+)/i)?.[1] || null;
        return { id, play: playUrl || null, m3u8: id ? `https://cdn.hvidserv.com/m3u8/${id}` : null, embed: id ? `https://hvidserv.com/embed/${id}` : null };
      };

      const dedupeByUrl = (items = []) => {
        const seen = new Set();
        return items.filter((item) => {
          const key = item?.url || item?.play || item?.m3u8;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      const normalizeMirrors = (mirrorRefs) => {
        if (!Array.isArray(mirrorRefs)) return [];
        return dedupeByUrl(mirrorRefs.map((m) => resolve(m)).filter((v) => v && typeof v === "object" && v.server && v.url).map((v) => ({ server: v.server || null, ...getHvidData(v.url) })));
      };

      const normalizeDownloads = (downloadRefs) => {
        if (!Array.isArray(downloadRefs)) return [];
        return dedupeByUrl(downloadRefs.map((d) => resolve(d)).filter((v) => v && typeof v === "object" && v.server && v.url).map((v) => ({ server: v.server || null, url: v.url || null })));
      };

      const mirrors = { SUB: normalizeMirrors(embedsObj.SUB || []), DUB: normalizeMirrors(embedsObj.DUB || []), RAW: normalizeMirrors(embedsObj.RAW || []) };
      const downloads = { SUB: normalizeDownloads(downloadsObj.SUB || []), DUB: normalizeDownloads(downloadsObj.DUB || []), RAW: normalizeDownloads(downloadsObj.RAW || []) };

      return {
        success: true,
        title,
        episode,
        url: cleanUrl,
        filler: episodeObj.filler ?? null,
        published: this.formatDate(episodeObj.publishedAt),
        links: {
          main: {
            id: mirrors.SUB[0]?.id || mirrors.DUB[0]?.id || mirrors.RAW[0]?.id || null,
            play: mirrors.SUB[0]?.play || mirrors.DUB[0]?.play || mirrors.RAW[0]?.play || null,
            m3u8: mirrors.SUB[0]?.m3u8 || mirrors.DUB[0]?.m3u8 || mirrors.RAW[0]?.m3u8 || null,
            embed: mirrors.SUB[0]?.embed || mirrors.DUB[0]?.embed || mirrors.RAW[0]?.embed || null,
          },
          mirrors,
          downloads: [...downloads.SUB, ...downloads.DUB, ...downloads.RAW],
        },
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async downloadFromPlayUrl(playUrl, outputFile) {
    const videoId = this.extractId(playUrl);
    if (!videoId) throw new Error("ID de video no válido");

    const { initUrl, segments, totalSeconds } = await this.getPlaylist(videoId);

    // Descargar init
    const initRes = await fetch(initUrl, { headers: this.HEADERS, agent: httpsAgent });
    let initBuf = Buffer.from(await initRes.arrayBuffer());
    initBuf = this.patchDuration(initBuf, totalSeconds);

    // Descargar segments en batches de 12
    const segBuffers = await this.downloadAll(segments, this.concurrency);

    const out = outputFile || `${videoId}.mp4`;
    const ws = fs.createWriteStream(out);

    ws.write(initBuf);
    for (const buf of segBuffers) {
      if (buf) ws.write(buf);
    }

    await new Promise((res, rej) => {
      ws.end();
      ws.on("finish", res);
      ws.on("error", rej);
    });

    const stats = fs.statSync(out);
    return {
      success: true,
      id: videoId,
      file: path.resolve(out),
      size: +(stats.size / 1024 / 1024).toFixed(2) + " MB",
      segments: segments.length,
    };
  }
}

const VIDEOS_DIR = path.join(process.cwd(), "videos");
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

// SERVIR VIDEOS CON DOWNLOAD FORZADO (no reproduce, se descarga)
app.get("/videos/:file", (req, res) => {
  const filePath = path.join(VIDEOS_DIR, req.params.file);

  if (!filePath.startsWith(VIDEOS_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Video no encontrado" });
  }

  const stat = fs.statSync(filePath);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.file}"`);
  res.setHeader('Content-Length', stat.size);

  fs.createReadStream(filePath).pipe(res);
});

// SOLO 2 ENDPOINTS: hentaidl y turnstile-solver
app.all("/starlight/hentaidl", async (req, res) => {
  const url = req.query.url || req.body?.url;
  const downloader = new HentaiLaDownloader({ concurrency: 12 });

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Falta el parámetro "url".',
      example: "GET /starlight/hentaidl?url=https://hentai.la/media/anime-title/1",
    });
  }

  try {
    const info = await downloader.scrape(url);
    if (!info.success) {
      return res.status(502).json({ success: false, error: "No se pudo obtener info del episodio." });
    }

    const playUrl = info.links?.main?.play;
    if (!playUrl) {
      return res.status(502).json({ success: false, error: "No se encontró URL de reproducción." });
    }

    const safeName = downloader.sanitizeFileName(info.title || "video");
    const ep = info.episode || "1";
    const fileName = `${safeName}_ep${ep}_${Date.now()}.mp4`;
    const filePath = path.join(VIDEOS_DIR, fileName);

    console.log(`[DOWNLOAD] ${info.title} ep${ep} → ${filePath}`);
    const startTime = Date.now();

    const result = await downloader.downloadFromPlayUrl(playUrl, filePath);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!result.success || !fs.existsSync(filePath)) {
      return res.status(500).json({ success: false, error: "Error al ensamblar el video." });
    }

    const stat = fs.statSync(filePath);
    const sizeMB = +(stat.size / 1024 / 1024).toFixed(2);

    return res.json({
      success: true,
      title: info.title,
      episode: info.episode,
      filler: info.filler,
      published: info.published,
      speed: `${elapsed}s`,
      video: {
        url: `${req.protocol}://${req.get('host')}/videos/${fileName}`,
        fileName,
        size: `${sizeMB} MB`,
        segments: result.segments,
      },
    });

  } catch (err) {
    console.error("[ERROR]", err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "API",
    version: "1.0.0",
    endpoints: {
      solver: "/turnstile-solver",
      hentaidl: "/starlight/hentaidl",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Solver: http://localhost:${PORT}/turnstile-solver`);
  console.log(`HentaiDL: http://localhost:${PORT}/starlight/hentaidl`);
});