# Paket deploy — 23 Okt 2026 (update ke-2)

Pembaruan menu **Workplan Susut**:
- Pemetaan Lead Measure Workplan → Kegiatan Susut kini PERMANEN (daftar eksplisit dari data aktual + 71 koreksi manual) — berlaku untuk semua pengguna
- Panel baru **Input Harian Kegiatan Susut — dari Realisasi Workplan**: matriks kegiatan × tanggal, pilih bulan, klik angka → rincian entri harian
- Unduh Excel harian: **Bulan Ini** atau **Semua Bulan** (sheet Rekap Bulanan + 1 sheet per bulan Jan–Des + Rincian Semua Entri)
- Excel "Rekap Susut dari WP" kini menyertakan kolom Tanggal

File yang WAJIB diupload (paket DATAR, sejajar index.html):
- index.html  (timpa)
- susut.js    (timpa)

File lain di paket ini sama dengan versi sebelumnya — tidak wajib diupload ulang.

Cara upload (GitHub → Add file → Upload files):
1. Upload index.html & susut.js ke ROOT repo (timpa yang lama).
2. Commit ke main. Tunggu ±1–2 menit, lalu buka situs dengan Ctrl+F5 (cache-busting: susut.js?v=20261023k).
