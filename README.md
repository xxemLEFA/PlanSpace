# PlanSpace Flight

English README. 中文请看 `README_zh.md`.

Three.js flight game prototype with missions, weapons, minimap (2D/3D), and a MySQL-backed leaderboard.

## Requirements

- Node.js 18+
- MySQL 8+

## Project Structure

- `index.html`, `src/` - Frontend (Vite + Three.js)
- `server/` - Backend API (Node.js + Express + MySQL)

## Setup

### 1) Database

```sql
CREATE DATABASE IF NOT EXISTS threejs_planspace
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE threejs_planspace;

CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  time_ms INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2) Backend

```bash
cd p:\ThreeJS\PlanSpace\server
copy .env.example .env
npm install
npm run dev
```

Edit `server/.env` with your MySQL credentials.

### 3) Frontend

```bash
cd p:\ThreeJS\PlanSpace
npm install
npm run dev
```

The frontend proxies `/api` to `http://localhost:3000`.

## Gameplay

- W/S: throttle
- A/D: yaw
- Numpad 8/5: pitch
- Numpad 4/6: roll
- Q: next lock target
- E: switch weapon
- Space: fire
- R: reset

## Leaderboard

- `POST /api/score` save a score
  - JSON: `{ "name": "player", "timeMs": 12345 }`
- `GET /api/score?limit=15` list top scores

## Notes

- 2D/3D minimap toggle is in the HUD.
- A test completion button is available for development.
