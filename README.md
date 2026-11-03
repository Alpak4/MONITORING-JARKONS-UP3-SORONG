# Paket Update GitHub — Dashboard Gangguan PLN UP3 Sorong
Tanggal: 3 November 2026 · Versi cache: ?v=20261103a / ?v=20261103b

## Pembaruan
1. **Unduh PPT — menu Monitoring 4DX** (format "PPT_Workplan_HAR")
   - Cover (bulan laporan otomatis)
   - Monitoring WIG Keandalan (HAR): tabel Jan–Jun, Jul–Des, rekap 2026 / SMT 1 / SMT 2
   - Monitoring Pelaporan Realisasi Workplan ULP pada WAG (HAR): 2 bulan per slide
     (Sorong Kota, Aimas, Teminabuan, Waisai) dari Januari s/d bulan filter 4DX + tabel Kumulatif
2. **Unduh PPT — menu ROW** (Paparan Realisasi Pekerjaan ROW, 7 slide)
   - Cover · Ringkasan (5 kartu KPI + grafik rabas bulanan per ULP + kurva S kumulatif vs target)
   - Matriks realisasi bulanan per ULP (rabas kms & tebang btg, warna = capaian vs target)
   - Kinerja per ULP (panel 2×2) · Top penyulang & kontribusi ULP · Mitra pelaksana
   - Catatan capaian & rekomendasi tindak lanjut otomatis
   - Periode mengikuti filter bulan menu ROW (default: bulan terakhir berdata)
3. Monitoring AO tetap memakai format "AO_M1_November"; menu lain tetap format ringkas.

## File dalam paket (paket DATAR — semua di ROOT repo, sejajar index.html)
| File | Status | Keterangan |
|---|---|---|
| index.html | TIMPA | memuat skrip baru + cache-busting |
| ppt-export.js | TIMPA | pengarah tombol Unduh PPT (AO / 4DX / ROW / lainnya) |
| fdx.js | TIMPA | menyediakan bulan filter 4DX untuk PPT |
| wig.js | TIMPA | menyediakan data WIG Keandalan untuk PPT |
| workplan.js | TIMPA | menyediakan data Workplan (target & realisasi) untuk PPT |
| fdx-ppt.js | BARU | ekspor PPT Monitoring 4DX |
| row-ppt.js | BARU | ekspor PPT Paparan ROW |
| fdx-template.js | BARU | template PPT (cover & header) dikemas base64, dimuat hanya saat Unduh PPT |

File lain di repo (ao-ppt.js, ao-template.pptx, ppt-template.pptx, rabas.js, aset_jaringan.js, dll.) TIDAK perlu diubah.

## Cara upload
1. Ekstrak ZIP ini.
2. GitHub → buka repo → **Add file → Upload files** → seret 8 file di atas (tanpa folder) ke ROOT repo.
3. Isi pesan commit, mis. "Update PPT 4DX & ROW 3 Nov 2026" → **Commit changes** ke branch main.
4. Tunggu ±1–2 menit hingga GitHub Pages selesai deploy, lalu buka situs dengan **Ctrl+F5**.

## Uji setelah deploy
- Menu **Monitoring 4DX** → pilih Bulan → **⤓ Unduh PPT** → file "Monitoring 4DX - WIG & Workplan HAR UP3 Sorong s.d <Bulan> 2026.pptx".
- Menu **ROW** → (opsional) pilih bulan → **⤓ Unduh PPT** → file "Paparan Realisasi ROW UP3 Sorong s.d <Bulan> 2026.pptx".

Catatan: fitur Unduh PPT memerlukan koneksi internet (memuat JSZip dari CDN dan data dari Google Spreadsheet).
