# Social Media Intelligence – Backend

FastAPI backend yang memungkinkan user cukup input **1 URL publik** dari media sosial → sistem otomatis scraping → data tersimpan → bisa diakses via REST API atau di-export.

---

## Stack

| Komponen | Teknologi |
|---|---|
| API Framework | FastAPI (Python 3.12) |
| Queue / Broker | Redis + Celery |
| Database | PostgreSQL 16 |
| Worker Monitor | Flower |
| Container | Docker + docker-compose |

---

## Quick Start (Docker)

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Salin env file
cp .env.example .env
# (opsional) isi YOUTUBE_API_KEY di .env untuk data lebih lengkap

# 3. Jalankan semua service
docker compose up --build -d

# 4. Cek apakah API berjalan
curl http://localhost:8000/health
```

Akses:
- **API Docs (Swagger)** → http://localhost:8000/docs
- **Celery Flower** → http://localhost:5555

---

## Cara Penggunaan

### 1. Submit URL untuk di-scrape

```bash
curl -X POST http://localhost:8000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Response:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "platform": "youtube",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 2. Cek status job

```bash
curl http://localhost:8000/api/scrape/550e8400-e29b-41d4-a716-446655440000
```

Response saat selesai:
```json
{
  "job_id": "...",
  "status": "completed",
  "result": {
    "platform": "youtube",
    "username": "Rick Astley",
    "content": "Never Gonna Give You Up",
    "likes": 14000000,
    "views": 1400000000,
    ...
  }
}
```

### 3. Daftar semua post yang sudah di-scrape

```bash
# Semua platform
curl "http://localhost:8000/api/posts?page=1&page_size=20"

# Filter per platform
curl "http://localhost:8000/api/posts?platform=youtube"
```

### 4. Analytics

```bash
curl http://localhost:8000/api/analytics/summary
curl "http://localhost:8000/api/analytics/top-posts?metric=views&limit=10"
```

### 5. Export data

```bash
# CSV
curl http://localhost:8000/api/export/csv -o scraped_posts.csv

# JSON
curl http://localhost:8000/api/export/json -o scraped_posts.json

# Filter platform
curl "http://localhost:8000/api/export/csv?platform=tiktok" -o tiktok_posts.csv
```

---

## Platform Support

| Platform | Metode Utama | Fallback | API Key Dibutuhkan? |
|---|---|---|---|
| **YouTube** | YouTube Data API v3 | yt-dlp | Opsional (`YOUTUBE_API_KEY`) |
| **TikTok** | yt-dlp | TikTok oEmbed | Tidak |
| **Instagram** | yt-dlp | Instagram oEmbed | Tidak (basic data) |
| **Facebook** | yt-dlp | Meta Graph oEmbed | Opsional (`META_ACCESS_TOKEN`) |

> ⚠️ Hanya konten **publik** yang dapat di-scrape. Login bypass atau private data scraping **tidak dilakukan**.

---

## API Endpoints

| Method | Path | Deskripsi |
|---|---|---|
| `POST` | `/api/scrape` | Submit URL baru |
| `GET` | `/api/scrape/{job_id}` | Cek status / hasil job |
| `GET` | `/api/posts` | List semua post (paginated) |
| `GET` | `/api/posts/{post_id}` | Detail satu post |
| `GET` | `/api/analytics/summary` | Statistik keseluruhan |
| `GET` | `/api/analytics/top-posts` | Top post by engagement |
| `GET` | `/api/export/csv` | Download CSV |
| `GET` | `/api/export/json` | Download JSON |
| `GET` | `/health` | Health check |

Dokumentasi lengkap: **http://localhost:8000/docs**

---

## Process Flow

```
User input URL
    │
    ▼
POST /api/scrape
    │
    ├─► Platform Detector (regex)
    │       youtube / tiktok / instagram / facebook
    │
    ├─► Duplicate check (Redis cache → PostgreSQL)
    │
    ├─► Create ScrapeJob record (status: pending)
    │
    ▼
Redis Queue (Celery broker)
    │
    ▼
Celery Worker (scrape_queue)
    │
    ├─► Scraper Module (yt-dlp / API / oEmbed)
    │
    ├─► DataNormalizer → NormalisedPost schema
    │
    ├─► Upsert ke PostgreSQL (scraped_posts)
    │
    └─► Update job status: completed / failed
            │
            ▼
GET /api/scrape/{job_id}  →  hasil lengkap
```

---

## Environment Variables

| Variable | Default | Keterangan |
|---|---|---|
| `DATABASE_URL` | postgresql+asyncpg://... | Async DB URL |
| `DATABASE_SYNC_URL` | postgresql://... | Sync DB URL (Celery) |
| `REDIS_URL` | redis://redis:6379/0 | Cache + result backend |
| `CELERY_BROKER_URL` | redis://redis:6379/0 | Celery broker |
| `CELERY_RESULT_BACKEND` | redis://redis:6379/1 | Celery results |
| `YOUTUBE_API_KEY` | *(kosong)* | YouTube Data API v3 |
| `META_ACCESS_TOKEN` | *(kosong)* | Meta Graph API |
| `CACHE_TTL` | `3600` | Cache TTL dalam detik |
| `RATE_LIMIT_PER_MINUTE` | `30` | Rate limit per menit |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS origins |

---

## Struktur Folder

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings (pydantic-settings)
│   ├── database.py          # Async + sync SQLAlchemy engines
│   ├── models/
│   │   ├── post.py          # ScrapedPost ORM model
│   │   └── job.py           # ScrapeJob ORM model
│   ├── schemas/
│   │   └── scrape.py        # Pydantic request/response schemas
│   ├── core/
│   │   ├── detector.py      # Platform URL detector
│   │   └── normalizer.py    # Raw data → NormalisedPost
│   ├── scrapers/
│   │   ├── base.py          # Abstract BaseScraper
│   │   ├── youtube.py       # YouTube (API v3 + yt-dlp)
│   │   ├── tiktok.py        # TikTok (yt-dlp + oEmbed)
│   │   ├── instagram.py     # Instagram (yt-dlp + oEmbed)
│   │   └── facebook.py      # Facebook (yt-dlp + Graph API)
│   ├── workers/
│   │   ├── celery_app.py    # Celery configuration
│   │   └── tasks.py         # scrape_url_task, retry_stale_jobs
│   ├── api/
│   │   └── routes/
│   │       ├── scrape.py    # POST /api/scrape, GET /api/scrape/{id}
│   │       ├── posts.py     # GET /api/posts
│   │       ├── analytics.py # GET /api/analytics/*
│   │       └── export.py    # GET /api/export/csv|json
│   └── utils/
│       ├── cache.py         # Redis async cache helpers
│       └── export.py        # CSV / JSON serialisers
├── migrations/
│   └── init.sql             # PostgreSQL schema init
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

---

## Development (tanpa Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Set env variables
export DATABASE_URL="postgresql+asyncpg://postgres:changeme@localhost:5432/social_intel"
export DATABASE_SYNC_URL="postgresql://postgres:changeme@localhost:5432/social_intel"
export REDIS_URL="redis://localhost:6379/0"
export CELERY_BROKER_URL="redis://localhost:6379/0"
export CELERY_RESULT_BACKEND="redis://localhost:6379/1"

# Run API
uvicorn app.main:app --reload --port 8000

# Run worker (terminal terpisah)
celery -A app.workers.celery_app worker --loglevel=info -Q scrape_queue

# Run Flower monitor (opsional)
celery -A app.workers.celery_app flower --port=5555
```
