(function(){
  let initialized = false;
  function initAO(){
  if(initialized) return;
  initialized = true;
  const AO = window.AO;
  const fmtRp = n => "Rp " + Math.round(n).toLocaleString("id-ID");
  const fmtRpShort = n => {
    const abs = Math.abs(n);
    let s;
    if(abs >= 1e9) s = (n/1e9).toLocaleString("id-ID",{maximumFractionDigits:2}) + " M";
    else if(abs >= 1e6) s = (n/1e6).toLocaleString("id-ID",{maximumFractionDigits:1}) + " Jt";
    else s = n.toLocaleString("id-ID");
    return "Rp " + s;
  };
  const pct = (n,d) => d ? (n/d*100) : 0;

  const jobs = AO.jobs.map(j => {
    const pctKontrak = pct(j.terkontrak, j.skao);
    const pctBayar = pct(j.terbayar, j.terkontrak);
    let status, statusClass;
    if(j.terkontrak === 0){ status = "Belum Dikontrak"; statusClass = "st-belum"; }
    else if(pctKontrak > 105){ status = "Melebihi SKAO"; statusClass = "st-lebih"; }
    else if(pctKontrak >= 95){ status = "Selesai Dikontrak"; statusClass = "st-selesai"; }
    else { status = "Proses Kontrak"; statusClass = "st-proses"; }
    return Object.assign({}, j, { pctKontrak, pctBayar, status, statusClass });
  });

  const T = AO.totalRow;
  const totalPctKontrak = pct(T.terkontrak, T.skao);
  const totalPctBayar = pct(T.terbayar, T.terkontrak);

  // ---------- KPI ----------
  const kpis = [
    { label:"Total SKAO 2026", value: fmtRpShort(T.skao), sub: AO.paket, cls:"kpi--navy" },
    { label:"Terkontrak", value: fmtRpShort(T.terkontrak), sub: totalPctKontrak.toFixed(1)+"% dari SKAO", cls:"kpi--blue" },
    { label:"Tagihan Masuk", value: fmtRpShort(T.tagihan), sub: "Menunggu pembayaran", cls:"kpi--amber" },
    { label:"Terbayar", value: fmtRpShort(T.terbayar), sub: totalPctBayar.toFixed(1)+"% dari Terkontrak", cls:"kpi--green" },
    { label:"Sisa Anggaran", value: fmtRpShort(T.sisa), sub: T.sisa < 0 ? "Defisit terhadap SKAO" : "Masih tersedia", cls: T.sisa < 0 ? "kpi--red" : "kpi--teal" }
  ];
  document.getElementById("ao-kpis").innerHTML = kpis.map(k => `
    <div class="kpi ${k.cls}">
      <div class="kpi__label">${k.label}</div>
      <div class="kpi__value">${k.value}</div>
      <div class="kpi__sub">${k.sub}</div>
    </div>`).join("");

  // ---------- Charts ----------
  Chart.defaults.font.family = "'Plus Jakarta Sans',sans-serif";
  Chart.defaults.color = "#5B6573";

  const labelsShort = jobs.map(j => j.nama.length > 22 ? j.nama.slice(0,20)+"…" : j.nama);

  new Chart(document.getElementById("ao-ch-bar"), {
    type: "bar",
    data: {
      labels: labelsShort,
      datasets: [
        { label:"SKAO", data: jobs.map(j=>j.skao), backgroundColor:"#CBDCEE" },
        { label:"Terkontrak", data: jobs.map(j=>j.terkontrak), backgroundColor:"#1273C4" },
        { label:"Terbayar", data: jobs.map(j=>j.terbayar), backgroundColor:"#1F9D57" }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:"top", labels:{ boxWidth:11, font:{size:11} } },
        tooltip:{ callbacks:{ label: c => c.dataset.label+": "+fmtRp(c.parsed.y) } } },
      scales:{
        x:{ ticks:{ font:{size:9.5}, maxRotation:60, minRotation:60 }, grid:{ display:false } },
        y:{ ticks:{ callback: v => fmtRpShort(v) }, grid:{ color:"#EEF2F7" } }
      }
    }
  });

  new Chart(document.getElementById("ao-ch-donut"), {
    type: "doughnut",
    data: {
      labels: ["Terbayar", "Belum Terbayar (dari Terkontrak)"],
      datasets: [{ data: [T.terbayar, Math.max(T.terkontrak - T.terbayar,0)], backgroundColor: ["#1F9D57","#E4EAF1"], borderWidth:0 }]
    },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:"68%",
      plugins:{ legend:{ position:"bottom", labels:{ boxWidth:11, font:{size:11} } },
        tooltip:{ callbacks:{ label: c => c.label+": "+fmtRp(c.parsed) } } }
    },
    plugins: [{
      id:"aoCenterText",
      afterDraw(chart){
        const {ctx, chartArea:{width,height,top,left}} = chart;
        ctx.save();
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.font="800 26px 'Plus Jakarta Sans'"; ctx.fillStyle="#073B6B";
        ctx.fillText(totalPctBayar.toFixed(1)+"%", left+width/2, top+height/2-8);
        ctx.font="700 10.5px 'Plus Jakarta Sans'"; ctx.fillStyle="#5B6573";
        ctx.fillText("TERBAYAR", left+width/2, top+height/2+14);
        ctx.restore();
      }
    }]
  });

  new Chart(document.getElementById("ao-ch-terkontrak"), {
    type: "bar",
    data: {
      labels: labelsShort,
      datasets: [{
        label:"% Terkontrak",
        data: jobs.map(j=>j.pctKontrak),
        backgroundColor: jobs.map(j => j.pctKontrak > 105 ? "#E2231A" : j.pctKontrak >= 95 ? "#1F9D57" : "#FDB913")
      }]
    },
    options: {
      indexAxis:"y", responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => c.parsed.x.toFixed(1)+"%" } } },
      scales:{ x:{ ticks:{ callback:v=>v+"%" }, grid:{ color:"#EEF2F7" } }, y:{ ticks:{ font:{size:10} }, grid:{ display:false } } }
    }
  });

  // ---------- Checklist ----------
  const LS_KEY = "ao_checklist_2026";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch(e){ saved = {}; }

  const checklistEl = document.getElementById("ao-checklist");
  function renderChecklist(){
    checklistEl.innerHTML = jobs.map(j => {
      const isDone = saved.hasOwnProperty(j.no) ? saved[j.no] : j.pctKontrak >= 95;
      const barColor = j.pctKontrak > 105 ? "#E2231A" : j.pctKontrak >= 95 ? "#1F9D57" : "#1273C4";
      return `
      <div class="chk-row ${isDone ? "done" : ""}" data-no="${j.no}">
        <div class="chk-box" data-toggle="${j.no}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>
        </div>
        <div>
          <div class="chk-name">${j.nama}</div>
          <div class="chk-sub">${j.prk} · SKAO ${fmtRpShort(j.skao)}</div>
        </div>
        <div>
          <div class="chk-bar"><span style="width:${Math.min(j.pctKontrak,100)}%; background:${barColor}"></span></div>
          <div class="chk-pct">${j.pctKontrak.toFixed(0)}%</div>
        </div>
        <div class="muted" style="font-size:11px">Terbayar ${j.pctBayar.toFixed(0)}%</div>
        <div class="chk-status ${j.statusClass}">${j.status}</div>
      </div>`;
    }).join("");

    checklistEl.querySelectorAll("[data-toggle]").forEach(el => {
      el.addEventListener("click", () => {
        const no = el.dataset.toggle;
        const row = el.closest(".chk-row");
        const nowDone = !row.classList.contains("done");
        row.classList.toggle("done", nowDone);
        saved[no] = nowDone;
        localStorage.setItem(LS_KEY, JSON.stringify(saved));
        updateNote();
      });
    });
    updateNote();
  }
  function updateNote(){
    const total = jobs.length;
    const done = jobs.filter(j => saved.hasOwnProperty(j.no) ? saved[j.no] : j.pctKontrak >= 95).length;
    document.getElementById("ao-chk-note").innerHTML = `<b>${done} dari ${total}</b> pekerjaan selesai dikontrak (checklist dapat ditandai manual).`;
  }
  renderChecklist();

  // ---------- Table ----------
  document.getElementById("ao-tcount").textContent = jobs.length + " pekerjaan";
  document.getElementById("ao-tbody").innerHTML = jobs.map(j => `
    <tr>
      <td>${j.no}</td>
      <td>${j.nama}</td>
      <td class="mono" style="font-size:11px">${j.prk}</td>
      <td class="num">${fmtRp(j.skao)}</td>
      <td class="num">${fmtRp(j.terkontrak)}</td>
      <td class="num"><span class="pill ${j.pctKontrak>105?'pill--bad':j.pctKontrak>=95?'pill--ok':'pill--warn'}">${j.pctKontrak.toFixed(1)}%</span></td>
      <td class="num">${fmtRp(j.tagihan)}</td>
      <td class="num">${fmtRp(j.terbayar)}</td>
      <td class="num"><span class="pill ${j.pctBayar>=80?'pill--ok':j.pctBayar>=30?'pill--warn':'pill--bad'}">${j.pctBayar.toFixed(1)}%</span></td>
      <td class="num">${fmtRp(j.sisa)}</td>
    </tr>`).join("") + `
    <tr class="total-row">
      <td colspan="3">TOTAL</td>
      <td class="num">${fmtRp(T.skao)}</td>
      <td class="num">${fmtRp(T.terkontrak)}</td>
      <td class="num">${totalPctKontrak.toFixed(1)}%</td>
      <td class="num">${fmtRp(T.tagihan)}</td>
      <td class="num">${fmtRp(T.terbayar)}</td>
      <td class="num">${totalPctBayar.toFixed(1)}%</td>
      <td class="num">${fmtRp(T.sisa)}</td>
    </tr>`;

  // ---------- Evaluasi Akhir ----------
  const overContract = jobs.filter(j => j.pctKontrak > 105);
  const underContract = jobs.filter(j => j.pctKontrak < 50);
  const lowPayment = jobs.filter(j => j.terkontrak > 0 && j.pctBayar < 20);

  let verdictTitle, verdictDesc;
  if(totalPctKontrak <= 105 && totalPctBayar >= 50){
    verdictTitle = "Penyerapan Anggaran Sehat";
    verdictDesc = "Realisasi kontrak sesuai pagu SKAO dan tingkat pembayaran memadai.";
  } else if(totalPctKontrak > 100){
    verdictTitle = "Perlu Perhatian — Kontrak Melebihi Pagu";
    verdictDesc = "Total nilai kontrak sudah melampaui SKAO 2026, sementara realisasi pembayaran masih rendah dibanding nilai kontrak berjalan.";
  } else {
    verdictTitle = "Perlu Percepatan Realisasi";
    verdictDesc = "Kontrak sudah mendekati pagu, namun proses pembayaran ke penyedia masih tertinggal jauh dari nilai kontrak.";
  }

  document.getElementById("ao-verdict-card").innerHTML = `
    <div class="verdict-label">Evaluasi Akhir Anggaran Operasi</div>
    <div class="verdict-title">${verdictTitle}</div>
    <div class="verdict-desc">${verdictDesc} Dari total SKAO ${fmtRp(T.skao)}, telah terkontrak ${fmtRp(T.terkontrak)} (${totalPctKontrak.toFixed(1)}%), dengan realisasi pembayaran baru ${fmtRp(T.terbayar)} (${totalPctBayar.toFixed(1)}% dari nilai kontrak) — menyisakan tagihan berjalan ${fmtRp(T.tagihan)} yang perlu diproses.</div>
    <div class="verdict-stats">
      <div><span>${totalPctKontrak.toFixed(1)}%</span><small>Terkontrak / SKAO</small></div>
      <div><span>${totalPctBayar.toFixed(1)}%</span><small>Terbayar / Kontrak</small></div>
      <div><span>${overContract.length}</span><small>Pekerjaan Over Budget</small></div>
      <div><span>${lowPayment.length}</span><small>Pembayaran Rendah (&lt;20%)</small></div>
    </div>`;

  const findings = [];
  if(overContract.length){
    findings.push(`<b>${overContract.length} pekerjaan melebihi pagu SKAO</b>: ${overContract.map(j=>j.nama+" ("+j.pctKontrak.toFixed(0)+"%)").join(", ")} — perlu revisi anggaran atau efisiensi volume pekerjaan.`);
  }
  if(underContract.length){
    findings.push(`<b>${underContract.length} pekerjaan realisasi kontrak masih rendah (&lt;50%)</b>: ${underContract.map(j=>j.nama).join(", ")} — berisiko tidak terserap penuh di akhir tahun jika tidak dipercepat.`);
  }
  findings.push(`<b>Realisasi pembayaran total baru ${totalPctBayar.toFixed(1)}%</b> dari nilai kontrak (${fmtRp(T.terbayar)} dari ${fmtRp(T.terkontrak)}) — proses tagihan ke penyedia perlu dipercepat agar tidak menumpuk di akhir periode.`);
  if(T.sisa < 0){
    findings.push(`<b>Sisa anggaran defisit ${fmtRp(Math.abs(T.sisa))}</b> terhadap SKAO 2026 — total nilai kontrak sudah melampaui pagu yang tersedia.`);
  } else {
    findings.push(`<b>Sisa anggaran tersedia ${fmtRp(T.sisa)}</b> yang masih dapat dialokasikan untuk pekerjaan pemeliharaan tambahan.`);
  }
  findings.push(`Rekomendasi: prioritaskan pencairan tagihan pada pekerjaan dengan tagihan besar tapi terbayar 0% (mis. <b>Kerja Sama & PPK</b>, <b>Pemeliharaan Preventif JTM</b>), serta evaluasi ulang alokasi <b>Gudang & Logistik Distribusi</b> yang kontraknya 210% dari SKAO.`);

  document.getElementById("ao-eval-list").innerHTML = findings.map(f => `<li>${f}</li>`).join("");
  }
  window.AOApp = { init: initAO };
})();
