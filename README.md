# ENGCE301 — Week 6: N-Tier Architecture + Load Balancing with Docker

> **ชื่อ:** [ใส่ชื่อจริง]  
> **รหัสนักศึกษา:** [ใส่รหัส]  
> **วิชา:** ENGCE301 Software Engineering  
> **สัปดาห์:** 6 — N-Tier Architecture & Docker Load Balancing

---

## 📚 สิ่งที่ได้เรียนรู้ในสัปดาห์นี้

### 1. Software Architecture หลัก

ก่อนออกแบบซอฟต์แวร์ควรเลือก **Architectural Style** ให้เหมาะสมกับความต้องการก่อน เช่น:

| เป้าหมาย | สิ่งที่ควรเน้น |
|---|---|
| ตอบสนองเร็ว | Performance / Caching |
| ทนต่อการล่ม | High Availability / Redundancy |
| ปลอดภัย | Security Layer / Isolation |

#### รูปแบบสถาปัตยกรรมหลัก

| รูปแบบ | ลักษณะ |
|---|---|
| **Monolithic** | รวมทุกอย่าง (Front + Back + DB) ไว้ในก้อนเดียว เริ่มต้นง่าย แต่ scale ยาก |
| **Layered** | จัดระเบียบเป็นชั้น ๆ แต่ยังอยู่บนเครื่องเดียวกัน |
| **Client-Server** | แยกการประมวลผล Front ↔ Back ออกจากกัน |
| **N-Tier** | แยก Layer ออกชัดเจน อยู่คนละ Process/Container |

> **Client-Server** ยังแบ่งย่อยได้อีก:
> - **Stateless** — Frontend ทำงานได้โดยไม่ต้องเชื่อมต่อ Backend ตลอดเวลา (เช่น SPA)
> - **Stateful** — Frontend เชื่อมต่อ Backend ตลอดเวลา (เช่น Socket)

---

### 2. ความแตกต่างระหว่าง VM และ Docker

| | VM | Docker Container |
|---|---|---|
| **OS** | มี OS เต็ม ๆ อยู่ข้างใน | ไม่มี OS ของตัวเอง ใช้ kernel ของ Host |
| **ขนาด** | ใหญ่ (GB) | เล็กกว่ามาก (MB) |
| **เริ่มต้น** | ช้า (นาที) | เร็ว (วินาที) |
| **วิธีใช้** | ต้องติดตั้ง OS เต็ม | pull image แล้วรัน container ได้เลย |

---

### 3. N-Tier Architecture ในการทดลองนี้

โปรเจคนี้ใช้สถาปัตยกรรม **4-Tier** ผ่าน Docker Compose:

```
[Browser / Client]
        ↓
  [Tier 1: Nginx]  ← Load Balancer + Static Files (port 80)
        ↓ Round-Robin
  [Tier 2: Node.js API × 3]  ← Business Logic
        ↓                ↓
  [Tier 3a: Redis]  [Tier 3b: PostgreSQL]
   Cache Layer        Persistent Database
```

---

## 🛠️ โครงสร้างโปรเจค

```
engce301-termproject-week6-ntier-loadbalance/
├── docker-compose.yml      # Orchestrate ทุก service
├── nginx/
│   ├── nginx.conf          # Worker config
│   └── conf.d/default.conf # Upstream + Proxy rules
├── api/
│   ├── Dockerfile          # Build Node.js image
│   ├── server.js           # Entry point + Instance ID
│   └── src/
│       ├── config/         # DB + Redis connection
│       ├── routes/         # API endpoints
│       └── middleware/     # Error handler
├── database/
│   └── init.sql            # Schema + Sample data
└── frontend/
    └── index.html          # Static frontend
```

---

## 🚀 วิธีรัน

### Requirements
- Docker Desktop (Linux Engine)

### Start Stack (3 App Instances)

```bash
docker compose up -d --scale app=3 --build
```

### Check Status

```bash
docker ps
```

### Stop

```bash
docker compose down -v
```

---

## 🧪 ผลการทดลอง

### ขั้นตอนที่ 1 — Build & Start

รัน `docker compose up -d --scale app=3 --build` ระบบดำเนินการดังนี้:

1. Pull images: `postgres:16-alpine`, `redis:7-alpine`, `nginx:alpine`, `node:20-alpine`
2. Build `app` image จาก `./api/Dockerfile` (npm install 100 packages)
3. สร้าง Network: `taskboard-ntier` (bridge)
4. Start services ตามลำดับ: `db` → `redis` → `app ×3` → `nginx`

```
Container taskboard-db        → Started (healthy)
Container taskboard-redis     → Started (healthy)
Container app-1               → Started
Container app-2               → Started
Container app-3               → Started
Container taskboard-nginx     → Started
```

### ขั้นตอนที่ 2 — ตรวจสอบ Health Check

