# Dashboard Monitoring FGTM — PLN UP3 Sorong

Dashboard statis (HTML + JavaScript) untuk monitoring:

- **Gangguan** — gangguan penyulang / recloser / PMCB jaringan tegangan menengah, termasuk grafik penurunan gangguan bulanan (MoM) & evaluasi per ULP.
- **Pemeliharaan** — realisasi pekerjaan pemeliharaan distribusi per ULP.
- **ROW** — data aset jaringan distribusi + realisasi Rabas / Tebang per ULP, per bulan, dan per mitra pelaksana.

## Realtime — bagaimana caranya

Semua data ditarik **langsung dari Google Spreadsheet di sisi browser** (published CSV). Artinya:

- Begitu di-hosting, dashboard **selalu menampilkan data terbaru** dari spreadsheet — tidak perlu build ulang atau upload ulang data.
- Halaman **auto-refresh tiap 5 menit** dan langsung menyegarkan data saat tab kembali dibuka, jadi tampil realtime tanpa reload manual.
- Bila spreadsheet tidak terjangkau (offline/CORS), dashboard memakai snapshot data yang tertanam di file sebagai cadangan.

Untuk memperbarui data: cukup ubah isi Google Spreadsheet (pastikan tab tetap *Publish to web* format CSV). Perubahan muncul otomatis di dashboard.

## Cara deploy ke GitHub Pages

### Cara cepat (manual upload)

1. Buat repository baru (Public) di GitHub, beri nama `main` sebagai branch default.
2. **Add file → Upload files** → unggah **seluruh isi folder ini** (`index.html`, folder `js/`, `.nojekyll`, dan folder `.github/`). Pastikan `index.html` berada di akar repo.
3. **Commit changes**.
4. **Settings → Pages** → Source: **GitHub Actions** (bukan "Deploy from a branch").
5. Tunggu ±1 menit; buka tab **Actions** untuk melihat status deploy. Link publik muncul di **Settings → Pages**: `https://<username>.github.io/<nama-repo>/`.

### Deploy otomatis (CI/CD)

File `.github/workflows/deploy.yml` sudah disertakan. Setiap kali Anda **push / commit perubahan** ke branch `main`, GitHub Actions otomatis men-deploy ulang situs ke Pages. Tidak perlu langkah manual lagi setelah setup awal.

> Catatan: karena data realtime berasal dari spreadsheet, Anda **tidak perlu** push apa pun untuk memperbarui data — push hanya diperlukan bila mengubah kode/tampilan dashboard.

## Struktur

```
index.html                     Halaman utama dashboard (tab Gangguan / Pemeliharaan / ROW)
js/                            Modul data & render (data.js, pemeliharaan.js, aset_jaringan.js, rabas.js, charts.js, app.js, dll)
.nojekyll                      Menonaktifkan pemrosesan Jekyll di GitHub Pages
.github/workflows/deploy.yml   Workflow deploy otomatis ke GitHub Pages
```
