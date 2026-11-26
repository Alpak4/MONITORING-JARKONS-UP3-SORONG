# Paket Update GitHub — Dashboard Gangguan PLN UP3 Sorong
Tanggal: 26 November 2026 · Versi cache terbaru: ?v=20261126c

## Pembaruan 26 November 2026 (rev. d) — **Backup Data per Jam** di menu Kondisi Sistem UP3
- Backup otomatis tiap jam (selama dashboard terbuka, menu apa pun) dan setiap kali data penormalan diubah; isi slot jam = data terakhir pada jam itu.
  Disimpan di browser (IndexedDB), retensi 30 hari; foto disimpan sekali walau dipakai di banyak jam.
- Pilih **Dari jam – Sampai jam** → **⤓ Unduh backup (ZIP)**: Rekap per jam.csv (Excel), JSON tiap jam, dan (opsional) PPT tiap jam.
- Daftar backup per tanggal: tiap jam bisa diunduh **PPT** / **JSON** atau **Pulihkan** (dengan tombol Batalkan pemulihan).
- File berubah: index.html, kondisi.js, ppt-export.js.

## Pembaruan 26 November 2026 (rev. c) — Menu **PPT Evaluasi FGTM** berdiri sendiri
- PPT Evaluasi FGTM kini menu utama di menu samping (sebelumnya sub menu di bawah Gangguan), dengan ikon presentasi. Isi & fungsi tidak berubah.
- File berubah: index.html.

## Pembaruan 26 November 2026 (rev. b) — Menu **Kondisi Sistem UP3** = Progres Penormalan Kelistrikan Sistem Sorong
- Isi menu diganti (data evaluasi FGTM sebelumnya dihapus dari menu ini) menjadi papan **Progres Penormalan Kelistrikan Sistem Sorong**
  sesuai PPT "Progress_Penormalan_Kelistrikan_Sorong_Editabel_v3_1":
  - 6 kartu: ULP, Penyulang, Beban (kW), Beban Captive (kW), Trafo, Pelanggan — jumlah terdampak, terdampak (masih padam), sudah nyala, % pulih
  - Engine yang beroperasi: PLTMG MPP, Sewatama, Max Power, Klasaman, Klademak — MW & status per unit (Operasi/Gangguan/Pemeliharaan/Standby, × merah)
  - Daerah/wilayah yang masih terdampak per ULP · Catatan/perkembangan (pembuka + baris otomatis DMP & unit tidak beroperasi + penutup)
  - Dokumentasi progres & perbaikan (maks. 4 foto)
- Data diisi langsung di menu (formulir di bawah papan), tersimpan otomatis di browser; **Simpan/Muat data (JSON)** untuk pindah perangkat;
  **Salin ringkasan WA**; **⤓ Unduh PPT** menghasilkan PPT format yang sama ("Progres Penormalan Kelistrikan Sistem Sorong - <tgl> <jam> WIT.pptx").
- File berubah: index.html, kondisi.js, kondisi-template.js (BARU).

## Pembaruan 19 November 2026 — Filter Mitra & Rentang Tanggal di menu ROW
- Baris filter menu **ROW** kini memiliki **Mitra** (dropdown checklist: kotak cari, centang satu/beberapa mitra, "Semua Mitra" / "Pilih semua" = tanpa filter, tombol menampilkan jumlah mitra terpilih) dan **Tanggal** (dari – s/d) beserta tombol **Reset**.
- Filter berlaku untuk KPI, tren bulanan, matriks ULP × bulan, rekap mitra, rincian harian, **Unduh Excel** dan **Unduh PPT** ROW;
  filter aktif tercantum di bawah baris filter, di judul Excel, dan di cover PPT.
- PPT ROW dengan rentang tanggal: target kumulatif dihitung untuk bulan-bulan dalam rentang; bulan di luar rentang tampil abu-abu.
- File berubah: index.html, rabas.js, aset_jaringan.js, row-ppt.js.

## Pembaruan 16 November 2026 — Sub menu **PPT Evaluasi FGTM**
- Menu samping **PPT Evaluasi FGTM**: pilih Bulan, Minggu (M1 = tgl 1–7 · M2 = 8–14 · M3 = 15–21 · M4 = 22–akhir),
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
| rabas.js | TIMPA | data ROW + filter mitra & rentang tanggal |
| aset_jaringan.js | TIMPA | tampilan filter mitra & tanggal di menu ROW |
| row-ppt.js | TIMPA | ekspor PPT Paparan ROW + kerangka paparan bersama (dipakai juga slide ROW di PPT FGTM) |
| fgtm-ppt.js | TIMPA | sub menu & ekspor PPT Evaluasi FGTM mingguan (+ fungsi hitung untuk menu Kondisi Sistem) |
| kondisi.js | TIMPA | menu Kondisi Sistem UP3 Sorong (progres penormalan) |
| kondisi-template.js | BARU | template PPT Progres Penormalan (base64), dimuat saat unduh |
| fgtm-template.js | BARU | template PPT Evaluasi FGTM (base64), dimuat hanya saat unduh |
| wp-ppt.js | BARU | ekspor PPT Paparan Realisasi Workplan (perlu row-ppt.js) |
| fdx-template.js | BARU | template PPT (cover & header) dikemas base64, dimuat hanya saat Unduh PPT |

File lain di repo (ppt-template.pptx, rabas.js, aset_jaringan.js, dll.) TIDAK perlu diubah.

## Cara upload
1. Ekstrak ZIP ini.
2. GitHub → buka repo → **Add file → Upload files** → seret 18 file di atas (tanpa folder) ke ROOT repo.
3. Isi pesan commit, mis. "Progres Penormalan Sistem Sorong 26 Nov 2026" → **Commit changes** ke branch main.
4. Tunggu ±1–2 menit hingga GitHub Pages selesai deploy, lalu buka situs dengan **Ctrl+F5**.

## Uji setelah deploy
- Menu **Kondisi Sistem UP3** → Backup Data per Jam → pilih rentang jam → **⤓ Unduh backup (ZIP)**.
- Menu **Kondisi Sistem UP3** → ubah angka/status unit → papan berubah → **⤓ Unduh PPT** → file "Progres Penormalan Kelistrikan Sistem Sorong - <tgl> <jam> WIT.pptx".
- Menu **ROW** → pilih **Mitra** dan/atau **Tanggal** → angka KPI, grafik, matriks & rekap mitra berubah sesuai filter → **Reset** mengembalikan semua.
- Menu **PPT Evaluasi FGTM** → pilih Bulan & Minggu → **⤓ Download PPT Evaluasi FGTM** → file "Evaluasi FGTM M<minggu> <Bulan> 2026 - UP3 Sorong.pptx".
- Menu **Realisasi Workplan** → (opsional) pilih Bulan → **⤓ Unduh PPT** → file "Paparan Realisasi Workplan UP3 Sorong s.d <Bulan> 2026.pptx".
- Menu **Monitoring AO** → **⤓ Unduh PPT** → file "AO_M<minggu>_<Bulan>_2026.pptx".
- Menu **Monitoring 4DX** → pilih Bulan → **⤓ Unduh PPT** → file "Monitoring 4DX - WIG & Workplan HAR UP3 Sorong s.d <Bulan> 2026.pptx".
- Menu **ROW** → (opsional) pilih bulan → **⤓ Unduh PPT** → file "Paparan Realisasi ROW UP3 Sorong s.d <Bulan> 2026.pptx".

Catatan: fitur Unduh PPT memerlukan koneksi internet (memuat JSZip dari CDN dan data dari Google Spreadsheet).
