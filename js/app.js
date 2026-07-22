// Orkestrasi dashboard: state filter global, KPI, grafik, tabel, mitigasi.
(function () {
  const GD = window.GangguanData;
  const TAHUN = 2026; // hanya tampilkan data tahun ini
  const state = { periode: "all", ulp: "all", kode: "all", q: "", sortKey: "tgl", sortDir: "desc" };
  let ALL = [];

  function filterTahun(recs) {
    return recs.filter((r) => {
      if (r.tgl && !isNaN(r.tgl.getTime())) return r.tgl.getFullYear() === TAHUN;
      return new RegExp("\\b" + TAHUN + "\\b").test(r.periode);
    });
  }

  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function fmtDur(min) {
    if (min == null) return "—";
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h}j ${m}m` : `${m}m`;
  }

  function jenisSumber(s) {
    const n = (s || "").trim().toLowerCase();
    if (n.startsWith("gi")) return "Gardu Induk (GI)";
    if (n.startsWith("gh")) return "Gardu Hubung (GH)";
    if (n.startsWith("pltd")) return "PLTD";
    if (n.startsWith("recloser")) return "Recloser";
    if (n.startsWith("pmcb")) return "PMCB";
    if (n.startsWith("cb")) return "CB / Outgoing";
    return "Lainnya";
  }

  function applyFilters() {
    return ALL.filter((r) => {
      // Seluruh halaman hanya merekap baris dengan indikasi proteksi terisi (GF/OC/UFR).
      if (GD.INDIKASI_ORDER.indexOf(r.indikasiKode) === -1) return false;
      if (state.periode !== "all" && r.periode !== state.periode) return false;
      if (state.ulp !== "all" && r.ulp !== state.ulp) return false;
      if (state.kode !== "all" && r.kode !== state.kode) return false;
      if (state.q) {
        const q = state.q.toLowerCase();
        const hay = (r.aset + " " + r.detail + " " + r.tindak + " " + r.ulp + " " + r.kodeLabel).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function aggregate(rows) {
    const byPeriode = {}, byUlp = {}, byCause = {}, byZona = {}, byCuaca = {}, byIndikasi = {}, byJenis = {}, byAset = {};
    const byWaktu = { Siang: 0, Malam: 0 };
    const overWaktu = { Siang: 0, Malam: 0 };
    const byHour = new Array(24).fill(0);
    let over5 = 0, durSum = 0, durN = 0, ensAssets = {};
    rows.forEach((r) => {
      const jt = (r.jamTrip || "").match(/(\d{1,2})/);
      if (jt) {
        const h = Math.min(23, +jt[1]); byHour[h]++;
        const seg = (h >= 6 && h < 18) ? "Siang" : "Malam";
        byWaktu[seg]++; if (!r.under5) overWaktu[seg]++;
      }
      const p = r.periode || "Lainnya";
      byPeriode[p] = byPeriode[p] || { under5: 0, over5: 0 };
      if (r.under5) byPeriode[p].under5++; else { byPeriode[p].over5++; over5++; }
      byUlp[r.ulp] = (byUlp[r.ulp] || 0) + 1;
      byCause[r.kode] = (byCause[r.kode] || 0) + 1;
      const z = r.zona || "—"; byZona[z] = (byZona[z] || 0) + 1;
      const c = r.cuaca || "Lainnya"; byCuaca[c] = (byCuaca[c] || 0) + 1;
      const ind = (r.indikasi || "Lainnya").split(" ")[0]; byIndikasi[ind] = (byIndikasi[ind] || 0) + 1;
      const jn = jenisSumber(r.sumber || r.aset); byJenis[jn] = (byJenis[jn] || 0) + 1;
      if (r.durasiMin != null) { durSum += r.durasiMin; durN++; }
      ensAssets[r.aset] = true;
      // per-aset (Nama Penyulang/Outlet/Recloser/PMCB)
      const key = r.aset || "—";
      const g = byAset[key] || (byAset[key] = { aset: key, ulp: r.ulp, sumber: r.sumber, jenis: jenisSumber(r.sumber || r.aset), n: 0, over5: 0, durSum: 0, durN: 0, causes: {} });
      g.n++;
      if (!r.under5) g.over5++;
      if (r.durasiMin != null) { g.durSum += r.durasiMin; g.durN++; }
      g.causes[r.kode] = (g.causes[r.kode] || 0) + 1;
    });
    const periodes = GD.PERIODE_ORDER.filter((p) => byPeriode[p]);
    Object.keys(byPeriode).forEach((p) => { if (!periodes.includes(p)) periodes.push(p); });
    const asetRanked = Object.values(byAset).map((g) => {
      const top = Object.entries(g.causes).sort((a, b) => b[1] - a[1])[0];
      return {
        aset: g.aset, ulp: g.ulp, sumber: g.sumber, jenis: g.jenis, n: g.n, over5: g.over5,
        pctU5: g.n ? Math.round(((g.n - g.over5) / g.n) * 100) : 0,
        avgDur: g.durN ? Math.round(g.durSum / g.durN) : null,
        topCause: top ? top[0] : "X",
      };
    }).sort((a, b) => b.n - a.n);
    return {
      total: rows.length,
      over5, under5: rows.length - over5,
      pctU5: rows.length ? Math.round(((rows.length - over5) / rows.length) * 100) : 0,
      avgDur: durN ? Math.round(durSum / durN) : null,
      ulpCount: Object.keys(byUlp).length,
      asetCount: Object.keys(ensAssets).length,
      byPeriode, periodes,
      ulpRanked: Object.entries(byUlp).map(([ulp, total]) => ({ ulp, total })).sort((a, b) => b.total - a.total),
      causeRanked: Object.entries(byCause).map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n),
      zonaRanked: Object.entries(byZona).map(([zona, n]) => ({ zona, n })).sort((a, b) => (a.zona > b.zona ? 1 : -1)),
      cuacaRanked: Object.entries(byCuaca).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n),
      indikasiRanked: Object.entries(byIndikasi).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n),
      jenisRanked: Object.entries(byJenis).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n),
      waktuRanked: [{ k: "Siang", n: byWaktu.Siang }, { k: "Malam", n: byWaktu.Malam }],
      waktu: (function () {
        const sg = byWaktu.Siang, ml = byWaktu.Malam, tot = sg + ml;
        let peakH = 0; byHour.forEach((c, h) => { if (c > byHour[peakH]) peakH = h; });
        return {
          siang: sg, malam: ml, total: tot,
          pctSiang: tot ? Math.round(sg / tot * 100) : 0,
          pctMalam: tot ? Math.round(ml / tot * 100) : 0,
          overSiang: overWaktu.Siang, overMalam: overWaktu.Malam,
          peakHour: peakH, peakN: byHour[peakH],
        };
      })(),
      asetRanked,
    };
  }

  // ---------- KPI ----------
  function renderKPI(agg) {
    const topCause = agg.causeRanked[0];
    const topUlp = agg.ulpRanked[0];
    const cards = [
      { label: "Total Gangguan", value: agg.total, sub: `${agg.asetCount} aset terdampak`, tone: "blue" },
      { label: "Recovery ≤ 5 Menit", value: agg.pctU5 + "%", sub: `${agg.under5} dari ${agg.total} kejadian`, tone: "green" },
      { label: "Durasi > 5 Menit", value: agg.over5, sub: "perlu penanganan lapangan", tone: "amber" },
      { label: "Rata-rata Durasi", value: fmtDur(agg.avgDur), sub: "waktu pemulihan", tone: "teal" },
      { label: "Penyebab Dominan", value: topCause ? topCause.code : "—", sub: topCause ? `${(GD.CAUSE_LABELS[topCause.code]||"").replace(/^.. — /,"")} · ${topCause.n}x` : "", tone: "red" },
      { label: "ULP Tertinggi", value: topUlp ? topUlp.ulp : "—", sub: topUlp ? `${topUlp.total} gangguan` : "", tone: "navy" },
    ];
    const wrap = $("#kpis"); wrap.innerHTML = "";
    cards.forEach((c) => {
      const card = el("div", "kpi kpi--" + c.tone);
      card.innerHTML = `<div class="kpi__label">${c.label}</div><div class="kpi__value">${c.value}</div><div class="kpi__sub">${c.sub}</div>`;
      wrap.appendChild(card);
    });
  }

  // ---------- Charts ----------
  function renderCharts(agg) {
    Charts.tren($("#ch-tren"), agg);
    Charts.perUlp($("#ch-ulp"), agg);
    Charts.penyebab($("#ch-cause"), agg);
    Charts.perZona($("#ch-zona"), agg);
    Charts.cuaca($("#ch-cuaca"), agg);
    Charts.indikasi($("#ch-indikasi"), agg);
    Charts.waktu($("#ch-waktu"), agg);
    renderWaktuEval(agg);
  }

  function renderWaktuEval(agg) {
    const w = agg.waktu;
    const elist = $("#waktu-eval");
    if (!elist) return;
    if (!w.total) { elist.innerHTML = `<li>Belum ada data jam trip untuk filter ini.</li>`; return; }
    const dom = w.malam >= w.siang ? "Malam" : "Siang";
    const domN = dom === "Malam" ? w.malam : w.siang;
    const domPct = dom === "Malam" ? w.pctMalam : w.pctSiang;
    const pad = (h) => String(h).padStart(2, "0") + ".00";
    const ph = w.peakHour;
    const pctOverS = w.siang ? Math.round(w.overSiang / w.siang * 100) : 0;
    const pctOverM = w.malam ? Math.round(w.overMalam / w.malam * 100) : 0;
    const findings = [
      `Mayoritas gangguan terjadi pada <b>${dom}</b> — <b>${domN} kejadian (${domPct}%)</b> dari ${w.total} trip.`,
      `Sebaran: <b>Siang</b> ${w.siang} (${w.pctSiang}%) · <b>Malam</b> ${w.malam} (${w.pctMalam}%).`,
      `Jam puncak trip pada kisaran <b>${pad(ph)}–${pad((ph + 1) % 24)}</b> dengan <b>${w.peakN} kejadian</b>.`,
      `Durasi pemulihan >5 menit: <b>Siang ${w.overSiang}</b> (${pctOverS}%) vs <b>Malam ${w.overMalam}</b> (${pctOverM}%) — ${pctOverM >= pctOverS ? "penanganan malam cenderung lebih lambat" : "penanganan siang cenderung lebih lambat"}.`,
      dom === "Malam"
        ? `Dominasi malam mengindikasikan faktor beban puncak, hewan/binatang, atau cuaca malam — perkuat patroli & kesiapan regu malam.`
        : `Dominasi siang mengindikasikan faktor aktivitas masyarakat (layang-layang, pekerjaan dekat jaringan, ranting) — perkuat sosialisasi & ROW siang hari.`,
    ];
    elist.innerHTML = findings.map((f) => `<li>${f}</li>`).join("");
  }

  // ---------- Evaluasi per Aset ----------
  function renderAset(agg) {
    Charts.perJenis($("#ch-jenis"), agg);
    const arr = agg.asetRanked;
    const berulang = arr.filter((a) => a.n >= 3);
    const max = arr.length ? arr[0].n : 1;
    // ringkasan evaluasi
    const top = arr[0];
    const jenisTop = agg.jenisRanked[0];
    const findings = [
      top ? `<b>${top.aset}</b> (ULP ${top.ulp}) adalah aset paling sering terganggu — <b>${top.n}×</b>.` : "",
      `<b>${berulang.length} aset</b> tergolong gangguan berulang (≥3×) dan menjadi prioritas evaluasi.`,
      jenisTop ? `Peralatan jenis <b>${jenisTop.k}</b> menyumbang gangguan terbanyak (${jenisTop.n} kejadian).` : "",
    ].filter(Boolean);
    $("#aset-eval").innerHTML = findings.map((f) => `<li>${f}</li>`).join("");

    const tb = $("#aset-tbody"); tb.innerHTML = "";
    $("#aset-count").textContent = arr.length + " aset";
    const frag = document.createDocumentFragment();
    arr.slice(0, 40).forEach((a, i) => {
      const dot = Charts.CAUSE_COLORS[a.topCause] || "#9AA6B2";
      const stTone = a.n >= 6 ? "bad" : a.n >= 3 ? "warn" : a.n >= 1 ? "ok" : "info";
      const stTxt = a.n >= 6 ? "Kronis" : a.n >= 3 ? "Sakit" : a.n >= 1 ? "Sehat" : "Sempurna";
      const recTone = a.pctU5 >= 60 ? "ok" : "warn";
      const barW = Math.round((a.n / max) * 100);
      const tr = el("tr");
      tr.innerHTML = `
        <td class="mono muted">${i + 1}</td>
        <td><strong>${a.aset}</strong><div class="muted sm">ULP ${a.ulp}</div></td>
        <td>${a.jenis}<div class="muted sm">${a.sumber || "—"}</div></td>
        <td><div class="barcell"><span class="barcell__fill" style="width:${barW}%"></span></div><span class="barcell__n">${a.n}</span></td>
        <td><span class="pill pill--${recTone === 'ok' ? 'ok' : 'warn'}">${a.pctU5}%</span></td>
        <td class="mono nowrap">${fmtDur(a.avgDur)}</td>
        <td class="nowrap"><span class="cdot" style="background:${dot}"></span>${a.topCause}</td>
        <td><span class="status status--${stTone}">${stTxt}</span></td>`;
      frag.appendChild(tr);
    });
    tb.appendChild(frag);
  }

  // ---------- Table ----------
  function renderTable(rows) {
    const sorted = rows.slice().sort((a, b) => {
      let av, bv;
      if (state.sortKey === "tgl") { av = a.tgl ? a.tgl.getTime() : 0; bv = b.tgl ? b.tgl.getTime() : 0; }
      else if (state.sortKey === "durasi") { av = a.durasiMin || 0; bv = b.durasiMin || 0; }
      else { av = (a[state.sortKey] || "").toString().toLowerCase(); bv = (b[state.sortKey] || "").toString().toLowerCase(); }
      if (av < bv) return state.sortDir === "asc" ? -1 : 1;
      if (av > bv) return state.sortDir === "asc" ? 1 : -1;
      return 0;
    });
    const tb = $("#tbody"); tb.innerHTML = "";
    $("#tcount").textContent = sorted.length + " kejadian";
    const frag = document.createDocumentFragment();
    sorted.forEach((r) => {
      const tr = el("tr");
      const u5 = r.under5
        ? `<span class="pill pill--ok">≤5m</span>`
        : `<span class="pill pill--warn">&gt;5m</span>`;
      const dot = Charts.CAUSE_COLORS[r.kode] || "#9AA6B2";
      tr.innerHTML = `
        <td class="nowrap mono">${r.tanggal || "—"}</td>
        <td><strong>${r.ulp}</strong></td>
        <td>${r.aset}<div class="muted sm">${r.zona}</div></td>
        <td class="nowrap mono">${r.jamTrip || "—"} → ${r.jamMasuk || "—"}</td>
        <td class="nowrap mono">${r.durasi || "—"}</td>
        <td>${u5}</td>
        <td class="nowrap">${r.indikasi || "—"}<div class="muted sm">${r.cuaca}</div></td>
        <td><span class="cdot" style="background:${dot}"></span>${r.kode}</td>
        <td class="detail">${r.detail || "—"}</td>
        <td class="detail muted">${r.tindak || "—"}</td>`;
      frag.appendChild(tr);
    });
    tb.appendChild(frag);
    // header sort indicators
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.classList.toggle("sorted", th.dataset.sort === state.sortKey);
      th.dataset.dir = th.dataset.sort === state.sortKey ? state.sortDir : "";
    });
  }

  // ---------- Mitigasi ----------
  const ICONS = {
    tree: "M12 2c-3 0-5 2.5-5 5 0 1 .3 1.9.8 2.6C6 10.4 5 11.8 5 13.5 5 16 7 18 9.5 18H11v4h2v-4h1.5C17 18 19 16 19 13.5c0-1.7-1-3.1-2.8-3.9.5-.7.8-1.6.8-2.6 0-2.5-2-5-5-5z",
    storm: "M13 2 4 14h6l-1 8 9-12h-6l1-8z",
    animal: "M4 11c0-3 2-5 4-5 1 0 2 .5 2 .5S11 6 12 6s2-.5 2-.5S15 6 16 6c2 0 4 2 4 5 0 4-3 7-8 7s-8-3-8-7z",
    kite: "M12 2 4 10l8 8 8-8-8-8zM12 18v4",
    cable: "M4 7h6a4 4 0 0 1 4 4v2a4 4 0 0 0 4 4h2M4 7V4M4 7v3",
    tool: "M14 6a4 4 0 0 0-5 5l-7 7 3 3 7-7a4 4 0 0 0 5-5l-3 3-3-3 3-3z",
    pole: "M12 2v20M6 6l6 2 6-2M7 11l5 1.5L17 11",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
  };
  function svgIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name] || ICONS.search}"/></svg>`;
  }

  // ---------- Mitigasi: realisasi tindak lanjut (persist) ----------
  const REAL_KEY = "plnup3-mitigasi-realisasi";
  let realisasi = {};
  try { realisasi = JSON.parse(localStorage.getItem(REAL_KEY) || "{}"); } catch (e) { realisasi = {}; }
  function saveReal() { try { localStorage.setItem(REAL_KEY, JSON.stringify(realisasi)); } catch (e) {} }
  const REAL_STATES = ["belum", "proses", "selesai"];
  const REAL_PCT = { belum: 0, proses: 50, selesai: 100 };
  const REAL_TXT = { belum: "Belum", proses: "Proses", selesai: "Selesai" };
  function getReal(k) { return realisasi[k] || "belum"; }

  function renderMitigasi(rows) {
    const perUlp = window.Mitigasi.buildPerULP(rows);
    const wrap = $("#mitigasi"); wrap.innerHTML = "";
    if (!perUlp.length) { wrap.innerHTML = `<p class="muted">Tidak ada data untuk filter ini.</p>`; updateGlobalReal(perUlp); return; }
    perUlp.forEach((u) => {
      const card = el("div", "mit-card");
      const statusTone = u.pctU5 >= 60 ? "ok" : u.pctU5 >= 40 ? "warn" : "bad";
      const statusTxt = u.pctU5 >= 60 ? "Terkendali" : u.pctU5 >= 40 ? "Perlu Atensi" : "Prioritas Tinggi";
      const topCauses = u.top.slice(0, 3);
      const chips = topCauses.map((c) =>
        `<span class="mit-chip"><span class="cdot" style="background:${Charts.CAUSE_COLORS[c.code]||'#9AA6B2'}"></span>${c.nama} · <b>${c.n}</b> <span class="muted">(${c.pct}%)</span></span>`
      ).join("");
      const lead = topCauses[0];
      // progres realisasi ULP
      const prog = ulpProgress(u);
      const maRow = (a) => {
        const key = u.ulp + "|" + a.code + "|" + a.idx;
        const st = getReal(key);
        const col = Charts.CAUSE_COLORS[a.code] || "#9AA6B2";
        return `<div class="ma-row">
          <span class="mit-tag" style="background:${col}22;color:${col}">${a.code}</span>
          <div class="ma-body">
            <div class="ma-aksi">${a.aksi}</div>
            <div class="ma-meta"><span class="ma-std">${a.standar}</span><span class="ma-tgt">🎯 Target: <b>${a.target}</b></span></div>
          </div>
          <button class="rstat rstat--${st}" data-key="${key}" title="Klik untuk ubah realisasi">${REAL_TXT[st]}</button>
        </div>`;
      };
      const pendek = u.plan.filter((a) => a.h === "pendek");
      const panjang = u.plan.filter((a) => a.h !== "pendek");
      const grp = (arr, label, cls) => arr.length
        ? `<div class="mit-sub mit-sub--${cls}"><span class="mit-dot mit-dot--${cls}"></span>${label} <span class="mit-cnt">${arr.length} aksi</span></div><div class="ma-list">${arr.map(maRow).join("")}</div>`
        : "";
      const planHtml = grp(pendek, "Jangka Pendek", "pendek") + grp(panjang, "Menengah – Panjang", "panjang");
      card.innerHTML = `
        <div class="mit-head">
          <div class="mit-ico" style="color:${Charts.CAUSE_COLORS[lead.code]||'#1273C4'}">${svgIcon(lead.kb ? lead.kb.ikon : 'search')}</div>
          <div class="mit-head-txt">
            <div class="mit-ulp">ULP ${u.ulp}</div>
            <div class="mit-meta">${u.total} gangguan · ${u.pctU5}% recovery ≤5m · rata-rata ${fmtDur(u.avgDur)}</div>
          </div>
          <span class="status status--${statusTone}">${statusTxt}</span>
        </div>
        <div class="mit-chips">${chips}</div>
        <div class="mit-prog">
          <div class="mit-prog-top"><span>Realisasi Tindak Lanjut</span><b class="mit-prog-pct">${prog.pct}%</b></div>
          <div class="mit-prog-bar"><span style="width:${prog.pct}%"></span></div>
          <div class="mit-prog-sub">${prog.selesai}/${prog.total} aksi selesai · ${prog.proses} proses</div>
        </div>
        <div class="mit-plantitle">Rencana Aksi Mitigasi <span class="muted">— Standar PLN, terukur</span></div>
        ${planHtml}`;
      wrap.appendChild(card);
    });
    // wiring tombol realisasi
    wrap.querySelectorAll(".rstat").forEach((btn) => {
      btn.onclick = () => {
        const k = btn.dataset.key;
        const cur = getReal(k);
        const next = REAL_STATES[(REAL_STATES.indexOf(cur) + 1) % REAL_STATES.length];
        realisasi[k] = next; saveReal();
        renderMitigasi(rows);
      };
    });
    updateGlobalReal(perUlp);
  }

  function ulpProgress(u) {
    const total = u.plan.length;
    let sum = 0, selesai = 0, proses = 0;
    u.plan.forEach((a) => {
      const st = getReal(u.ulp + "|" + a.code + "|" + a.idx);
      sum += REAL_PCT[st];
      if (st === "selesai") selesai++; else if (st === "proses") proses++;
    });
    return { total, selesai, proses, pct: total ? Math.round(sum / total) : 0 };
  }

  function updateGlobalReal(perUlp) {
    let tot = 0, sum = 0;
    perUlp.forEach((u) => u.plan.forEach((a) => { tot++; sum += REAL_PCT[getReal(u.ulp + "|" + a.code + "|" + a.idx)]; }));
    const pct = tot ? Math.round(sum / tot) : 0;
    const elp = $("#mit-global");
    if (elp) elp.textContent = `Realisasi keseluruhan: ${pct}% (${tot} aksi)`;
  }

  // ---- Kinerja Perbaikan FGTM: tren penurunan/peningkatan per ULP ----
  function computeKinerja(rows) {
    const present = {};
    rows.forEach((r) => { if (r.periode) present[r.periode] = true; });
    let periods = GD.PERIODE_ORDER.filter((p) => present[p]);
    Object.keys(present).forEach((p) => { if (!periods.includes(p)) periods.push(p); });
    const n = periods.length;
    const byUlp = {};
    rows.forEach((r) => {
      if (!r.ulp) return;
      const g = byUlp[r.ulp] || (byUlp[r.ulp] = { counts: {}, total: 0 });
      if (r.periode) g.counts[r.periode] = (g.counts[r.periode] || 0) + 1;
      g.total++;
    });
    const mid = Math.floor(n / 2);
    const earlier = periods.slice(0, n - mid);
    const later = periods.slice(n - mid);
    const result = Object.entries(byUlp).map(([ulp, g]) => {
      const eSum = earlier.reduce((s, p) => s + (g.counts[p] || 0), 0);
      const lSum = later.reduce((s, p) => s + (g.counts[p] || 0), 0);
      const eAvg = earlier.length ? eSum / earlier.length : 0;
      const lAvg = later.length ? lSum / later.length : 0;
      let pct;
      if (eAvg === 0 && lAvg === 0) pct = 0;
      else if (eAvg === 0) pct = 100;            // gangguan baru muncul
      else pct = Math.round(((lAvg - eAvg) / eAvg) * 100);
      return { ulp, total: g.total, eSum, lSum, eAvg, lAvg, pct };
    });
    // urut: penurunan terbesar (paling negatif) di atas
    result.sort((a, b) => a.pct - b.pct || b.total - a.total);
    const labelOf = (a) => a.length ? (a[0].replace(/ 20\d\d/, "") + (a.length > 1 ? "–" + a[a.length - 1].replace(/ 20\d\d/, "") : "")) : "—";
    return { n, periods, earlier, later, eLabel: labelOf(earlier), lLabel: labelOf(later), rows: result };
  }

  // Urutkan periode secara kronologis (mendukung lintas tahun)
  function periodKey(p) {
    const MONTHS = ["januari","februari","maret","april","mei","juni","juli","agustus","september","oktober","november","desember"];
    const m = String(p).toLowerCase().match(/([a-z]+)\s*(\d{4})?/);
    if (!m) return Infinity;
    const mi = MONTHS.indexOf(m[1]);
    const yr = m[2] ? parseInt(m[2], 10) : 0;
    return yr * 12 + (mi < 0 ? 0 : mi);
  }

  // ---- MoM: % perubahan gangguan tiap ULP dibanding bulan sebelumnya ----
  function computeKinerjaMoM(rows) {
    const present = {};
    rows.forEach((r) => { if (r.periode) present[r.periode] = true; });
    const periods = Object.keys(present).sort((a, b) => periodKey(a) - periodKey(b));
    const byUlp = {};
    rows.forEach((r) => {
      if (!r.ulp || !r.periode) return;
      const g = byUlp[r.ulp] || (byUlp[r.ulp] = {});
      g[r.periode] = (g[r.periode] || 0) + 1;
    });
    const shortP = (p) => String(p).replace(/\s*20\d\d/, "");
    // titik x = bulan ke-2 dst (dibanding bulan sebelumnya)
    const labels = periods.slice(1).map(shortP);
    const ulps = Object.keys(byUlp).sort();
    const series = ulps.map((ulp) => {
      const g = byUlp[ulp];
      const data = [];
      for (let i = 1; i < periods.length; i++) {
        const prev = g[periods[i - 1]] || 0;
        const curr = g[periods[i]] || 0;
        let pct;
        if (prev === 0 && curr === 0) pct = 0;
        else if (prev === 0) pct = 100;          // gangguan baru muncul
        else pct = Math.round(((curr - prev) / prev) * 100);
        data.push(pct);
      }
      return { ulp, data };
    });
    return { n: periods.length, periods, labels, series };
  }

  function renderKinerja(allRows) {
    // Kinerja FGTM hanya menghitung baris dengan indikasi proteksi terisi (GF/OC/UFR).
    const codes = GD.INDIKASI_ORDER;
    const rows = allRows.filter((r) => codes.indexOf(r.indikasiKode) !== -1);
    const data = computeKinerja(rows);
    const champBox = $("#kinerja-champ");
    const sub = $("#kinerja-sub");
    const tb = $("#kinerja-tbody");
    const cnt = $("#kinerja-count");
    const momSub = $("#kinerja-mom-sub");

    if (data.n < 2 || !data.rows.length) {
      sub.textContent = "Butuh data minimal 2 periode untuk menghitung tren penurunan/peningkatan.";
      champBox.innerHTML = `<div class="champ-empty">Belum cukup periode untuk menilai kinerja perbaikan. Pilih rentang dengan ≥2 periode pada Filter.</div>`;
      tb.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">Data periode belum cukup.</td></tr>`;
      cnt.textContent = "";
      if (momSub) momSub.textContent = "Butuh data minimal 2 periode untuk menghitung penurunan antar bulan.";
      const evb = $("#kinerja-eval"); if (evb) evb.innerHTML = "";
      const evs = $("#kinerja-eval-sub"); if (evs) evs.textContent = "Belum cukup periode untuk dievaluasi.";
      Charts.kinerja($("#ch-kinerja"), { rows: [] });
      Charts.kinerjaMoM($("#ch-kinerja-mom"), { labels: [], series: [] });
      return;
    }

    sub.innerHTML = `Membandingkan rata-rata gangguan <b>${data.eLabel}</b> (awal) vs <b>${data.lLabel}</b> (akhir). Hijau = turun (membaik) · Merah = naik.`;
    Charts.kinerja($("#ch-kinerja"), data);

    // MoM — penurunan dari bulan sebelumnya, semua ULP
    const mom = computeKinerjaMoM(rows);
    momSub.innerHTML = `Perubahan jumlah gangguan tiap bulan dibanding <b>bulan sebelumnya</b>, per ULP. Garis turun di bawah 0% = penurunan gangguan (membaik).`;
    Charts.kinerjaMoM($("#ch-kinerja-mom"), mom);
    renderKinerjaEval(mom);

    // Juara — penurunan terbaik
    const champ = data.rows[0];
    const turunChamp = champ.pct < 0;
    const fmt1 = (v) => (Math.round(v * 10) / 10).toString();
    if (turunChamp) {
      champBox.innerHTML = `
        <div class="champ-badge">🏆 JUARA KINERJA</div>
        <div class="champ-trophy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v3a6 6 0 0 1-12 0V4z"/><path d="M6 5H3v1a3 3 0 0 0 3 3M18 5h3v1a3 3 0 0 1-3 3M9 16h6M8 20h8M12 13v3"/></svg>
        </div>
        <div class="champ-ulp">ULP ${champ.ulp}</div>
        <div class="champ-pct">▼ ${Math.abs(champ.pct)}%</div>
        <div class="champ-cap">Penurunan gangguan terbaik antar periode</div>
        <div class="champ-stats">
          <div><span>${fmt1(champ.eAvg)}</span><small>awal /periode</small></div>
          <div class="champ-arrow">→</div>
          <div><span>${fmt1(champ.lAvg)}</span><small>akhir /periode</small></div>
        </div>`;
    } else {
      champBox.innerHTML = `
        <div class="champ-badge champ-badge--none">BELUM ADA JUARA</div>
        <div class="champ-trophy champ-trophy--dim">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v3a6 6 0 0 1-12 0V4z"/><path d="M6 5H3v1a3 3 0 0 0 3 3M18 5h3v1a3 3 0 0 1-3 3M9 16h6M8 20h8M12 13v3"/></svg>
        </div>
        <div class="champ-ulp">ULP ${champ.ulp}</div>
        <div class="champ-pct champ-pct--up">${champ.pct > 0 ? "▲ " + champ.pct + "%" : "0%"}</div>
        <div class="champ-cap">Progres terbaik, namun belum mencatat penurunan. Perkuat mitigasi.</div>`;
    }

    // Peringkat tabel
    cnt.textContent = data.rows.length + " ULP";
    const medal = ["🥇", "🥈", "🥉"];
    tb.innerHTML = data.rows.map((x, i) => {
      const turun = x.pct < 0, naik = x.pct > 0;
      const stTone = turun ? "ok" : naik ? "bad" : "warn";
      const stTxt = turun ? "Membaik" : naik ? "Memburuk" : "Stabil";
      const arrow = turun ? `<span class="kn-down">▼ ${Math.abs(x.pct)}%</span>` : naik ? `<span class="kn-up">▲ ${x.pct}%</span>` : `<span class="kn-flat">0%</span>`;
      const rk = i < 3 ? `<span class="kn-medal">${medal[i]}</span>` : `<span class="mono muted">${i + 1}</span>`;
      return `<tr${i === 0 && turun ? ' class="kn-champ-row"' : ""}>
        <td>${rk}</td>
        <td><strong>ULP ${x.ulp}</strong></td>
        <td class="mono">${(Math.round(x.eAvg * 10) / 10)}</td>
        <td class="mono">${(Math.round(x.lAvg * 10) / 10)}</td>
        <td>${arrow}</td>
        <td><span class="status status--${stTone}">${stTxt}</span></td>
      </tr>`;
    }).join("");
  }

  // ---- Evaluasi naratif % MoM per ULP ----
  const KEV_COLORS = ["#E2231A", "#1273C4", "#F4B400", "#1F9D57"];
  function renderKinerjaEval(mom) {
    const box = $("#kinerja-eval");
    const sub = $("#kinerja-eval-sub");
    if (!box) return;
    const series = mom.series || [];
    const labels = mom.labels || [];
    if (!series.length || !labels.length) {
      box.innerHTML = "";
      if (sub) sub.textContent = "Belum cukup periode untuk dievaluasi.";
      return;
    }
    if (sub) sub.innerHTML = `Penilaian otomatis arah perubahan gangguan tiap ULP berdasarkan persentase bulanan. Total <b>${series.length} ULP</b> dievaluasi.`;

    const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    box.innerHTML = series.map((s, idx) => {
      const c = KEV_COLORS[idx % KEV_COLORS.length];
      const vals = s.data;
      const latest = vals[vals.length - 1];
      const down = vals.filter((v) => v < 0).length;
      const up = vals.filter((v) => v > 0).length;
      const mean = Math.round(avg(vals));

      let tone, label, narr;
      if (down > up && latest <= 0) {
        tone = "ok"; label = "Membaik";
        narr = `Gangguan cenderung <b>menurun</b> (${down} dari ${vals.length} bulan turun, rata-rata ${mean > 0 ? "+" : ""}${mean}%). Pertahankan pola mitigasi yang berjalan.`;
      } else if (up > down || latest > 0) {
        tone = up > down && latest > 0 ? "bad" : "warn";
        label = latest > 0 ? "Perlu Perhatian" : "Fluktuatif";
        narr = latest > 0
          ? `Bulan terakhir <b>naik ${latest}%</b> dibanding sebelumnya (${up} bulan naik). Perlu penguatan mitigasi & evaluasi penyebab dominan.`
          : `Perubahan <b>fluktuatif</b> (${up} naik, ${down} turun). Tren belum stabil — pantau ketat bulan berikutnya.`;
      } else {
        tone = "warn"; label = "Stabil";
        narr = `Jumlah gangguan relatif <b>stabil</b> antar bulan (rata-rata ${mean > 0 ? "+" : ""}${mean}%). Belum ada penurunan signifikan.`;
      }

      const pills = vals.map((v, i) => {
        const cls = v < 0 ? "kev-pill--down" : v > 0 ? "kev-pill--up" : "";
        const arr = v < 0 ? "▼ " : v > 0 ? "▲ " : "";
        return `<span class="kev-pill ${cls}"><b>${labels[i]}</b>${arr}${v > 0 ? "+" : ""}${v}%</span>`;
      }).join("");

      return `<div class="kev-card" style="--c:${c}">
        <div class="kev-top">
          <span class="kev-ulp"><span class="kev-dot"></span>ULP ${s.ulp}</span>
          <span class="status status--${tone}">${label}</span>
        </div>
        <div class="kev-months">${pills}</div>
        <div class="kev-txt">${narr}</div>
      </div>`;
    }).join("");
  }

  // ---------- Filters UI ----------
  function fillSelect(sel, items, allLabel) {
    sel.innerHTML = `<option value="all">${allLabel}</option>` + items.map((i) => `<option value="${i.v}">${i.t}</option>`).join("");
  }

  function buildFilters() {
    const periodes = GD.PERIODE_ORDER.filter((p) => ALL.some((r) => r.periode === p));
    ALL.forEach((r) => { if (!periodes.includes(r.periode) && r.periode) periodes.push(r.periode); });
    fillSelect($("#f-periode"), periodes.map((p) => ({ v: p, t: p })), "Semua Periode");
    const ulps = [...new Set(ALL.map((r) => r.ulp))].sort();
    fillSelect($("#f-ulp"), ulps.map((u) => ({ v: u, t: u })), "Semua ULP");
    const codes = [...new Set(ALL.map((r) => r.kode))].sort();
    fillSelect($("#f-kode"), codes.map((c) => ({ v: c, t: GD.CAUSE_LABELS[c] || c })), "Semua Penyebab");

    $("#f-periode").onchange = (e) => { state.periode = e.target.value; rerender(); };
    $("#f-ulp").onchange = (e) => { state.ulp = e.target.value; rerender(); };
    $("#f-kode").onchange = (e) => { state.kode = e.target.value; rerender(); };
    let qt;
    $("#f-q").oninput = (e) => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value.trim(); rerender(); }, 200); };
    $("#f-reset").onclick = () => {
      state.periode = "all"; state.ulp = "all"; state.kode = "all"; state.q = "";
      $("#f-periode").value = "all"; $("#f-ulp").value = "all"; $("#f-kode").value = "all"; $("#f-q").value = "";
      rerender();
    };
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.onclick = () => {
        const k = th.dataset.sort;
        if (state.sortKey === k) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else { state.sortKey = k; state.sortDir = k === "tgl" || k === "durasi" ? "desc" : "asc"; }
        renderTable(applyFilters());
      };
    });
  }

  // ---------- Rekap Indikasi Proteksi FGTM (kolom M: GF/OC/UFR) ----------
  function renderIndikasi(rows) {
    const codes = GD.INDIKASI_ORDER;                 // ["GF","OC","UFR"]
    const kept = rows.filter((r) => codes.indexOf(r.indikasiKode) !== -1);
    const sub = $("#indikasi-sub");
    const kpi = $("#indikasi-kpi");
    const totals = { GF: 0, OC: 0, UFR: 0 };
    const byUlp = {};
    kept.forEach((r) => {
      totals[r.indikasiKode]++;
      const b = byUlp[r.ulp] || (byUlp[r.ulp] = { GF: 0, OC: 0, UFR: 0 });
      b[r.indikasiKode]++;
    });
    const grand = kept.length;
    const ulps = Object.keys(byUlp).sort((a, b) => {
      const ta = totals && (byUlp[b].GF + byUlp[b].OC + byUlp[b].UFR) - (byUlp[a].GF + byUlp[a].OC + byUlp[a].UFR);
      return ta;
    });

    sub.innerHTML = `Rekap gangguan FGTM berdasarkan indikasi proteksi kerja (kolom M). Hanya baris yang terisi <b>GF / OC / UFR</b> yang dihitung — total <b>${grand}</b> kejadian dari ${rows.length} baris.`;

    const pct = (v) => (grand ? Math.round((v / grand) * 100) : 0);
    const IND_C = { GF: "#E2231A", OC: "#1273C4", UFR: "#F4B400" };
    kpi.innerHTML = codes.map((c) =>
      `<div class="ind-kpi" style="--c:${IND_C[c]}">
        <div class="ind-kpi-code">${c}</div>
        <div class="ind-kpi-num">${totals[c]}</div>
        <div class="ind-kpi-sub">${pct(totals[c])}% · ${GD.INDIKASI_LABELS[c].replace(/^[^(]*\(|\)$/g, "")}</div>
      </div>`
    ).join("") + `<div class="ind-kpi" style="--c:#073B6B">
        <div class="ind-kpi-code">TOTAL</div>
        <div class="ind-kpi-num">${grand}</div>
        <div class="ind-kpi-sub">Seluruh indikasi terisi</div>
      </div>`;

    Charts.indikasiDonut($("#ch-indikasi-donut"), { codes, totals });
    Charts.indikasiUlp($("#ch-indikasi-ulp"), { codes, ulps, byUlp });
  }

  function rerender() {
    const rows = applyFilters();
    const agg = aggregate(rows);
    renderKPI(agg);
    renderCharts(agg);
    renderAset(agg);
    renderTable(rows);
    renderMitigasi(rows);
    renderKinerja(rows);
    renderIndikasi(rows);
    const ctx = [];
    if (state.periode !== "all") ctx.push(state.periode);
    if (state.ulp !== "all") ctx.push("ULP " + state.ulp);
    if (state.kode !== "all") ctx.push(GD.CAUSE_LABELS[state.kode] || state.kode);
    $("#scope").textContent = ctx.length ? ctx.join(" · ") : "Seluruh Wilayah · Tahun " + TAHUN;
  }

  function stamp() {
    $("#srcbadge").textContent = GD.source === "live" ? "● Data Live (Spreadsheet)" : "● Data Snapshot";
    $("#srcbadge").classList.toggle("live", GD.source === "live");
    $("#updated").textContent = new Date().toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function init() {
    // 1) Render instan dari snapshot agar tidak ada layar kosong.
    ALL = filterTahun(GD.parseSnapshot());
    GD.source = "snapshot";
    $("#srcbadge").textContent = "● Memuat data live…";
    stamp();
    buildFilters();
    rerender();
    // 2) Coba ambil data live di latar; bila berhasil, perbarui.
    refreshLive();
    // 3) Auto-refresh berkala agar data tampil realtime tanpa reload manual.
    var REFRESH_MS = 5 * 60 * 1000; // 5 menit
    setInterval(function () {
      if (document.hidden) return; // hemat kuota saat tab tidak aktif
      var gv = document.getElementById("view-gangguan");
      if (gv && !gv.classList.contains("on")) return; // hanya refresh saat tab Gangguan aktif
      refreshLive(true);
    }, REFRESH_MS);
    // Auto-refresh berkala (5 menit) sudah cukup; refresh saat visibilitychange
    // dihapus karena memicu reload + render ulang semua chart yang memblokir main thread.
  }

  function refreshLive(silent) {
    if (!silent) $("#srcbadge").textContent = "● Memuat data live…";
    GD.reload().then(function () {
      ALL = filterTahun(GD.records);
      stamp();
      buildFilters();
      rerender();
      // Ikut segarkan modul lain yang juga menarik data live dari Spreadsheet.
      try { if (window.Pemeliharaan && Pemeliharaan.loadLive) Pemeliharaan.loadLive(); } catch (e) {}
      try { if (typeof window.refreshRealtime === "function") window.refreshRealtime(); } catch (e) {}
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