เรียก `GET http://localhost/api/health` ได้ผล:

```json
{
  "status": "ok",
  "instanceId": "app-37a8-mwi9",
  "timestamp": "2026-03-09T16:34:28.823Z",
  "database": { "status": "healthy" },
  "redis": { "status": "healthy" },
  "cache": { "hits": 0, "misses": 0, "hitRate": "0%" }
}
```

### ขั้นตอนที่ 3 — พิสูจน์ Load Balancing (Round-Robin)

เรียก `/api/health` จำนวน **9 ครั้ง** ติดต่อกัน สังเกต `instanceId`:

| Request | Instance ID | DB | Redis |
|---|---|---|---|
| 1 | `app-37a8-mwi9` | healthy | healthy |
| 2 | `app-9cfd-0gv2` | healthy | healthy |
| 3 | `app-7f39-fkon` | healthy | healthy |
| 4 | `app-37a8-mwi9` | healthy | healthy |
| 5 | `app-9cfd-0gv2` | healthy | healthy |
| 6 | `app-7f39-fkon` | healthy | healthy |
| 7 | `app-37a8-mwi9` | healthy | healthy |
| 8 | `app-9cfd-0gv2` | healthy | healthy |
| 9 | `app-7f39-fkon` | healthy | healthy |

> **✅ สรุป:** Nginx กระจาย Request แบบ **Round-Robin** อย่างสมบูรณ์ (1-2-3-1-2-3-...)  
> แต่ละ Instance รับ Request เท่ากันพอดี (3 requests per instance)

### ขั้นตอนที่ 4 — ทดสอบ Redis Cache

เรียก `GET /api/tasks` ซ้ำ 5 ครั้ง แล้วตรวจสอบ cache stats:

```json
{
  "instanceId": "app-7f39-fkon",
  "cache": {
    "hits": 1,
    "misses": 0,
    "hitRate": "100%"
  }
}
```

> **✅ สรุป:** ครั้งแรกดึงจาก PostgreSQL (cache miss) ครั้งต่อไปดึงจาก Redis (cache hit) — ลด load บน database ได้จริง

### ขั้นตอนที่ 5 — Resource Usage

```
Container                       CPU%    Memory
─────────────────────────────────────────────────
taskboard-nginx                 0.00%   4.88 MiB
engce301-...-app-1              0.00%   18.86 MiB
engce301-...-app-2              0.00%   18.63 MiB
engce301-...-app-3              0.00%   18.23 MiB
taskboard-db                    0.04%   42.10 MiB
taskboard-redis                 0.51%   3.47 MiB
─────────────────────────────────────────────────
Total (estimated)               ~0.55%  ~106 MiB
```

> **สังเกต:** ยิ่งมี App instance เยอะ ยิ่งใช้ Memory มากขึ้น (แต่ละ instance ใช้ ~18 MB) ซึ่งสอดคล้องกับที่เรียนมาว่า **ยิ่ง scale เยอะ ยิ่งใช้ทรัพยากรมากขึ้น**

---

## 📊 สรุปผลการทดลอง

| หัวข้อ | ผล |
|---|---|
| Load Balancing Algorithm | Round-Robin (Nginx upstream) |
| App Instances | 3 instances |
| Distribution | สม่ำเสมอ 3 req/instance |
| Cache Hit Rate | 100% (หลัง warm-up) |
| Database | PostgreSQL healthy |
| Cache Layer | Redis healthy |
| Total Memory | ~106 MiB |

### สิ่งที่ได้เรียนรู้จริงจากการทดลอง

1. **N-Tier แยกออกจากกันอย่างชัดเจน** — Nginx ไม่รู้จัก DB, App ไม่ expose port ออกนอก มี Nginx เป็นทางเข้าเดียว
2. **Docker Compose DNS** — ใช้ชื่อ `app` เป็น upstream Nginx จะ resolve เป็น IP ของทุก instance อัตโนมัติเมื่อ `--scale app=3`
3. **Redis ลด DB Load** — ครั้งแรก Miss → ดึงจาก PostgreSQL แล้ว Cache ไว้ — ครั้งต่อไปเป็น Hit ทั้งหมด
4. **Health Check** — `db` และ `redis` ต้อง healthy ก่อน App จึงจะ start ได้ ป้องกัน Race Condition
5. **Instance ID** — แต่ละ Container มี Random ID ทำให้พิสูจน์ Load Balancing ได้ว่า Request ไปไหน

---

## 🔗 API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check + Instance ID + Cache stats |
| GET | `/api/tasks` | ดึง Tasks ทั้งหมด (มี Redis cache) |
| POST | `/api/tasks` | เพิ่ม Task ใหม่ |
| PUT | `/api/tasks/:id` | แก้ไข Task |
| DELETE | `/api/tasks/:id` | ลบ Task |