// Perbandingan volume gangguan per minggu: dua bulan yang dapat dipilih bebas (tahun 2025).
(function () {
  const $ = (s) => document.querySelector(s);
  const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  let ALL = [];
  let chart = null;

  function weekOfMonth(day) {
    if (day <= 7) return 0;
    if (day <= 14) return 1;
    if (day <= 21) return 2;
    if (day <= 28) return 3;
    return 4;
  }

  function monthKey(d) { return d.getFullYear() * 12 + d.getMonth(); }
  function keyToLabel(k) { const y = Math.floor(k / 12), m = k % 12; return MONTH_NAMES[m] + " " + y; }
  function validDate(d) { return d && !isNaN(d.getTime()) && d.getFullYear() === 2026; }

  function buildMonthOptions() {
    const present = {};
    ALL.forEach((r) => { if (validDate(r.tgl)) present[monthKey(r.tgl)] = true; });
    const keys = Object.keys(present).map(Number).sort((a, b) => b - a);
    const opts = keys.map((k) => `<option value="${k}">${keyToLabel(k)}</option>`).join("");
    $("#mom-month-a").innerHTML = opts;
    $("#mom-month-b").innerHTML = opts;
    return keys;
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
  function recJenis(r) { return jenisSumber(r.sumber || r.aset); }

  function buildUlpOptions() {
    const ulps = Array.from(new Set(ALL.filter((r) => validDate(r.tgl)).map((r) => r.ulp).filter(Boolean))).sort();
    const sel = $("#mom-ulp");
    sel.innerHTML = `<option value="all">Semua ULP</option>` + ulps.map((u) => `<option value="${u}">${u}</option>`).join("");
  }

  function buildJenisOptions() {
    const aset = Array.from(new Set(ALL.filter((r) => validDate(r.tgl)).map((r) => r.aset).filter(Boolean))).sort();
    const sel = $("#mom-jenis");
    sel.innerHTML = `<option value="all">Semua Aset</option>` + aset.map((a) => `<option value="${a}">${a}</option>`).join("");
  }

  function monthRows(rows, key) {
    return rows.filter((r) => validDate(r.tgl) && monthKey(r.tgl) === key);
  }

  function weeklyCounts(rows, key) {
    const counts = [0, 0, 0, 0, 0];
    monthRows(rows, key).forEach((r) => { counts[weekOfMonth(r.tgl.getDate())]++; });
    return counts;
  }

  function renderDetail(rows, key, tbodyId, titleId, countId, label) {
    const list = monthRows(rows, key).slice().sort((a, b) => a.tgl - b.tgl);
    $(titleId).textContent = "Rincian Kejadian — " + label;
    $(countId).textContent = list.length + " kejadian";
    $(tbodyId).innerHTML = list.map((r) => `
      <tr>
        <td class="nowrap mono">${r.tanggal || "—"}</td>
        <td><strong>${r.ulp || "—"}</strong></td>
        <td>${r.aset || "—"}</td>
        <td class="nowrap mono">${r.durasi || "—"}</td>
        <td>${r.kode || "—"}</td>
        <td>${r.kelompok || r.detail || "—"}</td>
      </tr>`).join("") || `<tr><td colspan="6" class="muted" style="text-align:center; padding:16px">Tidak ada kejadian</td></tr>`;
  }

  function render() {
    const keyA = parseInt($("#mom-month-a").value, 10);
    const keyB = parseInt($("#mom-month-b").value, 10);
    const selectedUlp = $("#mom-ulp").value;
    const selectedJenis = $("#mom-jenis").value;
    const rows = ALL.filter((r) =>
      (selectedUlp === "all" || r.ulp === selectedUlp) &&
      (selectedJenis === "all" || r.aset === selectedJenis));

    const currA = weeklyCounts(rows, keyA);
    const currB = weeklyCounts(rows, keyB);
    const totalA = currA.reduce((a, b) => a + b, 0);
    const totalB = currB.reduce((a, b) => a + b, 0);
    const delta = totalB ? ((totalA - totalB) / totalB) * 100 : (totalA ? 100 : 0);
    const naik = delta > 0;

    $("#mom-title").textContent = keyToLabel(keyA) + " vs " + keyToLabel(keyB);
    $("#mom-sub").textContent = (selectedUlp === "all" ? "Semua ULP" : selectedUlp) + " · " + (selectedJenis === "all" ? "Semua Aset" : selectedJenis) + " · dipecah per minggu (Minggu 1 = tgl 1–7, dst.)";

    $("#mom-kpis").innerHTML = `
      <div class="kpi kpi--blue"><div class="kpi__label">Volume ${keyToLabel(keyA)}</div><div class="kpi__value">${totalA}</div><div class="kpi__sub">kejadian</div></div>
      <div class="kpi kpi--teal"><div class="kpi__label">Volume ${keyToLabel(keyB)}</div><div class="kpi__value">${totalB}</div><div class="kpi__sub">kejadian</div></div>
      <div class="kpi ${naik ? "kpi--red" : "kpi--green"}"><div class="kpi__label">Perubahan A vs B</div><div class="kpi__value">${naik ? "▲" : "▼"} ${Math.abs(delta).toFixed(1)}%</div><div class="kpi__sub">${naik ? "meningkat" : "menurun"} dibanding Bulan B</div></div>`;

    if (chart) chart.destroy();
    chart = new Chart($("#ch-mom-week"), {
      type: "bar",
      data: {
        labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5"],
        datasets: [
          { label: keyToLabel(keyB), data: currB, backgroundColor: "#CBDCEE", borderRadius: 4 },
          { label: keyToLabel(keyA), data: currA, backgroundColor: "#1273C4", borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 11, font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#EEF2F7" } }, x: { grid: { display: false } } }
      }
    });

    renderDetail(rows, keyA, "#mom-detail-a", "#mom-detail-a-title", "#mom-detail-a-count", keyToLabel(keyA));
    renderDetail(rows, keyB, "#mom-detail-b", "#mom-detail-b-title", "#mom-detail-b-count", keyToLabel(keyB));
  }

  function init() {
    if (!window.GangguanData) return;
    window.GangguanData.load().then((records) => {
      ALL = records;
      const keys = buildMonthOptions();
      buildUlpOptions();
      buildJenisOptions();
      if (!keys.length) return;
      $("#mom-month-a").value = String(keys[0]);
      $("#mom-month-b").value = String(keys[1] != null ? keys[1] : keys[0]);
      ["#mom-month-a", "#mom-month-b", "#mom-ulp", "#mom-jenis"].forEach((id) => $(id).addEventListener("change", render));
      render();
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
