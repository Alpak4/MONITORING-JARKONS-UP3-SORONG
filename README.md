# Paket Update GitHub — Dashboard Gangguan PLN UP3 Sorong
Tanggal: 16 November 2026 · Versi cache terbaru: ?v=20261116a

## Pembaruan 16 November 2026 — Sub menu **PPT Evaluasi FGTM**
- Menu samping **Gangguan → PPT Evaluasi FGTM**: pilih Bulan, Minggu (M1 = tgl 1–7 · M2 = 8–14 · M3 = 15–21 · M4 = 22–akhir),
  tanggal data, target FGTM s.d. periode, tanggal paparan, serta slide opsional; pratinjau angka utama & susunan slide.
- **⤓ Download PPT Evaluasi FGTM** (format "Evaluasi FGTM M1 November – UP3 Sorong Rev 1", 23 slide + halaman detail otomatis):
  - Dari data gangguan: cover, overview (realisasi vs target, ULP terbesar, tren mingguan, 5 keypoint teratas), realisasi
    (durasi, zonasi, cuaca, indikasi GF/OC), sebaran per ULP & 10 keypoint, tren ULP & keypoint kritis 7 minggu,
    detail gangguan minggu (21 baris/slide), dokumentasi temuan (bingkai foto diisi manual), evaluasi & tindak lanjut ULP.
  - Dari data ROW: 6 slide ROW (ringkasan, matriks bulanan, kinerja ULP, penyulang, mitra, catatan).
  - Tetap dari template (belum ada sumber data di dashboard): realisasi pekerjaan Teminabuan, kebutuhan material cover,
    realisasi cover per material/ULP, dokumentasi checkpoint, penutup.

## Pembaruan sebelumnya (3 November 2026)
1. **Unduh PPT — menu Monitoring 4DX** (format "PPT_Workplan_HAR")
   - Cover (bulan laporan otomatis)
   - Monitoring WIG Keandalan (HAR): tabel Jan–Jun, Jul–Des, rekap 2026 / SMT 1 / SMT 2
   - Monitoring Pelaporan Realisasi Workplan ULP pada WAG (HAR): 2 bulan per slide
     (Sorong Kota, Aimas, Teminabuan, Waisai) dari Januari s/d bulan filter 4DX + tabel Kumulatif
2. **Unduh PPT — menu ROW** (Paparan Realisasi Pekerjaan ROW, 7 slide)
   - Cover · Ringkasan (infografis Pangkas & Tebang + tren bulanan)
   - Matriks realisasi bulanan per ULP (rabas kms & tebang btg, warna = capaian vs target)
   - Kinerja per ULP (panel 2×2) · Top penyulang & kontribusi ULP · Mitra pelaksana
   - Catatan capaian & rekomendasi tindak lanjut otomatis
   - Periode mengikuti filter bulan menu ROW (default: bulan terakhir berdata)
   - Target 2026 (fix) per ULP — Rabas/pangkas: Sorong Kota 380,04 · Aimas 540 · Teminabuan 687 · Waisai 200,04 kms/tahun;
     Penebangan: Sorong Kota 720 · Aimas 960 · Teminabuan 2.700 · Waisai 480 btg/tahun. Target bulanan = tahunan ÷ 12.
     (Ubah di TARGET_RABAS_THN / TARGET_TEBANG_THN pada row-ppt.js)
   - Slide Ringkasan: infografis Pangkas & Tebang (ikon, gauge capaian 2026 dengan penanda ideal, capaian kumulatif,
     sisa target & kebutuhan per bulan, bar per ULP vs target 2026) + tren bulanan dengan garis capaian kumulatif
3. **Unduh PPT — menu Monitoring AO** (format "AO_M1_November"): Cover, Executive Summary, Ikhtisar Anggaran,
   Rincian per Kegiatan, Status Pekerjaan (grafik), Daftar Pekerjaan (14 paket/slide). Daftar kini diurutkan seperti template:
   per tahap (Pelaksanaan → Proses Tagihan → Pengadaan → Terbayar), paket lewat akhir kontrak didahulukan, lalu nilai terbesar.
