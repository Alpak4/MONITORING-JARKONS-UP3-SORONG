// Data Monitoring Pekerjaan AO 2026 — UP3 Sorong
// Sumber: Google Spreadsheet (3 sheet): Rekap AO (DIS + UID + Hutang Usaha), Detail Kontrak, Status Pekerjaan
window.AO = {
  unit: "UP3 Sorong",
  paket: "SKKO/PEMELIHARAAN/SOR/2026",
  source: "snapshot",
  BASE: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRiWw9rjj1lP-4KIeb_t1z8Ol7JfJIRRogFkhBcrXzzt55fgR4gy0GMJSCLn4y0Xg/",
  GIDS: { rekap: "248142828", kontrak: "1960741060", status: "1356414429" },

  _parseCSV: function (text) {
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f.length || row.length) { row.push(f); rows.push(row); }
    return rows;
  },
  _num: function (v) {
    if (v == null) return 0;
    let s = String(v).replace(/[^0-9,.\-]/g, "").trim();
    if (!s || /^-+$/.test(s)) return 0;
    const neg = s[0] === "-"; s = s.replace(/-/g, "");
    s = s.indexOf(",") !== -1 ? s.replace(/\./g, "").replace(",", ".") : s.replace(/\./g, "");
    const n = parseFloat(s); if (isNaN(n)) return 0;
    return Math.round(neg ? -n : n);
  },
  _pct: function (v) {
    const s = String(v || "").trim(); if (!s || s.indexOf("#") !== -1) return null;
    const n = parseFloat(s.replace("%", "").replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  },
  _date: function (v) {
    const M = { januari:0, februari:1, maret:2, april:3, mei:4, juni:5, juli:6, agustus:7, september:8, oktober:9, november:10, desember:11 };
    const m = String(v || "").toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
    if (!m || M[m[2]] == null) return null;
    const d = new Date(+m[3], M[m[2]], +m[1]);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  },
  _t: s => String(s || "").replace(/\s+/g, " ").trim(),

  _procRekap: function (rows) {
    const t = this._t, n = this._num.bind(this), out = { jobs: [], totalRow: null, uid: [], uidTotal: null, hutang: [] };
    // Blok DIS (SKAO UP3 Sorong)
    let hi = rows.findIndex(r => { const l = r.join("|").toLowerCase(); return l.indexOf("skao 2026") !== -1 && l.indexOf("terkontrak") !== -1; });
    if (hi !== -1) {
      for (let i = hi + 1; i < rows.length; i++) {
        const r = rows[i]; const unit = t(r[2]), nama = t(r[3]), prk = t(r[4]);
        if (/material/i.test(t(r[5])) && !prk) continue;
        if (!out.totalRow && /up3/i.test(unit)) {
          out.totalRow = { skao: n(r[7]), lelang: n(r[8]), terkontrak: n(r[9]), tagihan: n(r[11]), terbayar: n(r[12]), sisa: n(r[14]), material: n(r[5]), jasa: n(r[6]) };
          continue;
        }
        if (!nama && !prk) { if (out.jobs.length) break; else continue; }
        out.jobs.push({ no: out.jobs.length + 1, prk, nama: nama || prk, material: n(r[5]), jasa: n(r[6]), skao: n(r[7]), lelang: n(r[8]), terkontrak: n(r[9]), tagihan: n(r[11]), terbayar: n(r[12]), sisa: n(r[14]), ket: t(r[15]) });
      }
    }
    // Blok UID: Nilai vs Rekomposisi
    const ui = rows.findIndex(r => r.join("|").toLowerCase().indexOf("rekomposisi") !== -1);
    if (ui !== -1) {
      let i = ui + 1;
      for (; i < rows.length; i++) {
        const r = rows[i]; const nama = t(r[3]);
        if (!t(r[1]) || !nama) break;
        out.uid.push({ no: +t(r[1]), prk: t(r[2]), nama, nilai: n(r[4]), rekomposisi: n(r[5]), gap: n(r[6]), catatan: t(r[7]), usulan70: n(r[9]), ren70: n(r[10]), hutang: n(r[12]) });
      }
      for (; i < Math.min(i + 4, rows.length); i++) { const r = rows[i]; if (n(r[4]) > 0) { out.uidTotal = { nilai: n(r[4]), rekomposisi: n(r[5]), gap: n(r[6]), usulan70: n(r[9]), ren70: n(r[10]), hutang: n(r[12]) }; break; } }
    }
    // Blok Hutang Usaha per UP3 (kolom 17–21)
    rows.forEach(r => {
      const u = t(r[17]);
      if (/^(up3|tnd|total)/i.test(u)) out.hutang.push({ unit: u, terkontrak: n(r[18]), terbayar: n(r[19]), belum: n(r[21]) });
    });
    return out;
  },

  _procKontrak: function (rows) {
    const t = this._t, n = this._num.bind(this);
    const hi = rows.findIndex(r => { const l = r.join("|").toLowerCase(); return l.indexOf("pelaksana") !== -1 && l.indexOf("nilai kontrak") !== -1; });
    if (hi === -1) return [];
    const list = [];
    for (let i = hi + 1; i < rows.length; i++) {
      const r = rows[i]; const uraian = t(r[5]);
      if (!uraian) continue;
      list.push({
        bidang: t(r[0]), unit: t(r[1]), prk: t(r[2]), noKontrak: t(r[3]), mitra: t(r[4]), uraian,
        mulai: this._date(r[6]), akhir: this._date(r[7]), volume: t(r[8]), satuan: t(r[9]),
        lelang: n(r[10]), nilai: n(r[11]), progres: n(r[12]), tagihan: n(r[13]), outstanding: n(r[14]), terbayar: n(r[15]),
        fisik: this._pct(r[16]), ket: t(r[18]), catatan: t(r[19])
      });
    }
    return list;
  },

  _procStatus: function (rows) {
    const t = this._t;
    const hi = rows.findIndex(r => r.join("|").toLowerCase().indexOf("komitmen") !== -1);
    if (hi === -1) return [];
    const list = [];
    for (let i = hi + 1; i < rows.length; i++) {
      const r = rows[i]; const uraian = t(r[2]);
      if (!uraian) continue;
      list.push({ mitra: t(r[1]), uraian, status: t(r[3]), perjanjian: t(r[4]), ket: t(r[5]), komitmen: t(r[6]) });
    }
    return list;
  },

  _merge: function (kontrak, status) {
    const key = s => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const used = new Set();
    return kontrak.map((k, idx) => {
      let s = status[idx] && key(status[idx].uraian) === key(k.uraian) ? status[idx] : null;
      if (s) used.add(idx);
      else { const j = status.findIndex((x, xi) => !used.has(xi) && key(x.uraian) === key(k.uraian)); if (j !== -1) { s = status[j]; used.add(j); } }
      s = s || {};
      const ket = k.ket || s.ket || "", com = s.komitmen || k.catatan || "";
      let tahap;
      if (k.terbayar > 0 || /sudah terbayar/i.test(ket)) tahap = "Terbayar";
      else if (k.tagihan > 0 || /tagihan/i.test(ket)) tahap = "Proses Tagihan";
      else if (k.nilai > 0) tahap = "Pelaksanaan";
      else tahap = "Pengadaan";
      const st = s.status || (tahap === "Terbayar" ? "Selesai" : tahap === "Pengadaan" ? "Belum Mulai" : "On Progres");
      let fisik = k.fisik;
      if (fisik == null) fisik = (st === "Selesai" || tahap === "Terbayar") ? 100 : 0;
      return Object.assign({}, k, { id: idx + 1, mitra: k.mitra || s.mitra || "", status: st, perjanjian: s.perjanjian || (k.nilai > 0 ? "" : "PENGADAAN"), ket, komitmen: com, tahap, fisik, risiko: /tidak bisa/i.test(com) });
    });
  },

  load: function () {
    if (this._p) return this._p;
    const self = this;
    const get = async gid => {
      const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 9000);
      const res = await fetch(self.BASE + "pub?gid=" + gid + "&single=true&output=csv", { signal: ctrl.signal });
      clearTimeout(tm); if (!res.ok) throw new Error(res.status);
      return self._parseCSV(await res.text());
    };
    this._p = (async () => {
      try {
        const [a, b, c] = await Promise.all([get(self.GIDS.rekap), get(self.GIDS.kontrak), get(self.GIDS.status)]);
        const rk = self._procRekap(a); const contracts = self._merge(self._procKontrak(b), self._procStatus(c));
        if (rk.jobs.length && contracts.length) {
          Object.assign(self, rk, { contracts, source: "live" });
        }
      } catch (e) { /* tetap snapshot */ }
      return self;
    })();
    return this._p;
  }
};
