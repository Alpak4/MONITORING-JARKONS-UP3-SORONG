// Data Monitoring Pekerjaan AO 2026 — UP3 Sorong
// Sumber: Spreadsheet "Monitoring Pekerjaan AO 2026.xlsx" — sheet MONIT AO MURNI 2026 (blok DIS / SKKO Pemeliharaan Sorong)
window.AO = {
  unit: "UP3 Sorong",
  paket: "SKKO/PEMELIHARAAN/SOR/2026",
  jobs: [
    { no:1,  prk:"PRK.7601.26.09.03.01.009", nama:"PDKB Operasional",                              skao:769438000,  terkontrak:759932895, tagihan:23784099,  terbayar:0,        sisa:9505105 },
    { no:2,  prk:"PRK.7601.26.09.03.01.010", nama:"PDKB Operasional (Cash Card BBM)",                skao:65531866,   terkontrak:0,         tagihan:0,         terbayar:0,        sisa:65531866 },
    { no:3,  prk:"PRK.7601.26.09.03.01.011", nama:"Pengujian & Kalibrasi PDKB",                      skao:431697000,  terkontrak:389645520, tagihan:99307260,  terbayar:191031000, sisa:42051480 },
    { no:4,  prk:"PRK.7601.26.09.03.01.013", nama:"Operasional & Perjalanan Pemeliharaan",           skao:679078020,  terkontrak:253688280, tagihan:0,         terbayar:253688280, sisa:425389740 },
    { no:5,  prk:"PRK.7601.26.09.03.02.014", nama:"Gudang & Logistik Distribusi",                    skao:340584685,  terkontrak:716707500, tagihan:166821000, terbayar:100732500, sisa:-376122815 },
    { no:6,  prk:"PRK.7601.26.09.03.02.015", nama:"Kerja Sama & PPK",                                skao:266874185,  terkontrak:210103189, tagihan:210103189, terbayar:0,        sisa:56770996 },
    { no:7,  prk:"PRK.7601.26.09.03.01.017", nama:"Peremajaan Peralatan Pendukung Operasi",          skao:236319000,  terkontrak:236319000, tagihan:0,         terbayar:0,        sisa:0 },
    { no:8,  prk:"PRK.7601.26.09.03.01.018", nama:"Pemeliharaan Preventif JTM",                      skao:4637969284, terkontrak:5833885054, tagihan:761994032, terbayar:414859329, sisa:-1195915770 },
    { no:9,  prk:"PRK.7601.26.09.03.01.019", nama:"Pemeliharaan SKTM",                                skao:382724100,  terkontrak:84735000,  tagihan:0,         terbayar:0,        sisa:297989100 },
    { no:10, prk:"PRK.7601.26.09.03.01.020", nama:"Pemeliharaan Preventif Gardu",                     skao:687888519,  terkontrak:527954000, tagihan:0,         terbayar:0,        sisa:159934519 },
    { no:11, prk:"PRK.7601.26.09.03.01.021", nama:"Pemeliharaan Preventif Trafo Distribusi",          skao:541364538,  terkontrak:344142846, tagihan:0,         terbayar:344142846, sisa:197221692 },
    { no:12, prk:"PRK.7601.26.09.03.01.022", nama:"Manajemen Trafo & Beban",                          skao:271330831,  terkontrak:188700250, tagihan:0,         terbayar:0,        sisa:82630581 },
    { no:13, prk:"PRK.7601.26.09.03.01.023", nama:"Pemeliharaan Preventif JTR",                       skao:177123639,  terkontrak:177123639, tagihan:177123639, terbayar:0,        sisa:0 },
    { no:14, prk:"PRK.7601.26.09.03.01.026", nama:"Peralatan, Material & Fast Moving",                skao:359800395,  terkontrak:147075000, tagihan:0,         terbayar:147075000, sisa:212725395 }
  ],
  totalRow: { skao:9847724062, terkontrak:9870012173, tagihan:1439133219, terbayar:1451528955, sisa:-22288111 },

  // ---------- Live loader dari Google Spreadsheet ----------
  source: "snapshot",
  LIVE_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRiWw9rjj1lP-4KIeb_t1z8Ol7JfJIRRogFkhBcrXzzt55fgR4gy0GMJSCLn4y0Xg/pub?output=csv",

  _parseCSV: function (text) {
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else {
        if (c === '"') q = true;
        else if (c === ",") { row.push(f); f = ""; }
        else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
        else if (c === "\r") { /* skip */ }
        else f += c;
      }
    }
    if (f.length || row.length) { row.push(f); rows.push(row); }
    return rows;
  },

  _num: function (v) {
    if (v == null) return 0;
    let s = String(v).replace(/[^0-9,.\-]/g, "").trim();
    if (!s || s === "-") return 0;
    const neg = s[0] === "-";
    s = s.replace(/-/g, "");
    if (s.indexOf(",") !== -1) {
      // koma = desimal, titik = pemisah ribuan
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      // hanya titik = pemisah ribuan (angka Rupiah bulat)
      s = s.replace(/\./g, "");
    }
    const n = parseFloat(s);
    if (isNaN(n)) return 0;
    return Math.round(neg ? -n : n);
  },

  _process: function (rows) {
    // Cari header blok DIS: baris yang memuat "SKAO 2026" & "Terkontrak"
    let hi = -1;
    for (let i = 0; i < rows.length; i++) {
      const line = rows[i].join("|").toLowerCase();
      if (line.indexOf("skao 2026") !== -1 && line.indexOf("terkontrak") !== -1) { hi = i; break; }
    }
    if (hi === -1) return null;
    // Kolom tetap sesuai layout blok DIS:
    // 3=Jenis Kegiatan, 4=No PRK, 7=SKAO Total, 8=Terkontrak, 10=Tagihan, 11=Terbayar, 13=Sisa
    const C = { nama: 3, prk: 4, skao: 7, kontrak: 8, tagihan: 10, bayar: 11, sisa: 13 };
    // Baris ringkasan unit (UP3 Sorong) = baris pertama setelah header yang kolom Unit-nya terisi
    let totalRow = null, start = hi + 1;
    for (let i = hi + 1; i < Math.min(hi + 5, rows.length); i++) {
      const r = rows[i];
      const unit = (r[2] || "").trim();
      const sub = (r[5] || "").toLowerCase();
      if (sub.indexOf("material") !== -1) continue; // baris sub-header Material/Jasa/Total
      if (/up3/i.test(unit) || (this._num(r[C.skao]) > 0 && !(r[C.prk] || "").trim())) {
        totalRow = {
          skao: this._num(r[C.skao]), terkontrak: this._num(r[C.kontrak]),
          tagihan: this._num(r[C.tagihan]), terbayar: this._num(r[C.bayar]), sisa: this._num(r[C.sisa])
        };
        start = i + 1; break;
      }
    }

    const jobs = [];
    let no = 0;
    for (let i = start; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const nama = (r[C.nama] || "").trim();
      const prk = (r[C.prk] || "").trim();
      if (!nama && !prk) break; // akhir blok
      const skao = this._num(r[C.skao]);
      const terkontrak = this._num(r[C.kontrak]);
      const tagihan = this._num(r[C.tagihan]);
      const terbayar = this._num(r[C.bayar]);
      const sisa = this._num(r[C.sisa]);
      no++;
      jobs.push({ no, prk, nama: nama || prk, skao, terkontrak, tagihan, terbayar, sisa });
    }
    if (!jobs.length) return null;
    if (!totalRow) {
      totalRow = jobs.reduce((a, j) => ({
        skao: a.skao + j.skao, terkontrak: a.terkontrak + j.terkontrak,
        tagihan: a.tagihan + j.tagihan, terbayar: a.terbayar + j.terbayar, sisa: a.sisa + j.sisa
      }), { skao: 0, terkontrak: 0, tagihan: 0, terbayar: 0, sisa: 0 });
    }
    return { jobs, totalRow };
  },

  load: function () {
    if (this._p) return this._p;
    const self = this;
    this._p = (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(self.LIVE_URL, { signal: ctrl.signal, mode: "cors" });
        clearTimeout(t);
        if (res.ok) {
          const body = await res.text();
          if (body && body.length > 100 && body.indexOf(",") !== -1) {
            const out = self._process(self._parseCSV(body));
            if (out) { self.jobs = out.jobs; self.totalRow = out.totalRow; self.source = "live"; }
          }
        }
      } catch (e) { /* fallback snapshot */ }
      return self;
    })();
    return this._p;
  }
};