4. **Unduh PPT — menu Realisasi Workplan** (Paparan Realisasi Workplan, format sama dengan paparan ROW, ±16 slide)
   - Cover · Ringkasan (infografis capaian UP3: gauge capaian rata-rata, LM tuntas, entri pekerjaan, LM belum ada realisasi,
     capaian per kelompok; peringkat capaian per ULP; tren entri & capaian bulanan; komposisi entri per kelompok)
   - Matriks capaian Kelompok × ULP dan capaian bulanan per ULP (warna = capaian)
   - Kinerja per ULP (panel 2×2 + 3 lead measure prioritas) · Rekap lead measure (17 baris/slide, otomatis berhalaman)
   - Realisasi bulanan lead measure per ULP: tabel LM × bulan (Jan s/d bulan laporan) + target/bln, total & capaian;
     warna sel = realisasi bulan ÷ target bulanan ULP (18 baris/slide, otomatis berhalaman per ULP)
   - 10 lead measure capaian terendah & entri per mitra · Catatan capaian & rekomendasi tindak lanjut otomatis
   - Periode mengikuti filter Bulan menu Realisasi Workplan (default: bulan terakhir berdata); target bulanan = target tahunan ÷ 12
5. Menu lain tetap memakai format ringkas.

## File dalam paket (paket DATAR — semua di ROOT repo, sejajar index.html)
| File | Status | Keterangan |
|---|---|---|
| index.html | TIMPA | memuat skrip baru + cache-busting |
| ppt-export.js | TIMPA | pengarah tombol Unduh PPT (AO / 4DX / ROW / Workplan / FGTM / lainnya) |
| fdx.js | TIMPA | menyediakan bulan filter 4DX untuk PPT |
| wig.js | TIMPA | menyediakan data WIG Keandalan untuk PPT |
| workplan.js | TIMPA | menyediakan data & filter Workplan untuk PPT |
| ao-ppt.js | TIMPA | ekspor PPT Monitoring AO (urutan daftar pekerjaan) |
| ao-template.pptx | PASTIKAN ADA | template PPT AO_M1_November (sama dengan versi 2 Nov) |
| fdx-ppt.js | BARU | ekspor PPT Monitoring 4DX |
| row-ppt.js | TIMPA | ekspor PPT Paparan ROW + kerangka paparan bersama (dipakai juga slide ROW di PPT FGTM) |
| fgtm-ppt.js | BARU | sub menu & ekspor PPT Evaluasi FGTM mingguan |
| fgtm-template.js | BARU | template PPT Evaluasi FGTM (base64), dimuat hanya saat unduh |
| wp-ppt.js | BARU | ekspor PPT Paparan Realisasi Workplan (perlu row-ppt.js) |
| fdx-template.js | BARU | template PPT (cover & header) dikemas base64, dimuat hanya saat Unduh PPT |

File lain di repo (ppt-template.pptx, rabas.js, aset_jaringan.js, dll.) TIDAK perlu diubah.

## Cara upload
1. Ekstrak ZIP ini.
2. GitHub → buka repo → **Add file → Upload files** → seret 13 file di atas (tanpa folder) ke ROOT repo.
3. Isi pesan commit, mis. "Sub menu PPT Evaluasi FGTM 16 Nov 2026" → **Commit changes** ke branch main.
4. Tunggu ±1–2 menit hingga GitHub Pages selesai deploy, lalu buka situs dengan **Ctrl+F5**.

## Uji setelah deploy
- Menu **Gangguan → PPT Evaluasi FGTM** → pilih Bulan & Minggu → **⤓ Download PPT Evaluasi FGTM** → file "Evaluasi FGTM M<minggu> <Bulan> 2026 - UP3 Sorong.pptx".
- Menu **Realisasi Workplan** → (opsional) pilih Bulan → **⤓ Unduh PPT** → file "Paparan Realisasi Workplan UP3 Sorong s.d <Bulan> 2026.pptx".
- Menu **Monitoring AO** → **⤓ Unduh PPT** → file "AO_M<minggu>_<Bulan>_2026.pptx".
- Menu **Monitoring 4DX** → pilih Bulan → **⤓ Unduh PPT** → file "Monitoring 4DX - WIG & Workplan HAR UP3 Sorong s.d <Bulan> 2026.pptx".
- Menu **ROW** → (opsional) pilih bulan → **⤓ Unduh PPT** → file "Paparan Realisasi ROW UP3 Sorong s.d <Bulan> 2026.pptx".

Catatan: fitur Unduh PPT memerlukan koneksi internet (memuat JSZip dari CDN dan data dari Google Spreadsheet).
