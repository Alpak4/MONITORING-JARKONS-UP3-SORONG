// Dashboard Pemeliharaan PLN UP3 Sorong — render dari window.PLN (pln-data.js).
// Mandiri; tidak bergantung pada modul gangguan. Diinisialisasi saat tab dibuka.
(function () {
  var C = {
    blue: "#1273C4", navy: "#333333", deep: "#0E5C9C", yellow: "#F4B400",
    red: "#E2231A", green: "#1F9D57", teal: "#1F9D57", gold: "#F4B400", muted: "#5B6573", line: "#E4EAF1"
  };
  var KAT_COLORS = { "PHB-TM": "#E2231A", "JTM": "#1273C4", "GARDU": "#F4B400", "JTR": "#1F9D57", "SR-APP": "#E2231A" };

  var state = { bulan: "all", minggu: "all", ulp: "all", kat: "all", status: "all", padam: "all", q: "", sortKey: "tgl", sortDir: "asc" };
  var charts = {};
  var DATA = null;
  var YEAR = 2026;
  var MONTH_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // Bulan (0..11) sebuah baris untuk tahun 2026.
  function rowMonth(r) {
    if (r.date && typeof r.date.getMonth === "function") return r.date.getMonth();
    var m = String(r.minggu || "").match(/(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)/i);
    return m ? MONTH_ID.indexOf(m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()) : -1;
  }
  function rowYear(r) { return (r.date && typeof r.date.getFullYear === "function") ? r.date.getFullYear() : YEAR; }

  function rows2026() { return (DATA.rows || []).filter(function (r) { return rowYear(r) === YEAR; }); }
  function activeMonths() {
    var set = {};
    rows2026().forEach(function (r) { var m = rowMonth(r); if (m >= 0) set[m] = 1; });
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  }
  function weeksForMonth(month) {
    var present = {};
    rows2026().forEach(function (r) { if (month === "all" || rowMonth(r) === month) present[r.minggu] = 1; });
    return (DATA.MINGGU || []).filter(function (m) { return present[m]; });
  }
  function weekShort(m) { return String(m).replace(/\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}$/i, ""); }

  function $(s) { return document.querySelector(s); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function opt(sel, val, txt) { var o = document.createElement("option"); o.value = val; o.textContent = txt; sel.appendChild(o); }

  function rows() { return DATA.rows; }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    return rows().filter(function (r) {
      if (state.bulan !== "all" && rowMonth(r) !== state.bulan) return false;
      if (state.minggu !== "all" && r.minggu !== state.minggu) return false;
      if (state.ulp !== "all" && r.ulp !== state.ulp) return false;
      if (state.kat !== "all" && r.kategori !== state.kat) return false;
      if (state.status !== "all" && r.progres !== state.status) return false;
      if (state.padam === "padam" && !r.padamFlag) return false;
      if (state.padam === "tanpa" && r.padamFlag) return false;
      if (q) {
        var hay = (r.pekerjaan + " " + r.penyulang + " " + r.lokasi + " " + r.pelaksana + " " + r.kategori + " " + r.wo).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  // Isi ulang opsi Minggu sesuai bulan terpilih (filter mingguan tiap bulan).
  function fillWeeks() {
    var fm = $("#pm-f-minggu");
    if (!fm) return;
    fm.innerHTML = "";
    opt(fm, "all", "Semua Minggu");
    if (state.bulan === "all") {
      // Minggu hanya relevan dalam satu bulan
      state.minggu = "all";
      fm.value = "all";
      fm.disabled = true;
      return;
    }
    fm.disabled = false;
    var weeks = weeksForMonth(state.bulan);
    weeks.forEach(function (m) { opt(fm, m, weekShort(m)); });
    if (state.minggu !== "all" && weeks.indexOf(state.minggu) === -1) state.minggu = "all";
    fm.value = state.minggu;
  }

  function buildFilters() {
    var fb = $("#pm-f-bulan"), fm = $("#pm-f-minggu"), fu = $("#pm-f-ulp"), fk = $("#pm-f-kat"), fs = $("#pm-f-status"), fp = $("#pm-f-padam");
    fb.innerHTML = "";
    fu.innerHTML = ""; fk.innerHTML = ""; fs.innerHTML = ""; fp.innerHTML = "";
    opt(fb, "all", "Semua Bulan");
    activeMonths().forEach(function (m) { opt(fb, String(m), MONTH_ID[m] + " " + YEAR); });
    fillWeeks();
    opt(fu, "all", "Semua ULP"); DATA.ULPS.forEach(function (u) { opt(fu, u.id, u.id + " — " + u.nama.replace("ULP ", "")); });
    opt(fk, "all", "Semua Kategori"); DATA.KATEGORI.forEach(function (k) { opt(fk, k, k); });
    opt(fs, "all", "Semua"); opt(fs, "SUDAH", "Sudah"); opt(fs, "BELUM", "Belum");
    opt(fp, "all", "Semua"); opt(fp, "padam", "Dengan Padam"); opt(fp, "tanpa", "Tanpa Padam");

    fb.onchange = function () { state.bulan = fb.value === "all" ? "all" : +fb.value; fillWeeks(); rerender(); };
    fm.onchange = function () { state.minggu = fm.value; rerender(); };
    fu.onchange = function () { state.ulp = fu.value; rerender(); };
    fk.onchange = function () { state.kat = fk.value; rerender(); };
    fs.onchange = function () { state.status = fs.value; rerender(); };
    fp.onchange = function () { state.padam = fp.value; rerender(); };
    $("#pm-f-q").oninput = function (e) { state.q = e.target.value; rerender(); };
    $("#pm-f-reset").onclick = function () {
      state.bulan = "all"; state.minggu = state.ulp = state.kat = state.status = state.padam = "all"; state.q = "";
      fb.value = "all"; fillWeeks();
      fu.value = fk.value = fs.value = fp.value = "all"; $("#pm-f-q").value = "";
      rerender();
    };
  }

  function kpi(label, value, sub, color) {
    var d = el("div", "kpi kpi--" + color);
    d.innerHTML = '<div class="kpi__label">' + label + '</div><div class="kpi__value">' + value + '</div><div class="kpi__sub">' + sub + '</div>';
    return d;
  }

  function renderKPI(data) {
    var n = data.length;
    var sudah = data.filter(function (r) { return r.done; }).length;
    var belum = n - sudah;
    var pct = n ? Math.round((sudah / n) * 100) : 0;
    var padam = data.filter(function (r) { return r.padamFlag; }).length;
    var tanpa = n - padam;
    var vol = Math.round(data.reduce(function (a, r) { return a + (+r.vol || 0); }, 0));
    var wrap = $("#pm-kpis"); wrap.innerHTML = "";
    wrap.appendChild(kpi("Total Pekerjaan", n, vol + " unit volume", "navy"));
    wrap.appendChild(kpi("Selesai", sudah, "status SUDAH", "green"));
    wrap.appendChild(kpi("Belum", belum, "menunggu realisasi", "amber"));
    wrap.appendChild(kpi("Progres", pct + "%", sudah + " dari " + n + " pekerjaan", "blue"));
    wrap.appendChild(kpi("Dengan Padam", padam, "perlu manuver beban", "red"));
    wrap.appendChild(kpi("Tanpa Padam", tanpa, "PDKB / hot-line", "teal"));
  }

  function destroyCharts() { Object.keys(charts).forEach(function (k) { if (charts[k]) { charts[k].destroy(); charts[k] = null; } }); }

  function gridFont() { return { family: "'Plus Jakarta Sans',sans-serif" }; }

  function renderCharts(data) {
    destroyCharts();
    var byKey = function (key) { var m = {}; data.forEach(function (r) { var k = r[key]; m[k] = (m[k] || 0) + 1; }); return m; };

    // Per ULP — stacked sudah/belum
    var ulpIds = DATA.ULPS.map(function (u) { return u.id; });
    var ulpSudah = ulpIds.map(function (id) { return data.filter(function (r) { return r.ulp === id && r.done; }).length; });
    var ulpBelum = ulpIds.map(function (id) { return data.filter(function (r) { return r.ulp === id && !r.done; }).length; });
    charts.ulp = new Chart($("#pm-ch-ulp"), {
      type: "bar",
      data: { labels: ulpIds, datasets: [
        { label: "Sudah", data: ulpSudah, backgroundColor: C.green, borderRadius: 4 },
        { label: "Belum", data: ulpBelum, backgroundColor: C.yellow, borderRadius: 4 }
      ] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: gridFont() } } },
        scales: { x: { stacked: true, grid: { display: false }, ticks: { font: gridFont() } },
                  y: { stacked: true, beginAtZero: true, ticks: { precision: 0, font: gridFont() } } } }
    });

    // Kategori — doughnut
    var katM = byKey("kategori");
    var katLabels = DATA.KATEGORI.filter(function (k) { return katM[k]; });
    charts.kat = new Chart($("#pm-ch-kat"), {
      type: "doughnut",
      data: { labels: katLabels, datasets: [{ data: katLabels.map(function (k) { return katM[k]; }),
        backgroundColor: katLabels.map(function (k) { return KAT_COLORS[k] || C.muted; }), borderWidth: 2, borderColor: "#fff" }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "58%",
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: gridFont() } } } }
    });

    // Per minggu — stacked (mengikuti bulan terpilih)
    var mIds = weeksForMonth(state.bulan);
    var mSudah = mIds.map(function (m) { return data.filter(function (r) { return r.minggu === m && r.done; }).length; });
    var mBelum = mIds.map(function (m) { return data.filter(function (r) { return r.minggu === m && !r.done; }).length; });
    charts.minggu = new Chart($("#pm-ch-minggu"), {
      type: "bar",
      data: { labels: mIds.map(function (m) { return weekShort(m); }), datasets: [
        { label: "Sudah", data: mSudah, backgroundColor: C.blue, borderRadius: 4 },
        { label: "Belum", data: mBelum, backgroundColor: C.line, borderRadius: 4 }
      ] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: gridFont() } } },
        scales: { x: { stacked: true, grid: { display: false }, ticks: { font: gridFont() } },
                  y: { stacked: true, beginAtZero: true, ticks: { precision: 0, font: gridFont() } } } }
    });

    // Padam — doughnut
    var padam = data.filter(function (r) { return r.padamFlag; }).length;
    charts.padam = new Chart($("#pm-ch-padam"), {
      type: "doughnut",
      data: { labels: ["Dengan Padam", "Tanpa Padam"], datasets: [{ data: [padam, data.length - padam],
        backgroundColor: [C.red, C.teal], borderWidth: 2, borderColor: "#fff" }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "58%",
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: gridFont() } } } }
    });

    // Per pelaksana — horizontal bar
    var pelM = byKey("pelaksana");
    var pel = Object.keys(pelM).sort(function (a, b) { return pelM[b] - pelM[a]; });
    charts.pelaksana = new Chart($("#pm-ch-pelaksana"), {
      type: "bar",
      data: { labels: pel, datasets: [{ label: "Jumlah Pekerjaan", data: pel.map(function (p) { return pelM[p]; }),
        backgroundColor: C.deep, borderRadius: 4 }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0, font: gridFont() }, grid: { color: C.line } },
                  y: { grid: { display: false }, ticks: { font: { family: gridFont().family, size: 10.5 } } } } }
    });
  }

  function renderULPCards(data) {
    var wrap = $("#pm-ulp-cards"); wrap.innerHTML = "";
    DATA.ULPS.forEach(function (u) {
      var d = data.filter(function (r) { return r.ulp === u.id; });
      var sudah = d.filter(function (r) { return r.done; }).length;
      var pct = d.length ? Math.round((sudah / d.length) * 100) : 0;
      var padam = d.filter(function (r) { return r.padamFlag; }).length;
      var st = pct >= 80 ? "ok" : pct >= 50 ? "warn" : "bad";
      var stTxt = pct >= 80 ? "On Track" : pct >= 50 ? "Proses" : "Tertinggal";
      var card = el("div", "mit-card");
      card.innerHTML =
        '<div class="mit-head">' +
          '<div class="mit-ico" style="color:' + C.blue + '"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18.3 5.7 21l6.7-6.3a4 4 0 0 0 5.3-5.4l-2.6 2.6-2.1-2.1z"/></svg></div>' +
          '<div class="mit-head-txt"><div class="mit-ulp">' + u.id + '</div><div class="mit-meta">' + u.nama + '</div></div>' +
          '<span class="status status--' + st + '">' + stTxt + '</span>' +
        '</div>' +
        '<div class="mit-prog">' +
          '<div class="mit-prog-top"><span>Realisasi Pekerjaan</span><span class="mit-prog-pct">' + pct + '%</span></div>' +
          '<div class="mit-prog-bar"><span style="width:' + pct + '%"></span></div>' +
          '<div class="mit-prog-sub">' + sudah + ' selesai · ' + (d.length - sudah) + ' belum · ' + d.length + ' total</div>' +
        '</div>' +
        '<div class="mit-chips">' +
          '<span class="mit-chip">⚡ ' + padam + ' dengan padam</span>' +
          '<span class="mit-chip">✓ ' + (d.length - padam) + ' tanpa padam</span>' +
        '</div>';
      wrap.appendChild(card);
    });
  }

  function renderTable(data) {
    var sorted = data.slice();
    var k = state.sortKey, dir = state.sortDir === "asc" ? 1 : -1;
    sorted.sort(function (a, b) {
      var va, vb;
      if (k === "tgl") { va = a.dateKey || ""; vb = b.dateKey || ""; }
      else if (k === "vol") { va = +a.vol || 0; vb = +b.vol || 0; }
      else { va = (a[k] || "").toString().toLowerCase(); vb = (b[k] || "").toString().toLowerCase(); }
      if (va < vb) return -1 * dir; if (va > vb) return 1 * dir; return 0;
    });
    var tb = $("#pm-tbody"); tb.innerHTML = "";
    var frag = document.createDocumentFragment();
    sorted.forEach(function (r) {
      var tr = document.createElement("tr");
      var pill = r.done ? '<span class="pill pill--ok">Sudah</span>' : '<span class="pill pill--warn">Belum</span>';
      var padam = r.padamFlag ? '<span style="color:' + C.red + ';font-weight:700">' + r.padam + '</span>' : '<span class="muted">' + r.padam + '</span>';
      tr.innerHTML =
        '<td class="nowrap mono sm">' + (r.tanggalStr || r.tanggalRaw || "") + '</td>' +
        '<td class="nowrap"><b>' + r.ulp + '</b></td>' +
        '<td class="nowrap">' + r.kategori + '</td>' +
        '<td>' + r.pekerjaan + '</td>' +
        '<td class="nowrap mono">' + (r.vol || "") + ' ' + (r.sat || "") + '</td>' +
        '<td class="nowrap">' + (r.penyulang || "") + '</td>' +
        '<td class="nowrap sm">' + padam + '</td>' +
        '<td class="sm">' + (r.pelaksana || "") + '</td>' +
        '<td class="detail">' + (r.lokasi || "") + '</td>' +
        '<td class="nowrap mono sm">' + (r.wo || "") + '</td>' +
        '<td>' + pill + '</td>';
      frag.appendChild(tr);
    });
    tb.appendChild(frag);
    $("#pm-count").textContent = sorted.length + " pekerjaan";

    document.querySelectorAll("#view-pemeliharaan th[data-sort]").forEach(function (th) {
      th.classList.toggle("sorted", th.dataset.sort === state.sortKey);
      th.dataset.dir = th.dataset.sort === state.sortKey ? state.sortDir : "";
    });
  }

  function bindSort() {
    document.querySelectorAll("#view-pemeliharaan th[data-sort]").forEach(function (th) {
      th.onclick = function () {
        var key = th.dataset.sort;
        if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else { state.sortKey = key; state.sortDir = key === "tgl" ? "asc" : "asc"; }
        rerender();
      };
    });
  }

  function rerender() {
    var data = filtered();
    renderKPI(data);
    renderCharts(data);
    renderULPCards(data);
    renderTable(data);
  }

  // ---------- Live loader dari Google Spreadsheet (per tab/ULP) ----------
  var LIVE_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5tUFzCDx7tWCAFGU4V-WK05jqLzhf6mljZpEoW010H2BP_Jv4rzQVKN2kco_QsopIfEJ_O9Ihqewv/pub?single=true&output=csv&gid=";
  var LIVE_GIDS = ["0", "492717364", "728289132", "563582205"]; // Sorong Kota, Aimas, Waisai, Teminabuan
  var ULP_MAP = {
    "SORONG KOTA": { id: "SKT", nama: "ULP Sorong Kota" },
    "AIMAS": { id: "AIM", nama: "ULP Aimas" },
    "WAISAI": { id: "WSI", nama: "ULP Waisai" },
    "TEMINABUAN": { id: "TMB", nama: "ULP Teminabuan" }
  };
  var MON_LC = { januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5, juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11 };
  var ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  var DAY_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  function pCSV(t) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else { if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; } else if (c === "\r") {} else f += c; }
    }
    if (f.length || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function colMap(H) {
    function f(re) { for (var i = 0; i < H.length; i++) { if (re.test((H[i] || "").toUpperCase())) return i; } return -1; }
    return { ulp: f(/ULP/), tgl: f(/TANGGAL/), kat: f(/KATEGORI/), pek: f(/PEKERJAAN/), sat: f(/SATUAN|SAT/), vol: f(/VOLUME|VOL/), pny: f(/PENYULANG/), padam: f(/PADAM/), pelaksana: f(/PELAKSANA/), lokasi: f(/LOKASI/), progres: f(/PROGRES/), wo: f(/WO|SPBJ/) };
  }
  function normKat(s) {
    var k = String(s || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (k === "PHBTM" || k === "PHB") return "PHB-TM";
    if (k === "SRAPP" || k === "SR") return "SR-APP";
    if (k === "JTM") return "JTM"; if (k === "JTR") return "JTR"; if (k === "GARDU") return "GARDU";
    return String(s || "").trim().toUpperCase();
  }
  function parseTgl(s) {
    var m = String(s || "").match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (!m) return null;
    var mi = MON_LC[m[2].toLowerCase()]; if (mi == null) return null;
    return new Date(+m[3], mi, +m[1]);
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function numId(s) { var n = parseFloat(String(s == null ? "" : s).trim().replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; }

  function buildLive(texts) {
    var rows = [], ulpSet = {}, katSet = {}, pelSet = {}, mingguMeta = {};
    texts.forEach(function (txt) {
      if (!txt || txt.length < 50) return;
      var grid = pCSV(txt); if (grid.length < 2) return;
      var M = colMap(grid[0]); if (M.ulp < 0 || M.tgl < 0) return;
      var counter = 0;
      for (var i = 1; i < grid.length; i++) {
        var r = grid[i];
        var ulpRaw = (r[M.ulp] || "").trim();
        var pek = (r[M.pek] || "").trim();
        var katRaw = (r[M.kat] || "").trim();
        if (!ulpRaw || !pek || !katRaw) continue;
        var d = parseTgl(r[M.tgl]); if (!d || d.getFullYear() !== YEAR) continue;
        var uName = ulpRaw.toUpperCase();
        var um = ULP_MAP[uName] || { id: uName.slice(0, 3), nama: "ULP " + ulpRaw };
        var mi = d.getMonth();
        var wk = Math.min(6, Math.ceil(d.getDate() / 7));
        var minggu = "Minggu " + ROMAN[wk - 1] + " " + MONTH_ID[mi] + " " + YEAR;
        mingguMeta[minggu] = mi * 10 + wk;
        var kat = normKat(katRaw);
        var padTxt = (r[M.padam] || "").trim();
        var padamFlag = /padam/i.test(padTxt) && !/tanpa/i.test(padTxt);
        var prog = (r[M.progres] || "").trim().toUpperCase();
        var done = prog === "SUDAH";
        var pel = (r[M.pelaksana] || "").trim() || "—";
        var dk = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
        counter++;
        ulpSet[um.id] = um.nama; katSet[kat] = 1; if (pel !== "—") pelSet[pel] = 1;
        rows.push({
          ulp: um.id, ulpNama: um.nama, minggu: minggu,
          date: d, dateKey: dk,
          tanggalStr: DAY_ID[d.getDay()] + ", " + pad(d.getDate()) + " " + MONTH_ID[d.getMonth()].slice(0, 3) + " " + d.getFullYear(),
          tanggalFull: r[M.tgl],
          kategori: kat, pekerjaan: pek,
          vol: numId(r[M.vol]), sat: (r[M.sat] || "").trim(),
          penyulang: (r[M.pny] || "").trim(),
          padam: padTxt || "—", padamFlag: padamFlag,
          pelaksana: pel, lokasi: (r[M.lokasi] || "").trim(),
          progres: done ? "SUDAH" : "BELUM", done: done,
          wo: (r[M.wo] || "").trim(), id: um.id + "-" + pad(counter)
        });
      }
    });
    if (!rows.length) return null;
    var KAT_ORDER = ["PHB-TM", "JTM", "GARDU", "JTR", "SR-APP"];
    var ULPS = Object.keys(ulpSet).map(function (id) { return { id: id, nama: ulpSet[id] }; });
    var MINGGU = Object.keys(mingguMeta).sort(function (a, b) { return mingguMeta[a] - mingguMeta[b]; });
    return {
      source: "live", rows: rows, ULPS: ULPS,
      KATEGORI: KAT_ORDER.filter(function (k) { return katSet[k]; }).concat(Object.keys(katSet).filter(function (k) { return KAT_ORDER.indexOf(k) < 0; })),
      PADAM_TYPES: ["Padam", "Tanpa Padam"],
      PELAKSANA: Object.keys(pelSet).sort(),
      MINGGU: MINGGU
    };
  }

  function loadLive() {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;
    return Promise.all(LIVE_GIDS.map(function (g) {
      return fetch(LIVE_BASE + g, { mode: "cors", signal: ctrl ? ctrl.signal : undefined })
        .then(function (res) { return res.ok ? res.text() : ""; })
        .catch(function () { return ""; });
    })).then(function (texts) {
      if (to) clearTimeout(to);
      var live = buildLive(texts);
      if (live) {
        DATA = live;
        var badge = document.querySelector("#pm-tabcount");
        if (badge) badge.textContent = live.rows.length;
        buildFilters();
        rerender();
      }
    }).catch(function () { /* tetap pakai data tertanam */ });
  }

  window.Pemeliharaan = {
    loadLive: loadLive,
    init: function () {
      DATA = window.PLN || window.PLN_DATA;
      if (!DATA || !DATA.rows) { console.warn("PLN data tidak tersedia"); return; }
      buildFilters();
      bindSort();
      rerender();
      loadLive();
    }
  };
})();
