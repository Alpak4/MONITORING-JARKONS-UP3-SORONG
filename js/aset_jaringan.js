// Data Aset Jaringan Distribusi (Penyulang, panjang JTM, jumlah gardu) per ULP.
// Sumber: tab "Aset" Spreadsheet Monitoring FGTM. Coba live-fetch; fallback ke snapshot.
(function () {
  const LIVE_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3U0PZpBySh-ycTwgZQyH5nrTJHXBJW2jIJWyxzoEQNX3GT7HHZizm-7j2ZxP-yzTVrnuyf-WeEIbk/pub?gid=1191520837&single=true&output=csv";

  const SNAPSHOT = `UP3 SORONG,ULP,PENYULANG,,GARDU
UP3 SORONG,ULP SORONG KOTA,SAOKA,"13,65",25
,,RUFEI,"8,57",27
,,BOSWESEN,"11,02",37
,,EXP KLADEMAK,"6,22",0
,,SYALOM,"3,51",39
,,USAHAMINA,"3,33",27
,,KASUARI,"6,37",19
,,YOHAN,"3,1",18
,,WALIKOTA,"4,69",23
,,BATALYON,"5,91",9
,,SUDIRMAN,"4,99",32
,,YANI,"5,51",38
,,RSK,"0,68",2
,,MERPATI,"16,06",37
,,PERKUTUT,"14,95",53
,,MAMBRUK,"20,15",61
,,ELANG,"19,13",65
,,EXP SORONG 1,"6,92",0
,,EXP SORONG 2,"6,78",0
,,Interkoneksi 1,"5,55",0
,,Interkoneksi 2,"5,57",0
,,Interkoneksi 3,"5,57",0
,,EXP KLASAMAN,"8,85",0
,ULP AIMAS,ACC,"34,94",47
,,FLAMBOYAN,"32,12",53
,,POLRES,"3,85",2
,,MARIAT,"11,01",27
,,EXPRESS AIMAS,"2,71",0
,,EXPRESS KLALIN,"5,27",0
,,EXPRESS KLASAMAN,"10,9",0
,,EXPRESS KATAPOP,22,0
,,KLAMONO,"59,74",50
,,AIMAS,"5,19",13
,,MODAN,"8,48",5
,,PASMAR,"2,5",2
,,MAKBALIM,"18,8",27
,,KATIMIN,"75,12",32
,,PAWBILI,"5,55",16
,,KLALIN,"22,62",61
,ULP TEMINABUAN,AMPERA,"175,25",69
,,MOSWAREN,"383,7",140
,,SESNA,"10,4",16
,,DWIKORA,"6,15",16
,ULP WAISAI,PARI,"12,22",17
,,KOTA,"6,135",13
,,POLRES,"19,709",28
,TOTAL,,1121,1146`;

  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else {
        if (c === '"') q = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
        else if (c === "\r") { /* skip */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // "13,65" -> 13.65 ; "1121" -> 1121
  function num(s) {
    if (s == null) return 0;
    const n = parseFloat(String(s).trim().replace(/\s/g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }

  function process(text) {
    const rows = parseCSV(text);
    const groups = [];
    let cur = null, sheetTotal = null;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const ulp = (r[1] || "").trim();
      const nama = (r[2] || "").trim();
      if (ulp.toUpperCase() === "TOTAL") { sheetTotal = { panjang: num(r[3]), gardu: num(r[4]) }; continue; }
      if (ulp) { cur = { ulp: ulp.replace(/^ULP\s+/i, ""), items: [] }; groups.push(cur); }
      if (!nama || !cur) continue;
      cur.items.push({ nama, panjang: num(r[3]), gardu: num(r[4]) });
    }
    groups.forEach((g) => {
      g.penyulang = g.items.length;
      g.panjang = g.items.reduce((s, x) => s + x.panjang, 0);
      g.gardu = g.items.reduce((s, x) => s + x.gardu, 0);
    });
    const total = {
      ulp: groups.length,
      penyulang: groups.reduce((s, g) => s + g.penyulang, 0),
      panjang: groups.reduce((s, g) => s + g.panjang, 0),
      gardu: groups.reduce((s, g) => s + g.gardu, 0),
      sheet: sheetTotal,
    };
    return { groups, total };
  }

  window.AsetJaringan = {
    data: null,
    source: "snapshot",
    ulps: [],
    parseSnapshot() { this.data = process(SNAPSHOT); return this.data; },
    async load() {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(LIVE_URL, { signal: ctrl.signal, mode: "cors" });
        clearTimeout(t);
        if (res.ok) {
          const body = await res.text();
          if (body && body.length > 100 && body.indexOf(",") !== -1) {
            this.data = process(body); this.source = "live"; return this.data;
          }
        }
      } catch (e) { /* fallback */ }
      this.data = process(SNAPSHOT); this.source = "snapshot"; return this.data;
    },
  };

  // ---------- Render ----------
  const ULP_TONE = { "SORONG KOTA": "blue", "AIMAS": "teal", "TEMINABUAN": "amber", "WAISAI": "green" };
  const fmt = (n, d) => Number(n).toLocaleString("id-ID", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  let rabasTrendChart = null;
  let vendorChart = null;
  window.resizeRabasTrend = function () {
    [["#rabas-trend", rabasTrendChart], ["#vendor-chart", vendorChart]].forEach(function (pair) {
      const cv = document.querySelector(pair[0]);
      const ch = cv && window.Chart && window.Chart.getChart ? window.Chart.getChart(cv) : pair[1];
      if (ch) { try { ch.resize(); } catch (e) {} }
    });
  };

  // Plugin: gambar nilai di atas/di dalam bar.
  const valueLabels = {
    id: "valueLabels",
    afterDatasetsDraw: function (chart, args, opts) {
      const ctx = chart.ctx;
      const fmtFn = (opts && opts.fmt) || function (v) { return v; };
      const min = (opts && opts.min) || 0;
      chart.data.datasets.forEach(function (ds, di) {
        const meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach(function (el, i) {
          const val = ds.data[i];
          if (val == null || val <= min) return;
          ctx.save();
          ctx.font = "700 10px 'Plus Jakarta Sans',sans-serif";
          ctx.fillStyle = "#0A2540";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(fmtFn(val), el.x, el.y - 2);
          ctx.restore();
        });
      });
    }
  };

  // Plugin: label nilai pada tiap kelopak rose/polar-area.
  const roseLabels = {
    id: "roseLabels",
    afterDatasetsDraw: function (chart, args, opts) {
      const ctx = chart.ctx;
      const fmtFn = (opts && opts.fmt) || function (v) { return v; };
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data) return;
      meta.data.forEach(function (arc, i) {
        const val = chart.data.datasets[0].data[i];
        if (val == null || val <= 0) return;
        const mid = (arc.startAngle + arc.endAngle) / 2;
        const r = arc.outerRadius + 4;
        const x = arc.x + Math.cos(mid) * r * 0.78;
        const y = arc.y + Math.sin(mid) * r * 0.78;
        ctx.save();
        ctx.font = "800 11px 'Plus Jakarta Sans',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const txt = fmtFn(val);
        const w = ctx.measureText(txt).width;
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.fillRect(x - w / 2 - 4, y - 8, w + 8, 16);
        ctx.fillStyle = "#0A2540";
        ctx.fillText(txt, x, y);
        ctx.restore();
      });
    }
  };
  function monthSub() {
    const m = window.Rabas ? window.Rabas.month : "all";
    return (m === "all" || m == null) ? "ROW 2026 · semua bulan" : "ROW 2026 · " + window.Rabas.MONTHS_LONG[m];
  }

  window.renderAsetJaringan = function () {
    const d = window.AsetJaringan.data;
    if (!d) return;
    const picked = (window.AsetJaringan.ulps && window.AsetJaringan.ulps.length) ? window.AsetJaringan.ulps : null;
    const all = !picked;
    const groups = all ? d.groups : d.groups.filter((g) => picked.includes(g.ulp));
    const t = {
      ulp: groups.length,
      penyulang: groups.reduce((s, g) => s + g.penyulang, 0),
      panjang: groups.reduce((s, g) => s + g.panjang, 0),
      gardu: groups.reduce((s, g) => s + g.gardu, 0),
    };
    // index realisasi ROW (Rabas/Tebang)
    const rx = (window.Rabas && window.Rabas.indexFor) ? window.Rabas.indexFor(d.groups) : { perUlp: {}, perAsset: {}, total: { kms: 0, btg: 0 } };
    const rabasUlp = (u) => rx.perUlp[u] || { kms: 0, btg: 0 };
    const rabasAset = (u, nama) => rx.perAsset[u + "|" + nama] || null;
    const rTot = all ? rx.total : groups.reduce((a, g) => { const ru = rabasUlp(g.ulp); return { kms: a.kms + ru.kms, btg: a.btg + ru.btg }; }, { kms: 0, btg: 0 });
    const selLabel = all ? "Semua ULP" : (picked.length === 1 ? picked[0] : picked.length + " ULP");
    // KPI recap
    const cards = [
      { label: all ? "Jumlah ULP" : "ULP Terpilih", value: all ? fmt(t.ulp) : (picked.length === 1 ? picked[0] : fmt(picked.length)), sub: "unit layanan pelanggan", tone: "navy" },
      { label: "Total Penyulang", value: fmt(t.penyulang), sub: "feeder JTM 20 kV", tone: "blue" },
      { label: "Panjang JTM", value: fmt(t.panjang, 0) + " kms", sub: "total jaringan tegangan menengah", tone: "teal" },
      { label: "Total Gardu Distribusi", value: fmt(t.gardu), sub: "gardu terpasang", tone: "amber" },
      { label: "Realisasi Rabas", value: fmt(rTot.kms, 0) + " kms", sub: monthSub() + " · panjang dirabas", tone: "green" },
      { label: "Realisasi Tebang", value: fmt(rTot.btg), sub: monthSub() + " · batang pohon", tone: "red" },
    ];
    const kw = document.querySelector("#aset-jar-kpi"); if (kw) {
      kw.innerHTML = "";
      cards.forEach((c) => {
        const card = el("div", "kpi kpi--" + c.tone);
        card.innerHTML = `<div class="kpi__label">${c.label}</div><div class="kpi__value">${c.value}</div><div class="kpi__sub">${c.sub}</div>`;
        kw.appendChild(card);
      });
    }
    // Rekap per ULP
    const rb = document.querySelector("#ajr-tbody");
    if (rb) {
      rb.innerHTML = "";
      const maxP = Math.max.apply(null, groups.map((g) => g.panjang).concat([1]));
      groups.forEach((g) => {
        const tone = ULP_TONE[g.ulp.toUpperCase()] || "blue";
        const w = Math.round((g.panjang / maxP) * 100);
        const ru = rabasUlp(g.ulp);
        const tr = el("tr");
        tr.innerHTML = `
          <td><span class="cdot cdot--${tone}"></span><strong>${g.ulp}</strong></td>
          <td class="mono">${fmt(g.penyulang)}</td>
          <td><div class="barcell"><span class="barcell__fill barcell__fill--${tone}" style="width:${w}%"></span></div><span class="barcell__n">${fmt(g.panjang, 2)}</span></td>
          <td class="mono">${fmt(g.gardu)}</td>
          <td class="mono">${fmt(ru.kms, 2)}</td>
          <td class="mono">${fmt(ru.btg)}</td>`;
        rb.appendChild(tr);
      });
      const trt = el("tr", "ajr-total");
      trt.innerHTML = `<td><strong>${all ? "TOTAL UP3 SORONG" : "TOTAL (" + selLabel + ")"}</strong></td><td class="mono"><strong>${fmt(t.penyulang)}</strong></td><td class="mono"><strong>${fmt(t.panjang, 0)} kms</strong></td><td class="mono"><strong>${fmt(t.gardu)}</strong></td><td class="mono"><strong>${fmt(rTot.kms, 0)} kms</strong></td><td class="mono"><strong>${fmt(rTot.btg)}</strong></td>`;
      rb.appendChild(trt);
    }
    const rc = document.querySelector("#ajr-count"); if (rc) rc.textContent = (all ? t.ulp : picked.length) + " ULP";
    // Rincian penyulang
    const db = document.querySelector("#ajd-tbody");
    if (db) {
      db.innerHTML = "";
      let i = 0;
      const flat = [];
      groups.forEach((g) => {
        const tone = ULP_TONE[g.ulp.toUpperCase()] || "blue";
        g.items.forEach((it) => {
          const ra = rabasAset(g.ulp, it.nama);
          flat.push({ ulp: g.ulp, tone, it, kms: ra && ra.kms ? ra.kms : 0, btg: ra && ra.btg ? ra.btg : 0 });
        });
      });
      // urutkan: realisasi rabas (kms) lalu tebang (btg) terbanyak
      flat.sort((a, b) => (b.kms - a.kms) || (b.btg - a.btg));
      flat.forEach((row) => {
        i++;
        const tr = el("tr");
        tr.innerHTML = `
          <td class="mono muted">${i}</td>
          <td><strong>${row.it.nama}</strong></td>
          <td><span class="cdot cdot--${row.tone}"></span>${row.ulp}</td>
          <td class="mono">${fmt(row.it.panjang, 2)}</td>
          <td class="mono">${row.it.gardu ? fmt(row.it.gardu) : "—"}</td>
          <td class="mono">${row.kms ? fmt(row.kms, 2) : "—"}</td>
          <td class="mono">${row.btg ? fmt(row.btg) : "—"}</td>`;
        db.appendChild(tr);
      });
    }
    const dc = document.querySelector("#ajd-count"); if (dc) dc.textContent = t.penyulang + " penyulang";
    // Tren & matriks bulanan
    renderRabasMonthly(groups.map((g) => g.ulp));
    renderVendor(groups.map((g) => g.ulp));
    renderDaily(groups.map((g) => g.ulp));
  };

  // ---------- Laporan Realisasi Harian per ULP ----------
  function renderDaily(ulpNames) {
    if (!window.Rabas) return;
    const head = document.querySelector("#daily-head");
    const body = document.querySelector("#daily-body");
    const sub = document.querySelector("#daily-sub");
    const cnt = document.querySelector("#daily-count");
    if (!head || !body) return;
    const ML = window.Rabas.MONTHS_ID, MLL = window.Rabas.MONTHS_LONG;
    const sel = window.Rabas.month;
    const periodTxt = (sel === "all" || sel == null) ? "semua bulan 2026" : MLL[sel] + " 2026";
    if (sub) sub.textContent = "Realisasi per tanggal pelaksanaan · " + periodTxt;

    const data = window.Rabas.dailyByUlp ? window.Rabas.dailyByUlp(ulpNames) : { dates: [], ulps: [] };
    if (!data.dates.length) {
      head.innerHTML = "<th>Tanggal</th><th>Keterangan</th>";
      const msg = window.Rabas.source === "live"
        ? "Tidak ada realisasi harian pada filter ini."
        : "Rincian harian tersedia saat data live ROW termuat.";
      body.innerHTML = '<tr><td colspan="2" class="muted" style="text-align:center;padding:22px">' + msg + "</td></tr>";
      if (cnt) cnt.textContent = "";
      return;
    }
    const ulps = data.ulps;
    head.innerHTML = "<th>Tanggal</th>" + ulps.map((u) => "<th>" + u + "</th>").join("") + "<th>Total Harian</th>";
    body.innerHTML = "";
    const colTot = ulps.map(() => ({ kms: 0, btg: 0 }));
    let grand = { kms: 0, btg: 0 };
    data.dates.forEach((dt) => {
      let rk = 0, rb = 0;
      const cells = ulps.map((u, ci) => {
        const c = dt.cells[u];
        if (!c) return '<td class="mono"><span class="muted">—</span></td>';
        rk += c.kms; rb += c.btg; colTot[ci].kms += c.kms; colTot[ci].btg += c.btg;
        return '<td class="mono">' + (c.kms ? fmt(c.kms, 2) : '<span class="muted">—</span>') +
               (c.btg ? '<span class="mx-btg">' + fmt(c.btg) + ' btg</span>' : "") + "</td>";
      }).join("");
      grand.kms += rk; grand.btg += rb;
      const lbl = String(dt.d).padStart(2, "0") + " " + ML[dt.m];
      const tr = el("tr");
      tr.innerHTML = '<td class="mono nowrap"><strong>' + lbl + '</strong></td>' + cells +
        '<td class="mono"><strong>' + fmt(rk, 2) + '</strong><span class="mx-btg">' + fmt(rb) + ' btg</span></td>';
      body.appendChild(tr);
    });
    const tr = el("tr", "ajr-total");
    tr.innerHTML = "<td><strong>TOTAL</strong></td>" +
      colTot.map((c) => '<td class="mono"><strong>' + fmt(c.kms, 1) + '</strong><span class="mx-btg">' + fmt(c.btg) + ' btg</span></td>').join("") +
      '<td class="mono"><strong>' + fmt(grand.kms, 1) + '</strong><span class="mx-btg">' + fmt(grand.btg) + ' btg</span></td>';
    body.appendChild(tr);
    if (cnt) cnt.textContent = data.dates.length + " hari";
  }

  // ---------- Tren & Matriks Bulanan ----------
  const TONE_HEX = { blue: "#1273C4", teal: "#1F9D57", amber: "#F4B400", green: "#1F9D57", navy: "#E2231A", red: "#E2231A" };
  function ulpHex(u) { return TONE_HEX[ULP_TONE[u.toUpperCase()] || "blue"]; }

  function renderRabasMonthly(ulpNames) {
    if (!window.Rabas || !window.Chart) return;
    const byUlp = window.Rabas.monthlyByUlp();
    const months = window.Rabas.activeMonths();
    const names = ulpNames.filter((u) => byUlp[u]);
    const ML = window.Rabas.MONTHS_ID;
    const sel = window.Rabas.month;

    // --- Grafik tren (kms per bulan, satu garis per ULP) ---
    const cv = document.querySelector("#rabas-trend");
    if (cv) {
      const ds = names.map((u) => ({
        label: u,
        data: months.map((m) => byUlp[u][m].kms),
        borderColor: ulpHex(u), backgroundColor: ulpHex(u) + "22",
        borderWidth: 2.4, tension: 0.3, fill: false,
        pointRadius: months.map((m) => (sel !== "all" && m === sel) ? 5 : 3),
        pointBackgroundColor: ulpHex(u),
      }));
      if (rabasTrendChart) rabasTrendChart.destroy();
      rabasTrendChart = new window.Chart(cv, {
        type: "line",
        data: { labels: months.map((m) => ML[m]), datasets: ds },
        options: { responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { family: "'Plus Jakarta Sans',sans-serif" } } } },
          scales: { x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans',sans-serif" } } },
                    y: { beginAtZero: true, title: { display: true, text: "Rabas (kms)" }, ticks: { font: { family: "'Plus Jakarta Sans',sans-serif" } } } } }
      });
    }

    // --- Matriks ULP × bulan ---
    const head = document.querySelector("#rabas-matrix-head");
    const body = document.querySelector("#rabas-matrix-body");
    if (head && body) {
      head.innerHTML = "<th>ULP</th>" + months.map((m) => '<th class="' + (m === sel ? "mx-sel" : "") + '">' + ML[m] + "</th>").join("") + "<th>Total</th>";
      body.innerHTML = "";
      const colTot = months.map(() => ({ kms: 0, btg: 0 }));
      let grand = { kms: 0, btg: 0 };
      names.forEach((u) => {
        const tone = ULP_TONE[u.toUpperCase()] || "blue";
        let rk = 0, rb = 0;
        const cells = months.map((m, ci) => {
          const c = byUlp[u][m]; rk += c.kms; rb += c.btg;
          colTot[ci].kms += c.kms; colTot[ci].btg += c.btg;
          const cls = "mono" + (m === sel ? " mx-sel" : "");
          return '<td class="' + cls + '">' + (c.kms ? fmt(c.kms, 2) : '<span class="muted">—</span>') +
                 (c.btg ? '<span class="mx-btg">' + fmt(c.btg) + ' btg</span>' : "") + "</td>";
        }).join("");
        grand.kms += rk; grand.btg += rb;
        const tr = el("tr");
        tr.innerHTML = '<td><span class="cdot cdot--' + tone + '"></span><strong>' + u + "</strong></td>" + cells +
          '<td class="mono"><strong>' + fmt(rk, 2) + '</strong><span class="mx-btg">' + fmt(rb) + ' btg</span></td>';
        body.appendChild(tr);
      });
      const tr = el("tr", "ajr-total");
      tr.innerHTML = "<td><strong>TOTAL</strong></td>" +
        colTot.map((c, ci) => '<td class="mono' + (months[ci] === sel ? " mx-sel" : "") + '"><strong>' + fmt(c.kms, 1) + '</strong><span class="mx-btg">' + fmt(c.btg) + ' btg</span></td>').join("") +
        '<td class="mono"><strong>' + fmt(grand.kms, 1) + '</strong><span class="mx-btg">' + fmt(grand.btg) + ' btg</span></td>';
      body.appendChild(tr);
    }
  }

  // ---------- Realisasi per Mitra Pelaksana ----------
  const VENDOR_HEX = ["#E2231A", "#1273C4", "#F4B400", "#1F9D57"];
  function vendorColor(i) { return VENDOR_HEX[i % VENDOR_HEX.length]; }
  function vendorShort(vn) {
    const map = { "PLN NUSA DAYA": "PLN Nusa Daya", "PT RAJENDRA BINTANG JAYA": "Rajendra B.J.", "PT AKA RIFKI PAPUA": "Aka Rifki Papua", "PT PIAHAR KENCANA": "Piahar Kencana" };
    return map[vn.toUpperCase()] || vn.replace(/^PT\s+/i, "");
  }

  function renderVendor(ulpNames) {
    if (!window.Rabas || !window.Chart) return;
    const mx = window.Rabas.vendorByUlp();
    const ulps = (mx._ulps || []).filter((u) => ulpNames.map((x) => x.toUpperCase()).includes(u.toUpperCase()));
    const vendors = mx._vendors || [];
    const sel = window.Rabas.month;
    const subEl = document.querySelector("#vendor-sub");
    if (subEl) subEl.textContent = (sel === "all" || sel == null) ? "Akumulasi semua bulan 2026" : window.Rabas.MONTHS_LONG[sel] + " 2026";

    // --- Tube gauges per ULP: Rabas (kms) & Tebang (btg) tiap mitra ---
    const legend = document.querySelector("#vendor-legend");
    if (legend) {
      legend.innerHTML = vendors.map((vn, vi) =>
        '<span class="lg"><span class="sw" style="background:' + vendorColor(vi) + '"></span>' + vendorShort(vn) + "</span>"
      ).join("");
    }
    const wrap = document.querySelector("#vendor-tubes");
    if (wrap) {
      wrap.innerHTML = "";
      ulps.forEach((u) => {
        const present = vendors.filter((vn) => mx[u] && mx[u][vn] && (mx[u][vn].kms > 0 || mx[u][vn].btg > 0));
        if (!present.length) return;
        const maxK = Math.max.apply(null, present.map((vn) => mx[u][vn].kms).concat([0.0001]));
        const maxT = Math.max.apply(null, present.map((vn) => mx[u][vn].btg).concat([1]));
        let totK = 0, totB = 0; present.forEach((vn) => { totK += mx[u][vn].kms; totB += mx[u][vn].btg; });

        function tubes(metric, max) {
          return present.map((vn) => {
            const vi = vendors.indexOf(vn);
            const val = metric === "k" ? mx[u][vn].kms : mx[u][vn].btg;
            const pct = max > 0 ? Math.max(val > 0 ? 5 : 0, Math.round((val / max) * 100)) : 0;
            const full = pct >= 99 ? " full-top" : "";
            const valTxt = metric === "k" ? fmt(val, val < 10 ? 1 : 0) : fmt(val);
            return '<div class="tube-col">' +
                '<div class="tube-val">' + valTxt + '</div>' +
                '<div class="tube" title="' + vn + ' — ' + (metric === "k" ? "Rabas " + fmt(val, 2) + " kms" : "Tebang " + fmt(val) + " btg") + '">' +
                  '<div class="tube-fill' + full + '" style="height:' + pct + '%;background:linear-gradient(180deg,' + vendorColor(vi) + ',' + vendorColor(vi) + 'D0)"></div>' +
                '</div>' +
                '<div class="tube-name">' + vendorShort(vn) + '</div>' +
              '</div>';
          }).join("");
        }

        const card = el("div", "tube-card");
        card.innerHTML =
          '<div class="tube-card-h"><span class="cdot cdot--' + (ULP_TONE[u.toUpperCase()] || "blue") + '"></span>' + u +
            '<span class="tot">' + fmt(totK, 1) + ' kms · ' + fmt(totB) + ' btg</span></div>' +
          '<div class="tube-metrics">' +
            '<div class="tube-metric"><div class="tube-metric-h">Rabas (kms)</div><div class="tubes">' + tubes("k", maxK) + '</div></div>' +
            '<div class="tube-metric"><div class="tube-metric-h">Tebang (btg)</div><div class="tubes">' + tubes("t", maxT) + '</div></div>' +
          '</div>';
        wrap.appendChild(card);
      });
    }

    // --- Tabel rincian: ULP x vendor (kms + btg) ---
    const head = document.querySelector("#vendor-tbl-head");
    const body = document.querySelector("#vendor-tbl-body");
    if (head && body) {
      head.innerHTML = "<th>Mitra Pelaksana</th>" + ulps.map((u) => "<th>" + u + "</th>").join("") + "<th>Total</th>";
      body.innerHTML = "";
      const colTot = ulps.map(() => ({ kms: 0, btg: 0 }));
      vendors.forEach((vn, vi) => {
        let rk = 0, rb = 0;
        const cells = ulps.map((u, ci) => {
          const c = (mx[u] && mx[u][vn]) ? mx[u][vn] : { kms: 0, btg: 0 };
          rk += c.kms; rb += c.btg; colTot[ci].kms += c.kms; colTot[ci].btg += c.btg;
          return '<td class="mono">' + (c.kms ? fmt(c.kms, 2) : '<span class="muted">—</span>') +
                 (c.btg ? '<span class="mx-btg">' + fmt(c.btg) + ' btg</span>' : "") + "</td>";
        }).join("");
        const tr = el("tr");
        tr.innerHTML = '<td><span class="cdot" style="background:' + vendorColor(vi) + '"></span><strong>' + vn + "</strong></td>" + cells +
          '<td class="mono"><strong>' + fmt(rk, 2) + '</strong><span class="mx-btg">' + fmt(rb) + ' btg</span></td>';
        body.appendChild(tr);
      });
      let gk = 0, gb = 0; colTot.forEach((c) => { gk += c.kms; gb += c.btg; });
      const tr = el("tr", "ajr-total");
      tr.innerHTML = "<td><strong>TOTAL</strong></td>" +
        colTot.map((c) => '<td class="mono"><strong>' + fmt(c.kms, 1) + '</strong><span class="mx-btg">' + fmt(c.btg) + ' btg</span></td>').join("") +
        '<td class="mono"><strong>' + fmt(gk, 1) + '</strong><span class="mx-btg">' + fmt(gb) + ' btg</span></td>';
      body.appendChild(tr);
    }
  }

  function buildFilter() {
    const d = window.AsetJaringan.data;
    const box = document.querySelector("#aj-filter-ulp");
    if (!d || !box) return;
    const names = d.groups.map((g) => g.ulp);
    // bersihkan pilihan yang tak ada lagi
    window.AsetJaringan.ulps = (window.AsetJaringan.ulps || []).filter((u) => names.includes(u));
    const sel = window.AsetJaringan.ulps;
    box.innerHTML = "";
    const allChip = el("button", "aj-chip aj-chip--all" + (sel.length === 0 ? " on" : ""), "Semua ULP");
    allChip.onclick = () => { window.AsetJaringan.ulps = []; buildFilter(); window.renderAsetJaringan(); };
    box.appendChild(allChip);
    names.forEach((u) => {
      const on = sel.includes(u);
      const chip = el("button", "aj-chip" + (on ? " on" : ""), u);
      chip.onclick = () => {
        const arr = window.AsetJaringan.ulps.slice();
        const i = arr.indexOf(u);
        if (i >= 0) arr.splice(i, 1); else arr.push(u);
        window.AsetJaringan.ulps = arr;
        buildFilter(); window.renderAsetJaringan();
      };
      box.appendChild(chip);
    });
  }

  function buildMonthFilter() {
    const box = document.querySelector("#aj-filter-bulan");
    if (!box || !window.Rabas) return;
    const months = window.Rabas.activeMonths();
    const ML = window.Rabas.MONTHS_ID;
    const cur = window.Rabas.month;
    box.innerHTML = "";
    const allChip = el("button", "aj-chip aj-chip--all" + (cur === "all" ? " on" : ""), "Semua Bulan");
    allChip.onclick = () => { window.Rabas.month = "all"; buildMonthFilter(); window.renderAsetJaringan(); };
    box.appendChild(allChip);
    months.forEach((m) => {
      const chip = el("button", "aj-chip" + (cur === m ? " on" : ""), ML[m]);
      chip.onclick = () => { window.Rabas.month = (window.Rabas.month === m ? "all" : m); buildMonthFilter(); window.renderAsetJaringan(); };
      box.appendChild(chip);
    });
  }
  function start() {
    window.AsetJaringan.parseSnapshot();
    if (window.Rabas) window.Rabas.parseSnapshot();
    buildFilter();
    buildMonthFilter();
    window.renderAsetJaringan();
    Promise.all([
      window.AsetJaringan.load(),
      window.Rabas ? window.Rabas.load() : Promise.resolve(),
    ]).then(() => { buildFilter(); buildMonthFilter(); window.renderAsetJaringan(); });
  }
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", start);
  else start();

  // Hook realtime: dipanggil app.js saat auto-refresh untuk menarik ulang data ROW/Aset.
  window.refreshRealtime = function () {
    Promise.all([
      window.AsetJaringan.load(),
      window.Rabas ? window.Rabas.load() : Promise.resolve(),
    ]).then(() => { buildFilter(); buildMonthFilter(); window.renderAsetJaringan(); });
  };
})();
