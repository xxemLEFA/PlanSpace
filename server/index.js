import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "threejs_planspace",
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

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`PlanSpace server listening on ${port}`);
});
