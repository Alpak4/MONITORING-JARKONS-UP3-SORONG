// Grafik kinerja — dibangun di atas Chart.js. Palet warna PLN.
(function () {
  if (window.Chart && Chart.defaults) { Chart.defaults.animation = false; Chart.defaults.animations = false; Chart.defaults.resizeDelay = 200; }
  const PLN = {
    blue: "#1273C4",
    blueDeep: "#0E5C9C",
    navy: "#333333",
    yellow: "#F4B400",
    red: "#E2231A",
    green: "#1F9D57",
    teal: "#1F9D57",
    orange: "#F4B400",
    gold: "#F4B400",
    goldDeep: "#C68F00",
    grayText: "#5B6573",
    grid: "rgba(51,51,51,0.08)",
  };
  // Palet kategorikal: Merah · Biru · Kuning · Hijau
  const CORP = ["#E2231A", "#1273C4", "#F4B400", "#1F9D57"];
  // palet kategori (penyebab) — siklus Merah/Biru/Kuning/Hijau
  const CAUSE_COLORS = {
    "E1": "#E2231A",
    "E2": "#1273C4",
    "E3": "#F4B400",
    "E4": "#1F9D57",
    "I1": "#E2231A",
    "I2": "#1273C4",
    "I3": "#F4B400",
    "I4": "#1F9D57",
    "X":  "#9AA6B2",
  };

  const instances = {};
  function destroy(id) { if (instances[id]) { instances[id].destroy(); delete instances[id]; } }

  function baseOpts(extra) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#073B6B",
          padding: 10,
          titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: "700", size: 12 },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          cornerRadius: 8,
        },
      },
    }, extra || {});
  }
  const FONT = { family: "'Plus Jakarta Sans', sans-serif" };

  function tickFont() { return Object.assign({ size: 11 }, FONT); }

  // ---- Plugin label nilai (jumlah) di atas/di dalam grafik ----
  function vfont(size, weight) { return `${weight || "700"} ${size || 11}px 'Plus Jakarta Sans', sans-serif`; }

  // Bar vertikal: nilai di atas batang
  const vBarLabels = {
    id: "vBarLabels",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx; ctx.save();
      ctx.font = vfont(11.5, "700"); ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillStyle = "#073B6B";
      chart.data.datasets.forEach((ds, di) => {
        chart.getDatasetMeta(di).data.forEach((el, i) => {
          const v = ds.data[i]; if (v == null || v === 0) return;
          ctx.fillText(v, el.x, el.y - 3);
        });
      });
      ctx.restore();
    },
  };

  // Bar bertumpuk: nilai di tengah tiap segmen + total di atas
  const stackLabels = {
    id: "stackLabels",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx; ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      chart.data.datasets.forEach((ds, di) => {
        chart.getDatasetMeta(di).data.forEach((el, i) => {
          const v = ds.data[i]; if (v == null || v === 0) return;
          if (Math.abs(el.base - el.y) < 14) return;
          ctx.font = vfont(10.5, "700"); ctx.fillStyle = "#fff";
          ctx.fillText(v, el.x, (el.y + el.base) / 2);
        });
      });
      const n = chart.data.labels.length;
      ctx.font = vfont(11.5, "800"); ctx.fillStyle = "#073B6B"; ctx.textBaseline = "bottom";
      for (let i = 0; i < n; i++) {
        let tot = 0, topY = Infinity, x = 0;
        chart.data.datasets.forEach((ds, di) => {
          tot += ds.data[i] || 0;
          const el = chart.getDatasetMeta(di).data[i];
          if (el && el.y < topY) { topY = el.y; x = el.x; }
        });
        if (tot > 0) ctx.fillText(tot, x, topY - 3);
      }
      ctx.restore();
    },
  };

  // Bar horizontal: nilai di ujung kanan batang
  const hBarLabels = {
    id: "hBarLabels",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx; ctx.save();
      ctx.font = vfont(11, "700"); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#073B6B";
      chart.data.datasets.forEach((ds, di) => {
        chart.getDatasetMeta(di).data.forEach((el, i) => {
          const v = ds.data[i]; if (v == null || v === 0) return;
          ctx.fillText(v, el.x + 5, el.y);
        });
      });
      ctx.restore();
    },
  };

  // Doughnut: nilai di dalam tiap irisan
  const arcLabels = {
    id: "arcLabels",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx; ctx.save();
      ctx.font = vfont(12, "800"); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
      chart.getDatasetMeta(0).data.forEach((arc, i) => {
        const v = chart.data.datasets[0].data[i]; if (!v) return;
        if ((arc.endAngle - arc.startAngle) < 0.28) return;
        const ang = (arc.startAngle + arc.endAngle) / 2;
        const r = (arc.innerRadius + arc.outerRadius) / 2;
        ctx.fillText(v, arc.x + Math.cos(ang) * r, arc.y + Math.sin(ang) * r);
      });
      ctx.restore();
    },
  };

  // ---- Tren per periode (bar bertumpuk: <5 vs >5) ----
  function tren(ctx, data) {
    destroy("tren");
    const periodes = data.periodes;
    const u5 = periodes.map((p) => data.byPeriode[p].under5);
    const o5 = periodes.map((p) => data.byPeriode[p].over5);
    instances.tren = new Chart(ctx, {
      type: "bar",
      plugins: [stackLabels],
      data: {
        labels: periodes.map((p) => p.replace(" 2025", "")),
        datasets: [
          { label: "≤ 5 menit", data: u5, backgroundColor: PLN.blue, borderRadius: 5, stack: "s" },
          { label: "> 5 menit", data: o5, backgroundColor: PLN.yellow, borderRadius: 5, stack: "s" },
        ],
      },
      options: baseOpts({
        plugins: { legend: { display: true, position: "bottom", labels: { font: tickFont(), usePointStyle: true, pointStyle: "rectRounded", padding: 14 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: tickFont(), color: PLN.grayText } },
          y: { beginAtZero: true, grace: "12%", grid: { color: PLN.grid }, ticks: { font: tickFont(), color: PLN.grayText, precision: 0 } },
        },
      }),
    });
  }

  // ---- Gangguan per ULP (horizontal bar) ----
  function perUlp(ctx, data) {
    destroy("ulp");
    const arr = data.ulpRanked;
    instances.ulp = new Chart(ctx, {
      type: "bar",
      plugins: [hBarLabels],
      data: {
        labels: arr.map((x) => x.ulp),
        datasets: [{
          data: arr.map((x) => x.total),
          backgroundColor: arr.map((_, i) => i === 0 ? PLN.red : PLN.blue),
          borderRadius: 6,
          barThickness: 22,
        }],
      },
      options: baseOpts({
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true, grace: "10%", grid: { color: PLN.grid }, ticks: { font: tickFont(), color: PLN.grayText, precision: 0 } },
          y: { grid: { display: false }, ticks: { font: Object.assign({ size: 12, weight: "600" }, FONT), color: PLN.navy } },
        },
      }),
    });
  }

  // ---- Komposisi penyebab (doughnut) ----
  function penyebab(ctx, data) {
    destroy("cause");
    const arr = data.causeRanked;
    instances.cause = new Chart(ctx, {
      type: "doughnut",
      plugins: [arcLabels],
      data: {
        labels: arr.map((x) => (window.GangguanData.CAUSE_LABELS[x.code] || x.code)),
        datasets: [{
          data: arr.map((x) => x.n),
          backgroundColor: arr.map((x) => CAUSE_COLORS[x.code] || "#9AA6B2"),
          borderColor: "#fff",
          borderWidth: 2,
        }],
      },
      options: baseOpts({
        cutout: "62%",
        plugins: {
          legend: { display: true, position: "right", labels: { font: tickFont(), usePointStyle: true, pointStyle: "circle", padding: 9, color: PLN.navy } },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} (${Math.round(c.parsed / arr.reduce((s, x) => s + x.n, 0) * 100)}%)` } },
        },
      }),
    });
  }

  // ---- Per zona (bar) ----
  function perZona(ctx, data) {
    destroy("zona");
    const arr = data.zonaRanked;
    instances.zona = new Chart(ctx, {
      type: "bar",
      plugins: [vBarLabels],
      data: {
        labels: arr.map((x) => x.zona),
        datasets: [{ data: arr.map((x) => x.n), backgroundColor: PLN.teal, borderRadius: 6, barThickness: 30 }],
      },
      options: baseOpts({
        scales: {
          x: { grid: { display: false }, ticks: { font: tickFont(), color: PLN.navy } },
          y: { beginAtZero: true, grace: "12%", grid: { color: PLN.grid }, ticks: { font: tickFont(), color: PLN.grayText, precision: 0 } },
        },
      }),
    });
  }

  // ---- Cuaca (doughnut) ----
  function cuaca(ctx, data) {
    destroy("cuaca");
    const arr = data.cuacaRanked;
    const colorMap = { "Hujan Angin": PLN.blue, "Cerah": PLN.yellow };
    instances.cuaca = new Chart(ctx, {
      type: "doughnut",
      plugins: [arcLabels],
      data: {
        labels: arr.map((x) => x.k || "Lainnya"),
        datasets: [{
          data: arr.map((x) => x.n),
          backgroundColor: arr.map((x) => colorMap[x.k] || "#9AA6B2"),
          borderColor: "#fff", borderWidth: 2,
        }],
      },
      options: baseOpts({
        cutout: "62%",
        plugins: { legend: { display: true, position: "bottom", labels: { font: tickFont(), usePointStyle: true, pointStyle: "circle", padding: 12, color: PLN.navy } } },
      }),
    });
  }

  // ---- Indikasi GF vs OC (bar) ----
  function indikasi(ctx, data) {
    destroy("indikasi");
    const arr = data.indikasiRanked;
    instances.indikasi = new Chart(ctx, {
      type: "bar",
      plugins: [vBarLabels],
      data: {
        labels: arr.map((x) => x.k),
        datasets: [{ data: arr.map((x) => x.n), backgroundColor: [PLN.blueDeep, PLN.orange, PLN.green], borderRadius: 6, barThickness: 46 }],
      },
      options: baseOpts({
        scales: {
          x: { grid: { display: false }, ticks: { font: Object.assign({ size: 11, weight: "600" }, FONT), color: PLN.navy } },
          y: { beginAtZero: true, grace: "14%", grid: { color: PLN.grid }, ticks: { font: tickFont(), color: PLN.grayText, precision: 0 } },
        },
      }),
    });
  }

  // ---- Gangguan per Jenis Peralatan / Sumber (horizontal bar) ----
  function perJenis(ctx, data) {
    destroy("jenis");
    const arr = data.jenisRanked;
    const pal = [PLN.blue, PLN.teal, PLN.orange, PLN.green, PLN.blueDeep, "#7A5BD0", "#B07B2B", "#9AA6B2"];
    instances.jenis = new Chart(ctx, {
      type: "bar",
      plugins: [hBarLabels],
      data: {
        labels: arr.map((x) => x.k),
        datasets: [{ data: arr.map((x) => x.n), backgroundColor: arr.map((_, i) => pal[i % pal.length]), borderRadius: 6, barThickness: 22 }],
      },
      options: baseOpts({
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true, grace: "10%", grid: { color: PLN.grid }, ticks: { font: tickFont(), color: PLN.grayText, precision: 0 } },
          y: { grid: { display: false }, ticks: { font: Object.assign({ size: 11.5, weight: "600" }, FONT), color: PLN.navy } },
        },
      }),
    });
  }

  // ---- Kinerja Perbaikan: diverging horizontal bar (% turun/naik per ULP) ----
  const divBarLabels = {
    id: "divBarLabels",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx; ctx.save();
      ctx.font = vfont(11.5, "800"); ctx.textBaseline = "middle";
      chart.getDatasetMeta(0).data.forEach((el, i) => {
        const v = chart.data.datasets[0].data[i];
        if (v == null) return;
        const txt = (v > 0 ? "+" : "") + v + "%";
        if (v < 0) { ctx.textAlign = "right"; ctx.fillStyle = "#157A43"; ctx.fillText(txt, el.x - 6, el.y); }
        else if (v > 0) { ctx.textAlign = "left"; ctx.fillStyle = "#B81910"; ctx.fillText(txt, el.x + 6, el.y); }
        else { ctx.textAlign = "left"; ctx.fillStyle = PLN.grayText; ctx.fillText("0%", el.x + 6, el.y); }
      });
      ctx.restore();
    },
  };

  function kinerja(ctx, data) {
    destroy("kinerja");
    const arr = data.rows;
    let maxAbs = 10;
    arr.forEach((x) => { maxAbs = Math.max(maxAbs, Math.abs(x.pct)); });
    const lim = Math.ceil((maxAbs * 1.18) / 5) * 5;
    instances.kinerja = new Chart(ctx, {
      type: "bar",
      plugins: [divBarLabels],
      data: {
        labels: arr.map((x) => x.ulp),
        datasets: [{
          data: arr.map((x) => x.pct),
          backgroundColor: arr.map((x) => x.pct < 0 ? PLN.green : x.pct > 0 ? PLN.red : "#C2CCD8"),
          borderRadius: 6,
          barThickness: 24,
        }],
      },
      options: baseOpts({
        indexAxis: "y",
        layout: { padding: { left: 8, right: 8 } },
        scales: {
          x: {
            min: -lim, max: lim,
            grid: { color: (c) => c.tick.value === 0 ? "rgba(7,59,107,.45)" : PLN.grid, lineWidth: (c) => c.tick.value === 0 ? 1.5 : 1 },
            ticks: { font: tickFont(), color: PLN.grayText, callback: (v) => v + "%" },
          },
          y: { grid: { display: false }, ticks: { font: Object.assign({ size: 12, weight: "700" }, FONT), color: PLN.navy } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (c) => {
                const v = c.parsed.x;
                if (v < 0) return ` Turun ${Math.abs(v)}% (membaik)`;
                if (v > 0) return ` Naik ${v}% (memburuk)`;
                return " Stabil (0%)";
              },
            },
          },
        },
      }),
    });
  }

  // ---- Kinerja MoM: garis % perubahan dari bulan sebelumnya per ULP ----
  const ULP_COLORS = ["#E2231A", "#1273C4", "#F4B400", "#1F9D57"];
  // label nilai % di tiap titik garis (per ULP)
  const momPointLabels = {
    id: "momPointLabels",
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx; ctx.save();
      ctx.font = vfont(10.5, "800"); ctx.textAlign = "center";
      chart.data.datasets.forEach((ds, di) => {
        const meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach((el, i) => {
          const v = ds.data[i]; if (v == null) return;
          const txt = (v > 0 ? "+" : "") + v + "%";
          const up = v <= 0;                 // turun/stabil → label di atas, naik → di bawah
          ctx.textBaseline = up ? "bottom" : "top";
          const y = up ? el.y - 6 : el.y + 6;
          ctx.lineWidth = 3; ctx.strokeStyle = "#fff";
          ctx.strokeText(txt, el.x, y);
          ctx.fillStyle = ds.borderColor;
          ctx.fillText(txt, el.x, y);
        });
      });
      ctx.restore();
    },
  };

  function kinerjaMoM(ctx, data) {
    destroy("kinerjaMoM");
    const series = data.series || [];
    const labels = data.labels || [];
    let maxAbs = 20;
    series.forEach((s) => s.data.forEach((v) => { if (v != null) maxAbs = Math.max(maxAbs, Math.abs(v)); }));
    const lim = Math.ceil((maxAbs * 1.12) / 10) * 10;
    instances.kinerjaMoM = new Chart(ctx, {
      type: "line",
      plugins: [momPointLabels],
      data: {
        labels,
        datasets: series.map((s, i) => {
          const c = ULP_COLORS[i % ULP_COLORS.length];
          return {
            label: s.ulp,
            data: s.data,
            borderColor: c,
            backgroundColor: c,
            borderWidth: 2.4,
            pointRadius: 3.5,
            pointHoverRadius: 5,
            tension: 0.25,
            spanGaps: true,
          };
        }),
      },
      options: baseOpts({
        layout: { padding: { top: 6, right: 12, left: 4 } },
        interaction: { mode: "nearest", intersect: false },
        scales: {
          y: {
            min: -lim, max: lim,
            grid: { color: (c) => c.tick.value === 0 ? "rgba(7,59,107,.45)" : PLN.grid, lineWidth: (c) => c.tick.value === 0 ? 1.5 : 1 },
            ticks: { font: tickFont(), color: PLN.grayText, callback: (v) => (v > 0 ? "+" : "") + v + "%" },
          },
          x: { grid: { display: false }, ticks: { font: Object.assign({ size: 12, weight: "700" }, FONT), color: PLN.navy } },
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: { usePointStyle: true, pointStyle: "line", boxWidth: 24, font: Object.assign({ size: 11.5, weight: "600" }, FONT), color: PLN.navy, padding: 14 },
          },
          tooltip: {
            callbacks: {
              title: (items) => "Bulan " + items[0].label,
              label: (c) => {
                const v = c.parsed.y;
                const tag = v < 0 ? `turun ${Math.abs(v)}% (membaik)` : v > 0 ? `naik ${v}% (memburuk)` : "stabil (0%)";
                return ` ${c.dataset.label}: ${tag}`;
              },
            },
          },
        },
      }),
    });
  }

  // ---- Indikasi Proteksi FGTM: donut GF/OC/UFR ----
  const IND_COLORS = { GF: "#E2231A", OC: "#1273C4", UFR: "#F4B400" };
  function indikasiDonut(ctx, data) {
    destroy("indDonut");
    const codes = data.codes || [];
    instances.indDonut = new Chart(ctx, {
      type: "doughnut",
      plugins: [arcLabels],
      data: {
        labels: codes.map((c) => c),
        datasets: [{
          data: codes.map((c) => data.totals[c] || 0),
          backgroundColor: codes.map((c) => IND_COLORS[c] || PLN.blue),
          borderColor: "#fff", borderWidth: 2,
        }],
      },
      options: baseOpts({
        cutout: "58%",
        plugins: {
          legend: { display: true, position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", font: tickFont(), color: PLN.navy, padding: 14 } },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} kejadian` } },
        },
      }),
    });
  }

  // ---- Indikasi per ULP: bar bertumpuk GF/OC/UFR ----
  function indikasiUlp(ctx, data) {
    destroy("indUlp");
    const ulps = data.ulps || [];
    const codes = data.codes || [];
    instances.indUlp = new Chart(ctx, {
      type: "bar",
      plugins: [stackLabels],
      data: {
        labels: ulps,
        datasets: codes.map((c) => ({
          label: c,
          data: ulps.map((u) => (data.byUlp[u] && data.byUlp[u][c]) || 0),
          backgroundColor: IND_COLORS[c] || PLN.blue,
          borderRadius: 4, stack: "s",
        })),
      },
      options: baseOpts({
        plugins: { legend: { display: true, position: "bottom", labels: { usePointStyle: true, pointStyle: "rectRounded", font: tickFont(), color: PLN.navy, padding: 14 } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: Object.assign({ size: 11.5, weight: "600" }, FONT), color: PLN.navy } },
          y: { beginAtZero: true, grace: "12%", grid: { color: PLN.grid }, ticks: { font: tickFont(), color: PLN.grayText, precision: 0 } },
        },
      }),
    });
  }

  // ---- Waktu Trip: Siang vs Malam (doughnut) ----
  function waktu(ctx, data) {
    destroy("waktu");
    const arr = data.waktuRanked;
    instances.waktu = new Chart(ctx, {
      type: "doughnut",
      plugins: [arcLabels],
      data: {
        labels: arr.map((x) => x.k),
        datasets: [{ data: arr.map((x) => x.n), backgroundColor: [PLN.orange, PLN.blueDeep], borderColor: "#fff", borderWidth: 2 }],
      },
      options: baseOpts({
        cutout: "62%",
        plugins: {
          legend: { display: true, position: "bottom", labels: { font: tickFont(), usePointStyle: true, pointStyle: "circle", padding: 12, color: PLN.navy } },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} (${Math.round(c.parsed / arr.reduce((s, x) => s + x.n, 0) * 100)}%)` } },
        },
      }),
    });
  }

  window.Charts = { tren, perUlp, penyebab, perZona, cuaca, indikasi, waktu, perJenis, kinerja, kinerjaMoM, indikasiDonut, indikasiUlp, CAUSE_COLORS, PLN, destroyAll: () => Object.keys(instances).forEach(destroy) };
})();
