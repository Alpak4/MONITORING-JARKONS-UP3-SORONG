# Paket deploy — 29 Okt 2026

Pembaruan:
- **Menu samping (sidebar)**: menu tab dipindah ke kiri layar & bisa disembunyikan (tombol ☰ di header, « di sidebar, atau tab "MENU" di tepi kiri). Status buka/tutup tersimpan di browser; di HP otomatis tersembunyi.
- **⤓ Unduh PPT** (kanan atas judul): mengunduh menu aktif sebagai PowerPoint ringkas dengan format template PLN — Cover, Ringkasan Eksekutif (KPI + poin kunci), maks. 4 grafik + panel Analisa otomatis, Data Pendukung, Kesimpulan & Rekomendasi. Mengikuti filter aktif.

File yang WAJIB diupload (paket DATAR, sejajar index.html):
- index.html        (timpa)
- ppt-export.js     (BARU)
- ppt-template.pptx (BARU — template slide; ganti file ini bila format PPT berubah)

File lain di paket ini sama dengan versi sebelumnya — tidak wajib diupload ulang.

Cara upload (GitHub → Add file → Upload files):
1. Upload ketiga file di atas ke ROOT repo (timpa index.html yang lama).
2. Commit ke main. Tunggu ±1–2 menit, lalu buka situs dengan Ctrl+F5 (cache-busting: ppt-export.js?v=20261029b).

Catatan: fitur Unduh PPT memerlukan koneksi internet (memuat pustaka JSZip dari CDN).
