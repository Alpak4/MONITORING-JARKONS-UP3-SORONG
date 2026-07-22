// Rekap Realisasi ROW 2026 — Rabas (kms) & Tebang (btg) per penyulang, dirinci per BULAN.
// Sumber: tab ROW Spreadsheet (gid=737603112). Kolom: C=ULP D=PENYULANG F=TANGGAL H=RABAS(KMS) L=TEBANG(BTG).
// Coba live-fetch & agregasi per bulan; fallback ke SNAPSHOT_M (snapshot bulanan nyata Jan–Jun 2026).
(function () {
  const LIVE_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3U0PZpBySh-ycTwgZQyH5nrTJHXBJW2jIJWyxzoEQNX3GT7HHZizm-7j2ZxP-yzTVrnuyf-WeEIbk/pub?gid=737603112&single=true&output=csv";

  // Snapshot per (ULP, penyulang): k = {indexBulan: kms}, t = {indexBulan: btg}. Bulan 0=Jan … 11=Des.
  const SNAPSHOT_M = [
    { ulp: "AIMAS", pny: "ACC", k: {1:4.85,2:4.3,3:7.2,4:4.5,5:5}, t: {1:42,2:75,3:8,4:1,5:8} },
    { ulp: "AIMAS", pny: "ACC DAN KLAMONO", k: {5:0.9}, t: {5:0} },
    { ulp: "AIMAS", pny: "AIMAS", k: {2:1.1,3:5.6,4:3.6}, t: {2:16,3:10,4:3} },
    { ulp: "AIMAS", pny: "EXPRESS HOTEL", k: {1:1.15}, t: {1:38} },
    { ulp: "AIMAS", pny: "EXPRESS KATAPOP", k: {2:2.8,3:1.8}, t: {2:31,3:11} },
    { ulp: "AIMAS", pny: "EXPRESS KLALIN", k: {1:0.65}, t: {1:9} },
    { ulp: "AIMAS", pny: "EXPRESS KLASAMAN", k: {1:3.3,2:3.6,3:2.5,4:4.55,5:0.55}, t: {1:9,2:23,3:6,4:19,5:5} },
    { ulp: "AIMAS", pny: "EXRESS KATAPOP", k: {0:0.25,1:0.7,2:1.35,5:1.7}, t: {0:5,1:3,2:0,5:8} },
    { ulp: "AIMAS", pny: "FLAMBOYAN", k: {0:0.3,2:1.25,3:1.3,5:2.55}, t: {0:5,2:8,3:20,5:0} },
    { ulp: "AIMAS", pny: "HOTEL", k: {2:0.75}, t: {2:1} },
    { ulp: "AIMAS", pny: "INTERKONEKSI ROMEO 1", k: {3:2.25}, t: {3:0} },
    { ulp: "AIMAS", pny: "KATIMIN", k: {0:0.1,1:0.3,2:7,3:14.85,4:2.4,5:6.6}, t: {0:26,1:19,2:61,3:70,4:0,5:34} },
    { ulp: "AIMAS", pny: "KLALIN", k: {1:1.8,2:4.85,3:1.9,4:2.75,5:1}, t: {1:10,2:23,3:6,4:8,5:10} },
    { ulp: "AIMAS", pny: "KLAMONO", k: {1:8.75,2:11.95,3:13.75,4:11.65,5:8.4}, t: {1:15,2:98,3:35,4:22,5:23} },
    { ulp: "AIMAS", pny: "MAKBALIN", k: {1:1.6,2:2.4,3:3.4}, t: {1:4,2:3,3:9} },
    { ulp: "AIMAS", pny: "MARIAT", k: {1:0.8}, t: {1:1} },
    { ulp: "AIMAS", pny: "MARINIR", k: {4:0.35}, t: {4:5} },
    { ulp: "AIMAS", pny: "MODAN", k: {3:2.3,5:2.2}, t: {3:0,5:0} },
    { ulp: "AIMAS", pny: "MOSWAREN", k: {1:0.7}, t: {1:15} },
    { ulp: "AIMAS", pny: "PAWBILI", k: {2:2.8,3:1.3,4:0.75,5:0.55}, t: {2:3,3:0,4:0,5:6} },
    { ulp: "AIMAS", pny: "POLRES AIMAS", k: {2:0.4,3:2.6}, t: {2:10,3:6} },
    { ulp: "SORONG KOTA", pny: "ACC", k: {0:1.75}, t: {0:41} },
    { ulp: "SORONG KOTA", pny: "BATALYON", k: {2:0.1}, t: {2:3} },
    { ulp: "SORONG KOTA", pny: "BOSWESEN", k: {1:0.2,2:0.9,3:0.55,4:0.25}, t: {1:1,2:4,3:8,4:0} },
    { ulp: "SORONG KOTA", pny: "ELANG", k: {0:0.05,1:0.3,2:0.55,3:1.3,4:2.25,5:0.35}, t: {0:0,1:3,2:13,3:1,4:37,5:2} },
    { ulp: "SORONG KOTA", pny: "EXPRESS KLADEMAK", k: {2:0.75,4:0.1}, t: {2:8,4:0} },
    { ulp: "SORONG KOTA", pny: "EXPRESS KLASAMAN", k: {1:0.3}, t: {1:0} },
    { ulp: "SORONG KOTA", pny: "EXPRESS RAMAYANA", k: {1:0.2}, t: {1:1} },
    { ulp: "SORONG KOTA", pny: "EXPRESS SORONG 1", k: {0:0.5,1:0.05,3:0.1,4:0.1}, t: {0:1,1:0,3:0,4:0} },
    { ulp: "SORONG KOTA", pny: "EXPRESS SORONG 2", k: {0:0.1,1:0.15}, t: {0:0,1:0} },
    { ulp: "SORONG KOTA", pny: "INTERKONEKSI ROMEO 3", k: {3:0.1}, t: {3:1} },
    { ulp: "SORONG KOTA", pny: "KASUARI", k: {0:0.15,1:0.4,2:0.65,3:0.15,5:0.1}, t: {0:4,1:1,2:2,3:15,5:1} },
    { ulp: "SORONG KOTA", pny: "MAMBRUK", k: {0:0.65,1:1,2:0.75,3:0.35,4:0.3,5:0.1}, t: {0:3,1:2,2:3,3:9,4:0,5:3} },
    { ulp: "SORONG KOTA", pny: "MERPATI", k: {0:0.2,1:1.1,2:0.55,3:0.15,4:0.35}, t: {0:2,1:5,2:2,3:1,4:1} },
    { ulp: "SORONG KOTA", pny: "MOSWAREN", k: {1:0.5}, t: {1:0} },
    { ulp: "SORONG KOTA", pny: "PERKUTUT", k: {1:0.5,2:0.3,3:0.35,4:0.25,5:0.15}, t: {1:2,2:5,3:1,4:0,5:1} },
    { ulp: "SORONG KOTA", pny: "RSK", k: {5:0.05}, t: {5:1} },
    { ulp: "SORONG KOTA", pny: "RUFEI", k: {1:0.1,2:0.7,3:0.55,4:0.15,5:1}, t: {1:2,2:4,3:10,4:1,5:17} },
    { ulp: "SORONG KOTA", pny: "SAOKA", k: {1:0.5,2:1.2,3:0.55,4:0.45}, t: {1:9,2:36,3:1,4:2} },
    { ulp: "SORONG KOTA", pny: "SUDIRMAN", k: {0:0.35,1:1.6,2:0.1,3:0.35,4:0.05}, t: {0:5,1:4,2:1,3:5,4:0} },
    { ulp: "SORONG KOTA", pny: "SYALOM", k: {1:0.6,2:1.45,4:0.1}, t: {1:1,2:2,4:0} },
    { ulp: "SORONG KOTA", pny: "USAHAMINA", k: {0:0.2,1:0.05,2:0.4}, t: {0:0,1:0,2:1} },
    { ulp: "SORONG KOTA", pny: "WALIKOTA", k: {0:0.25,1:0.1,2:0.4,3:1.45,4:0.1,5:0.3}, t: {0:2,1:1,2:2,3:7,4:0,5:1} },
    { ulp: "SORONG KOTA", pny: "YANI", k: {1:1.3,3:0.6,5:0.65}, t: {1:3,3:3,5:5} },
    { ulp: "SORONG KOTA", pny: "YOHAN", k: {2:0.1,5:0.05}, t: {2:0,5:3} },
    { ulp: "TEMINABUAN", pny: "AMPERA", k: {0:5.3,1:17.4,2:8,3:6.2,4:21.45,5:13.15}, t: {0:25,1:121,2:36,3:27,4:98,5:74} },
    { ulp: "TEMINABUAN", pny: "MOSWAREN", k: {0:13.2,1:19.05,2:23.3,3:11.3,4:28.4,5:22}, t: {0:100,1:279,2:281,3:33,4:150,5:174} },
    { ulp: "TEMINABUAN", pny: "SESNA", k: {0:0.55}, t: {0:0} },
    { ulp: "WAISAI", pny: "KOTA", k: {0:0.15,1:2.65,2:1.05,3:0.35,4:0.3,5:0.45}, t: {0:2,1:1,2:5,3:0,4:0,5:0} },
    { ulp: "WAISAI", pny: "PARI", k: {0:0.5,1:0.3,3:2.35,4:0.15,5:0.95}, t: {0:49,1:12,3:68,4:0,5:46} },
    { ulp: "WAISAI", pny: "POLRES WAISAI", k: {0:1.25,1:0.95,2:1.5,3:0.2,4:1.35,5:0.2}, t: {0:12,1:48,2:94,3:6,4:65,5:8} },
  ];

  // Snapshot per (ULP, vendor pelaksana): k = {bulan: kms}, t = {bulan: btg}.
  const VENDOR_M = [
    { ulp: "AIMAS", ven: "PLN NUSA DAYA", k: {0:0.25,3:8.15,4:0.25,5:0.4}, t: {0:5,3:26,4:8,5:19} },
    { ulp: "AIMAS", ven: "PT PIAHAR KENCANA", k: {1:0.7,2:0.4}, t: {1:26,2:50} },
    { ulp: "AIMAS", ven: "PT RAJENDRA BINTANG JAYA", k: {0:0.4,1:23.9,2:44.15,3:52.6,4:30.3,5:29.05}, t: {0:31,1:139,2:302,3:155,4:50,5:75} },
    { ulp: "SORONG KOTA", ven: "PLN NUSA DAYA", k: {0:4.6,1:4.1,2:5.6,3:6.55,4:4.45,5:2.75}, t: {0:58,1:12,2:37,3:62,4:41,5:34} },
    { ulp: "SORONG KOTA", ven: "PT AKA RIFKI PAPUA", k: {1:4.85,2:3.3}, t: {1:23,2:49} },
    { ulp: "TEMINABUAN", ven: "PLN NUSA DAYA", k: {0:19.05,1:27.9,2:14.3,3:14.2,4:27.3,5:22.05}, t: {0:125,1:265,2:18,3:27,4:75,5:137} },
    { ulp: "TEMINABUAN", ven: "PT AKA RIFKI PAPUA", k: {1:4.95,2:17,3:1.6}, t: {1:86,2:299,3:16} },
    { ulp: "TEMINABUAN", ven: "PT PIAHAR KENCANA", k: {1:0.2}, t: {1:35} },
    { ulp: "TEMINABUAN", ven: "PT RAJENDRA BINTANG JAYA", k: {1:3.4,3:1.7,4:22.55,5:13.1}, t: {1:14,3:17,4:173,5:111} },
    { ulp: "WAISAI", ven: "PLN NUSA DAYA", k: {0:1.9,1:3.9,2:2.55,3:2.9,4:1.8,5:1.6}, t: {0:63,1:61,2:99,3:74,4:65,5:54} },
  ];

  const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const MONTHS_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const MON_EN = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };

  function parseCSV(t) {
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else { if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c === "\r") {} else f += c; }
    }
    if (f.length || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function num(s) { if (s == null) return 0; const n = parseFloat(String(s).trim().replace(/\s/g, "").replace(",", ".")); return isNaN(n) ? 0 : n; }
  function monthOf(s) { const m = String(s || "").match(/([A-Za-z]+)\s+\d{4}/); if (!m) return -1; const i = MON_EN[m[1].toLowerCase()]; return i == null ? -1 : i; }
  // "05 January 2026" -> {y,m,d,key}; null bila tak ada hari.
  function dayOf(s) {
    const m = String(s || "").match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (!m) return null;
    const mi = MON_EN[m[2].toLowerCase()]; if (mi == null) return null;
    const d = +m[1], y = +m[3];
    return { y, m: mi, d, key: y + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0") };
  }

  // Agregasi log harian -> per (ULP, penyulang) dengan rincian bulan {k:{m:kms}, t:{m:btg}}.
  // Sekaligus bangun rincian per (ULP, vendor pelaksana) -> simpan di out.vendors.
  function aggregate(text) {
    const rows = parseCSV(text);
    const map = {}, vmap = {}, dmap = {};
    for (let i = 7; i < rows.length; i++) {
      const r = rows[i]; if (!r) continue;
      const ulp = (r[2] || "").trim().replace(/^ULP\s+/i, "");
      const pny = (r[3] || "").trim();
      if (!ulp || !pny) continue;
      const mi = monthOf(r[5]); if (mi < 0) continue;
      const kms = num(r[7]), btg = num(r[11]);
      const key = ulp + "|" + pny;
      if (!map[key]) map[key] = { ulp, pny, k: {}, t: {} };
      map[key].k[mi] = +(((map[key].k[mi] || 0) + kms)).toFixed(2);
      map[key].t[mi] = (map[key].t[mi] || 0) + btg;
      const ven = (r[4] || "").trim();
      if (ven) {
        const vk = ulp + "|" + ven;
        if (!vmap[vk]) vmap[vk] = { ulp, ven, k: {}, t: {} };
        vmap[vk].k[mi] = +(((vmap[vk].k[mi] || 0) + kms)).toFixed(2);
        vmap[vk].t[mi] = (vmap[vk].t[mi] || 0) + btg;
      }
      // rincian harian per (tanggal, ULP)
      const dy = dayOf(r[5]);
      if (dy) {
        const dk = dy.key + "|" + ulp;
        if (!dmap[dk]) dmap[dk] = { y: dy.y, m: dy.m, d: dy.d, key: dy.key, ulp, kms: 0, btg: 0 };
        dmap[dk].kms = +(((dmap[dk].kms) + kms)).toFixed(2);
        dmap[dk].btg += btg;
      }
    }
    const out = Object.values(map);
    out.vendors = Object.values(vmap);
    out.daily = Object.values(dmap);
    return out;
  }

  // --- pencocokan nama penyulang ke daftar aset ---
  function ed(a, b) {
    const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i].concat(Array(n).fill(0)));
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function norm(ulp, p) {
    p = p.toUpperCase().trim().replace(/EXRESS/g, "EXP").replace(/EXPRESS/g, "EXP");
    const u = ulp.toUpperCase();
    if (p.endsWith(" " + u)) p = p.slice(0, -(" " + u).length).trim();
    return p.replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  }

  // Jumlahkan k/t sebuah record untuk bulan terpilih ("all" atau 0..11).
  function sumRec(rec, month) {
    let kms = 0, btg = 0;
    if (month === "all" || month == null) {
      Object.keys(rec.k).forEach((m) => kms += rec.k[m]);
      Object.keys(rec.t).forEach((m) => btg += rec.t[m]);
    } else {
      kms = rec.k[month] || 0; btg = rec.t[month] || 0;
    }
    return { kms: +kms.toFixed(2), btg };
  }

  window.Rabas = {
    records: null,        // [{ulp,pny,k,t}]
    vendorRecords: null,  // [{ulp,ven,k,t}]
    dailyRecords: null,   // [{y,m,d,key,ulp,kms,btg}]
    source: "snapshot",
    month: "all",         // "all" atau 0..11
    MONTHS_ID, MONTHS_LONG,

    parseSnapshot() {
      this.records = SNAPSHOT_M.map((r) => ({ ulp: r.ulp, pny: r.pny, k: Object.assign({}, r.k), t: Object.assign({}, r.t) }));
      this.vendorRecords = VENDOR_M.map((r) => ({ ulp: r.ulp, ven: r.ven, k: Object.assign({}, r.k), t: Object.assign({}, r.t) }));
      this.dailyRecords = [];   // snapshot bulanan tidak menyimpan rincian harian
      return this.records;
    },

    async load() {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(LIVE_URL, { signal: ctrl.signal, mode: "cors" });
        clearTimeout(t);
        if (res.ok) {
          const body = await res.text();
          if (body && body.length > 200) {
            const recs = aggregate(body);
            this.records = recs;
            this.vendorRecords = recs.vendors && recs.vendors.length ? recs.vendors : VENDOR_M;
            this.dailyRecords = recs.daily || [];
            this.source = "live";
            return this.records;
          }
        }
      } catch (e) { /* fallback */ }
      this.parseSnapshot(); this.source = "snapshot"; return this.records;
    },

    // Daftar bulan yang memiliki data (index terurut).
    activeMonths() {
      const recs = this.records || SNAPSHOT_M;
      const set = {};
      recs.forEach((r) => { Object.keys(r.k).forEach((m) => set[m] = 1); Object.keys(r.t).forEach((m) => set[m] = 1); });
      return Object.keys(set).map(Number).sort((a, b) => a - b);
    },

    // Rincian harian per (tanggal × ULP) untuk bulan & ULP terpilih.
    // -> { dates:[{key,y,m,d,cells:{ULP:{kms,btg}}}], ulps:[..] }
    dailyByUlp(ulpNames) {
      const recs = this.dailyRecords || [];
      const month = this.month;
      const want = (ulpNames && ulpNames.length) ? ulpNames.map((x) => x.toUpperCase()) : null;
      const filt = recs.filter((r) =>
        (month === "all" || month == null || r.m === month) &&
        (!want || want.includes(r.ulp.toUpperCase())) &&
        (r.kms > 0 || r.btg > 0)
      );
      const ulpSet = {}, dateMap = {};
      filt.forEach((r) => {
        ulpSet[r.ulp] = 1;
        if (!dateMap[r.key]) dateMap[r.key] = { key: r.key, y: r.y, m: r.m, d: r.d, cells: {} };
        const c = dateMap[r.key].cells[r.ulp] || (dateMap[r.key].cells[r.ulp] = { kms: 0, btg: 0 });
        c.kms = +((c.kms + r.kms)).toFixed(2); c.btg += r.btg;
      });
      const dates = Object.values(dateMap).sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
      return { dates, ulps: Object.keys(ulpSet).sort() };
    },

    // Matriks per ULP: { ULP: [12]{kms,btg} }. + urutan ULP.
    monthlyByUlp() {
      const recs = this.records || SNAPSHOT_M;
      const out = {};
      recs.forEach((r) => {
        if (!out[r.ulp]) out[r.ulp] = Array.from({ length: 12 }, () => ({ kms: 0, btg: 0 }));
        Object.keys(r.k).forEach((m) => out[r.ulp][m].kms += r.k[m]);
        Object.keys(r.t).forEach((m) => out[r.ulp][m].btg += r.t[m]);
      });
      Object.keys(out).forEach((u) => out[u].forEach((c) => c.kms = +c.kms.toFixed(2)));
      return out;
    },

    // Index terhadap daftar aset untuk bulan terpilih: perUlp + perAsset + total.
    indexFor(groups) {
      const recs = this.records || SNAPSHOT_M;
      const month = this.month;
      const perUlp = {}, perAsset = {}, total = { kms: 0, btg: 0 };
      recs.forEach((rec) => {
        const v = sumRec(rec, month);
        if (v.kms === 0 && v.btg === 0) return;
        perUlp[rec.ulp] = perUlp[rec.ulp] || { kms: 0, btg: 0 };
        perUlp[rec.ulp].kms += v.kms; perUlp[rec.ulp].btg += v.btg;
        total.kms += v.kms; total.btg += v.btg;
        const g = groups.find((x) => x.ulp.toUpperCase() === rec.ulp.toUpperCase());
        if (!g) return;
        const rn = norm(rec.ulp, rec.pny);
        let best = null, bd = 99;
        g.items.forEach((it) => { const an = norm(rec.ulp, it.nama); const dist = an === rn ? 0 : ed(an, rn); if (dist < bd) { bd = dist; best = it.nama; } });
        if (bd <= 1) {
          const k = rec.ulp + "|" + best;
          perAsset[k] = perAsset[k] || { kms: 0, btg: 0 };
          perAsset[k].kms += v.kms; perAsset[k].btg += v.btg;
        }
      });
      Object.keys(perUlp).forEach((u) => { perUlp[u].kms = +perUlp[u].kms.toFixed(2); });
      Object.keys(perAsset).forEach((k) => { perAsset[k].kms = +perAsset[k].kms.toFixed(2); });
      total.kms = +total.kms.toFixed(2);
      return { perUlp, perAsset, total };
    },

    // Daftar vendor unik (terurut volume kms desc, semua bulan).
    vendorList() {
      const recs = this.vendorRecords || VENDOR_M;
      const tot = {};
      recs.forEach((r) => { let s = 0; Object.keys(r.k).forEach((m) => s += r.k[m]); tot[r.ven] = (tot[r.ven] || 0) + s; });
      return Object.keys(tot).sort((a, b) => tot[b] - tot[a]);
    },

    // Matriks vendor x ULP untuk bulan terpilih: { ULP: { vendor: {kms,btg} }, _ulps, _vendors, _vendorTotal }.
    vendorByUlp() {
      const recs = this.vendorRecords || VENDOR_M;
      const month = this.month;
      const ulpSet = {}, out = {}, vendorTotal = {};
      const vendors = this.vendorList();
      recs.forEach((rec) => {
        const v = sumRec(rec, month);
        ulpSet[rec.ulp] = 1;
        if (!out[rec.ulp]) out[rec.ulp] = {};
        out[rec.ulp][rec.ven] = { kms: v.kms, btg: v.btg };
        vendorTotal[rec.ven] = vendorTotal[rec.ven] || { kms: 0, btg: 0 };
        vendorTotal[rec.ven].kms += v.kms; vendorTotal[rec.ven].btg += v.btg;
      });
      Object.keys(vendorTotal).forEach((vn) => { vendorTotal[vn].kms = +vendorTotal[vn].kms.toFixed(2); });
      out._ulps = Object.keys(ulpSet).sort();
      out._vendors = vendors;
      out._vendorTotal = vendorTotal;
      return out;
    },
  };
})();
