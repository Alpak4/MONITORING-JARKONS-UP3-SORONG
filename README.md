# Paket deploy — 19 Okt 2026

Perbaikan: Monitoring AO kosong karena index.html memuat js/ao-*.js versi lama dan js/ao-snapshot.js tidak ada di repo.

Paket ini DATAR: semua file .js berada di root, sejajar index.html.

Cara upload (GitHub → Add file → Upload files):
1. Upload SEMUA file di paket ini ke ROOT repo (timpa yang lama).
2. Commit ke main. Tunggu ±1–2 menit, lalu buka situs dengan Ctrl+F5.

Folder js/ lama di repo tidak dipakai lagi (boleh dihapus).
