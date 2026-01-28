import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

const env = {
  port: Number(process.env.PORT || 3000),
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "threejs_planspace"
};

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  connectionLimit: 10
});

app.get("/api/score", async (req, res) => {
  const limitRaw = Number(req.query.limit || 15);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 15;
  try {
    const [rows] = await pool.query(
      "SELECT id, name, time_ms, created_at FROM scores ORDER BY time_ms ASC, created_at ASC LIMIT ?",
      [limit]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error("GET /api/score failed:", err);
    res.status(500).json({ error: "db_error", code: err?.code || "unknown" });
  }
});

app.post("/api/score", async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 50);
  const timeMs = Number(req.body?.timeMs);
  if (!name || !Number.isFinite(timeMs) || timeMs <= 0) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO scores (name, time_ms) VALUES (?, ?)",
      [name, Math.round(timeMs)]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error("POST /api/score failed:", err);
    res.status(500).json({ error: "db_error", code: err?.code || "unknown" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    console.error("GET /api/health failed:", err);
    res.status(500).json({ ok: false, error: "db_error", code: err?.code || "unknown" });
  }
});

function reportEnv() {
  const missing = [];
  if (!process.env.DB_HOST) missing.push("DB_HOST");
  if (!process.env.DB_PORT) missing.push("DB_PORT");
  if (!process.env.DB_USER) missing.push("DB_USER");
  if (!process.env.DB_NAME) missing.push("DB_NAME");
  if (missing.length) {
    console.warn(`[env] Missing ${missing.join(", ")}; using defaults.`);
  }
  if (!process.env.DB_PASSWORD) {
    console.warn("[env] DB_PASSWORD is empty; using blank password.");
  }
}

async function verifyDatabase() {
  try {
    await pool.query("SELECT 1");
    console.log("[db] connection OK");
  } catch (err) {
    console.error("[db] connection failed:", err?.code || err?.message || err);
  }
}

reportEnv();
verifyDatabase();

app.listen(env.port, () => {
  console.log(`PlanSpace server listening on http://localhost:${env.port}`);
  console.log(`Health check: http://localhost:${env.port}/api/health`);
  console.log("Frontend (Vite dev): http://localhost:5173");
});
