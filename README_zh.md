# PlanSpace Flight

基于 Three.js 的飞行游戏原型，包含任务、武器、2D/3D 小地图与 MySQL 排行榜。

## 运行环境

- Node.js 18+
- MySQL 8+

## 目录结构

- `index.html`, `src/` - 前端 (Vite + Three.js)
- `server/` - 后端 API (Node.js + Express + MySQL)

## 安装与启动

### 1) 数据库

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

### 2) 后端

```bash
cd p:\ThreeJS\PlanSpace\server
copy .env.example .env
npm install
npm run dev
```

编辑 `server/.env` 配置你的 MySQL 账号和密码。

### 3) 前端

```bash
cd p:\ThreeJS\PlanSpace
npm install
npm run dev
```

前端会把 `/api` 代理到 `http://localhost:3000`。

## 操作说明

- W/S：加速/减速
- A/D：偏航
- 小键盘 8/5：俯仰
- 小键盘 4/6：横滚
- Q：切换锁定目标
- E：切换武器
- 空格：开火
- R：重置

## 排行榜接口

- `POST /api/score` 保存成绩  
  - JSON: `{ "name": "player", "timeMs": 12345 }`
- `GET /api/score?limit=15` 获取前 15 名

## 备注

- HUD 内可切换 2D/3D 小地图
- 开发阶段提供测试完成按钮
