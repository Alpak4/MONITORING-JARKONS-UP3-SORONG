// Loader & parser data gangguan PLN UP3 Sorong.
// Mencoba live-fetch dari Google Spreadsheet; bila gagal pakai SNAPSHOT_CSV.
(function () {
  const LIVE_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRQuHnmXGnuvlKIlj3LsjesuN_Ihvfy3weMWVeg2ogYJJ-CQ62lf6MvUvautqLDU0DkxyTzytOwix0T/pub?gid=442041781&single=true&output=csv";

  // --- CSV parser (mendukung field ber-quote & koma di dalam quote) ---
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
        else if (c === "\r") { /* skip */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function durToMin(d) {
    if (!d) return null;
    const p = String(d).trim().split(":").map((x) => parseInt(x, 10));
    if (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) return p[0] * 60 + p[1];
    return null;
  }

  function parseDate(s) {
    // DD/MM/YYYY
    if (!s) return null;
    const m = String(s).trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return null;
    return new Date(+m[3], +m[2] - 1, +m[1]);
  }

  // urutan & label penyebab
  const CAUSE_LABELS = {
    "E1": "E1 — Pohon",
    "E2": "E2 — Bencana Alam",
    "E3": "E3 — Pihak Ketiga / Binatang",
    "E4": "E4 — Layang-layang / Umbul-umbul",
    "I1": "I1 — Komponen JTM",
    "I2": "I2 — Peralatan JTM",
    "I3": "I3 — Komponen Gardu",
    "I4": "I4 — Tiang",
    "X": "X — Tidak Ditemukan",
  };

  function causeCode(kelompok) {
    if (!kelompok) return "X";
    const m = String(kelompok).trim().match(/^([EIX]\d?|X)/i);
    if (!m) return "X";
    let code = m[1].toUpperCase();
    if (code === "X") return "X";
    return code;
  }

  // Indikasi proteksi kerja (kolom M): GF / OC / UFR
  function indikasiCode(s) {
    const t = String(s || "").toUpperCase();
    if (/UFR/.test(t)) return "UFR";
    if (/\bGF\b|50G|51G/.test(t)) return "GF";
    if (/\bOC\b|50\/51|\b50\b|\b51\b/.test(t)) return "OC";
    return "";
  }

  function process(rows) {
    // Lewati 2 baris header (baris 0 = nama kolom, baris 1 = "2025")
    const out = [];
    for (let i = 2; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 20) continue;
      const no = (r[0] || "").trim();
      const ulp = (r[2] || "").trim();
      if (!ulp) continue; // baris kosong
      const durasi = (r[10] || "").trim();
      const u5 = (r[11] || "").trim();
      const kelompok = (r[19] || "").trim();
      const code = causeCode(kelompok);
      const tgl = parseDate(r[6]);
      const rec = {
        no: no,
        up3: (r[1] || "").trim(),
        ulp: ulp,
        aset: (r[3] || "").trim(),
        sumber: (r[4] || "").trim(),
        zona: (r[5] || "").trim(),
        tanggal: (r[6] || "").trim(),
        tgl: tgl,
        periode: (r[7] || "").trim(),
        jamTrip: (r[8] || "").trim(),
        jamMasuk: (r[9] || "").trim(),
        durasi: durasi,
        durasiMin: durToMin(durasi),
        u5: u5,
        under5: /bawah/i.test(u5),
        indikasi: (r[12] || "").trim(),
        indikasiKode: indikasiCode(r[12]),
        cuaca: (r[13] || "").trim(),
        kontrol: (r[14] || "").trim(),
        kelompok: kelompok,
        kode: code,
        kodeLabel: CAUSE_LABELS[code] || kelompok,
        detail: (r[20] || "").trim(),
        tindak: (r[21] || "").trim(),
      };
      out.push(rec);
    }
    return out;
  }

  const PERIODE_ORDER = [
    "Januari 2026", "Februari 2026", "Maret 2026", "April 2026", "Mei 2026", "Juni 2026",
    "Juli 2026", "Agustus 2026", "September 2026", "Oktober 2026", "November 2026", "Desember 2026",
  ];

  window.GangguanData = {
    CAUSE_LABELS,
    PERIODE_ORDER,
    INDIKASI_ORDER: ["GF", "OC", "UFR"],
    INDIKASI_LABELS: { GF: "GF (Ground Fault · 50G/51G)", OC: "OC (Over Current · 50/51)", UFR: "UFR (Under Frequency)" },
    records: [],
    source: "snapshot",
    parseSnapshot() {
      this.records = process(parseCSV(window.SNAPSHOT_CSV));
      return this.records;
    },
    async load() {
      if (this._p) return this._p;
      return this.reload();
    },
    async reload() {
      this._p = (async () => {
      let text = null;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(LIVE_URL, { signal: ctrl.signal, mode: "cors" });
        clearTimeout(t);
        if (res.ok) {
          const body = await res.text();
          if (body && body.length > 200 && body.indexOf(",") !== -1) {
            text = body;
            this.source = "live";
          }
        }
      } catch (e) {
        // fallback ke snapshot
      }
      if (!text) {
        text = window.SNAPSHOT_CSV;
        this.source = "snapshot";
      }
      this.records = process(parseCSV(text));
      return this.records;
      })();
      return this._p;
    },
  };
})();
