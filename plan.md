Saya sedang membangun sistem scraping data dari berbagai platform (YouTube, Instagram, Facebook, TikTok, dan website lainnya). User memasukkan URL, lalu sistem melakukan scraping semua jenis data (post, caption, komentar, like, metadata, dll), kemudian user dapat mendownload hasilnya dalam bentuk file (CSV/JSON/XLSX).

Namun saat ini ada masalah serius:
👉 data hasil download tidak sesuai dengan hasil scraping (data hilang / tidak lengkap / jumlah tidak cocok)

Saya ingin kamu bertindak sebagai Senior Backend Engineer & System Architect untuk memperbaiki total desain sistem ini agar production-ready, stabil, dan scalable.

🎯 TUJUAN UTAMA

Perbaiki sistem agar:

Data scraping selalu 100% lengkap dan konsisten
Tidak ada data hilang saat export
Tidak ada race condition antara scraping dan download
Pagination/crawling selalu selesai sempurna
Sistem aman untuk multi-user dan banyak job
Data hanya bisa di-download setelah scraping benar-benar selesai
⚙️ YANG HARUS KAMU LAKUKAN
1. 🔍 ANALISIS MASALAH

Analisis kemungkinan bug berikut:

Async scraping belum selesai tapi export sudah jalan
Pagination tidak tuntas
Data overwrite (replace array instead of append)
Export mengambil data dari memory process, bukan snapshot
Tidak ada job queue / worker system
Race condition antara scraper dan downloader
2. 🏗️ DESAIN ULANG ARSITEKTUR SISTEM

Buat arsitektur sistem yang benar seperti ini:

USER INPUT URL
→ VALIDATION + PLATFORM DETECTION
→ CREATE SCRAPING JOB (queued)
→ JOB QUEUE / WORKER (async background)
→ SCRAPING ENGINE
→ PAGINATION CONTROLLER (full completion guarantee)
→ NORMALIZATION LAYER (unified data structure)
→ SNAPSHOT STORAGE (database / file / object storage)
→ UPDATE JOB STATUS = DONE
→ EXPORT MODULE (CSV / JSON / XLSX)
→ USER DOWNLOAD

Wajib ada:

job status: queued, processing, done, failed
retry mechanism
progress tracking (%)
completion validation (ensure all pages fetched)
locking system agar tidak double export
3. 🔁 PERBAIKI SCRAPING LOGIC

Buat pseudocode yang benar untuk:

pagination loop sampai habis
append data (bukan overwrite)
retry request jika gagal
delay untuk rate limit handling
deduplication berdasarkan unique id

Pastikan scraping tidak berhenti sebelum data benar-benar lengkap.

4. 💾 PERBAIKI DATA STORAGE (PENTING)

Jelaskan bahwa:

data HARUS disimpan sebagai SNAPSHOT setelah scraping selesai
export TIDAK boleh mengambil data dari proses scraping langsung

Gunakan salah satu:

database (MongoDB / PostgreSQL)
atau file per job (JSON snapshot)

Contoh struktur:

/jobs/{job_id}/raw.json
/jobs/{job_id}/final.json

atau database:

scraped_data:
job_id | platform | data_json
5. ⬇️ PERBAIKI EXPORT SYSTEM

Export harus:

hanya membaca dari snapshot storage
hanya bisa dilakukan jika status job = DONE
tidak boleh akses scraping process langsung

Output format:

CSV
JSON
XLSX
6. ⚙️ IMPLEMENTASI TEKNIS

Pilih salah satu stack:

Node.js (BullMQ + Redis)
Python (Celery + Redis)

Berikan:

struktur folder project
contoh worker scraping
contoh job queue system
contoh API endpoint:
POST /scrape (start job)
GET /status/:job_id
GET /download/:job_id
⚠️ CONSTRAINT WAJIB
Tidak boleh ada data loss
Harus anti race condition
Harus scalable (multi user + multi job)
Harus production-ready
Export hanya dari data final (snapshot)
Scraping harus 100% selesai sebelum status DONE
🎯 OUTPUT YANG SAYA INGINKAN
Arsitektur final sistem
Flow sistem yang benar
Perbaikan logic scraping
Contoh implementasi kode penting
Best practice untuk mencegah data mismatch
Desain sistem yang siap production scale
💡 BONUS (JIKA BISA)

Tambahkan:

deduplication strategy
rate limit handling per platform
progress percentage tracking
webhook callback ketika scraping selesai