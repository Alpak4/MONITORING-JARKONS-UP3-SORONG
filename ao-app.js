(function(){
  let initialized = false;
  function initAO(){
    if(initialized) return; initialized = true;
    const run = () => renderAO(window.AO);
    if(window.AO && typeof window.AO.load === "function") window.AO.load().then(run).catch(run); else run();
  }
  const C = { bayar:"#1F9D57", tagih:"#FDB913", jalan:"#1273C4", lelang:"#7FB2DE", sisa:"#DCE5EF", navy:"#073B6B", red:"#E2231A", teal:"#0F9B9B", grey:"#9AA6B5" };
  const TAHAP = [["Terbayar",C.bayar],["Proses Tagihan",C.tagih],["Pelaksanaan",C.jalan],["Pengadaan",C.teal]];
  const BLN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const fmtRp = n => "Rp " + Math.round(n||0).toLocaleString("id-ID");
  const fmtS = n => { const a=Math.abs(n||0); let s; if(a>=1e9) s=(n/1e9).toLocaleString("id-ID",{maximumFractionDigits:2})+" M"; else if(a>=1e6) s=(n/1e6).toLocaleString("id-ID",{maximumFractionDigits:1})+" Jt"; else s=Math.round(n||0).toLocaleString("id-ID"); return "Rp "+s; };
  const pct = (a,b) => b ? a/b*100 : 0;
  const p1 = v => v.toLocaleString("id-ID",{maximumFractionDigits:1})+"%";
  const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const title = s => String(s||"").toLowerCase().replace(/(^|\s|\()([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(Ulp|Jtm|Jtr|Sktm|Sutm|Pdkb|Ups|Kva|Lbs|Pfk|Apd|Gh|Kv|Mvtic|Sm|Ii|Iii|Iv|Tw|Pt|Cv|Kwh|Sr|Hut|Ri|Pkp|Up3)\b/g, w => w.toUpperCase().replace("KWH","kWh").replace("KVA","kVA"));
  const fdate = d => { if(!d) return ""; const [y,m,dd] = d.split("-"); return (+dd)+" "+BLN[+m-1]+" "+y.slice(2); };
  const stCls = s => s==="Selesai" ? "ao2-c-done" : s==="On Progres" ? "ao2-c-prog" : "ao2-c-none";
  const chip = (txt, cls) => `<span class="ao2-chip ${cls}"><i></i>${esc(txt)}</span>`;

  function renderAO(AO){
    const T = AO.totalRow || {};
    const contracts = (AO.contracts||[]).map(c => Object.assign({}, c));
    const jobs = (AO.jobs||[]).map(j => {
      const list = contracts.filter(c => c.prk === j.prk);
      const jalan = Math.max(j.terkontrak - j.terbayar - j.tagihan, 0);
      return Object.assign({}, j, { list, jalan, pK: pct(j.terkontrak, j.skao), pB: pct(j.terbayar, j.skao) });
    });
    const prkName = {}; jobs.forEach(j => prkName[j.prk] = j.nama);
    const sumC = k => contracts.reduce((a,c)=>a+(c[k]||0),0);
    const nSel = contracts.filter(c=>c.status==="Selesai").length, nProg = contracts.filter(c=>c.status==="On Progres").length, nBelum = contracts.length-nSel-nProg;
    const risiko = contracts.filter(c=>c.risiko);

    // ---------- Source bar ----------
    const live = AO.source === "live";
    const stamp = new Date().toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
    document.getElementById("ao-source-bar").innerHTML = `<span class="wp-pill ${live?"live":"warn"}">● ${live?"Data langsung dari Spreadsheet (3 sheet)":"Data snapshot — spreadsheet tidak terjangkau"}</span><span style="font-size:11.5px;color:#7A8698">Diperbarui ${stamp} · ${jobs.length} kegiatan · ${contracts.length} paket pekerjaan · ${esc(AO.paket)}</span><button id="ao-refresh" class="btn-reset" style="margin-left:auto">↻ Muat Ulang</button>`;
    document.getElementById("ao-refresh").onclick = () => location.reload();

    // ---------- Hero pipeline ----------
    const jalanT = Math.max(T.terkontrak - T.terbayar - T.tagihan, 0);
    const sisaT = Math.max(T.skao - T.terkontrak - T.lelang, 0);
    const segs = [["Terbayar",T.terbayar,C.bayar],["Tagihan",T.tagihan,C.tagih],["Kontrak berjalan",jalanT,"#5FA8E8"],["Proses lelang",T.lelang,"#B9D6F0"],["Belum dialokasikan",sisaT,"rgba(255,255,255,.22)"]];
    const base = segs.reduce((a,s)=>a+s[1],0) || 1;
    document.getElementById("ao-hero").innerHTML = `
      <div class="ao2-pipe">
        <div class="lab">Alur Serapan SKAO 2026 · ${esc(AO.unit)}</div>
        <div class="big"><b>${fmtS(T.skao)}</b><span>pagu SKAO · terkontrak <b style="font-size:inherit">${p1(pct(T.terkontrak,T.skao))}</b> · terbayar <b style="font-size:inherit">${p1(pct(T.terbayar,T.skao))}</b></span></div>
        <div class="ao2-bar">${segs.map(s=>`<i title="${s[0]}: ${fmtRp(s[1])}" style="width:${s[1]/base*100}%;background:${s[2]}"></i>`).join("")}</div>
        <div class="ao2-seg">${segs.map(s=>`<div><small><i style="background:${s[2]}"></i>${s[0]}</small><strong>${fmtS(s[1])}</strong><em>${p1(pct(s[1],T.skao))} dari SKAO</em></div>`).join("")}</div>
      </div>
      <div class="ao2-ring">
        <div class="c"><span>Paket Pekerjaan</span><b>${contracts.length}</b><small>${fmtS(sumC("nilai"))} nilai kontrak</small></div>
        <div class="c"><span>Selesai</span><b style="color:#157A43">${nSel}</b><small>${p1(pct(nSel,contracts.length))} dari paket</small></div>
        <div class="c"><span>On Progres</span><b style="color:#0A4F8F">${nProg}</b><small>${nBelum} paket belum mulai / pengadaan</small></div>
        <div class="c ${risiko.length?"alert":""}"><span>Mitra Bermasalah</span><b>${risiko.length}</b><small>${risiko.length?fmtS(risiko.reduce((a,c)=>a+c.nilai,0))+" nilai terdampak":"Tidak ada"}</small></div>
      </div>`;

    // ---------- KPI ----------
    const kpis = [
      ["Total SKAO 2026", fmtS(T.skao), `Material ${fmtS(T.material)} · Jasa ${fmtS(T.jasa)}`, "kpi--navy"],
      ["Proses Lelang", fmtS(T.lelang), p1(pct(T.lelang,T.skao))+" dari SKAO", "kpi--teal"],
      ["Terkontrak", fmtS(T.terkontrak), p1(pct(T.terkontrak,T.skao))+" dari SKAO", "kpi--blue"],
      ["Tagihan Berjalan", fmtS(T.tagihan), contracts.filter(c=>c.tahap==="Proses Tagihan").length+" paket menunggu bayar", "kpi--amber"],
      ["Terbayar", fmtS(T.terbayar), p1(pct(T.terbayar,T.terkontrak))+" dari kontrak", "kpi--green"],
      ["Sisa Anggaran", fmtS(T.sisa), T.sisa<0?"Defisit terhadap SKAO":"Belum terserap", T.sisa<0?"kpi--red":"kpi--teal"]
    ];
    document.getElementById("ao-kpis").innerHTML = kpis.map(k=>`<div class="kpi ${k[3]}"><div class="kpi__label">${k[0]}</div><div class="kpi__value" style="font-size:24px">${k[1]}</div><div class="kpi__sub">${k[2]}</div></div>`).join("");

    // ---------- Charts ----------
    Chart.defaults.font.family = "'Plus Jakarta Sans',sans-serif"; Chart.defaults.color = "#5B6573";
    const short = s => s.length>30 ? s.slice(0,28)+"…" : s;
    const tipRp = c => c.dataset.label+": "+fmtRp(c.parsed.x!=null&&c.chart.options.indexAxis==="y"?c.parsed.x:c.parsed.y);
    const sorted = jobs.slice().sort((a,b)=>b.skao-a.skao);
    new Chart(document.getElementById("ao-ch-stack"), {
      type:"bar",
      data:{ labels: sorted.map(j=>short(j.nama)), datasets:[
        {label:"Terbayar", data:sorted.map(j=>j.terbayar), backgroundColor:C.bayar},
        {label:"Tagihan", data:sorted.map(j=>j.tagihan), backgroundColor:C.tagih},
        {label:"Kontrak berjalan", data:sorted.map(j=>j.jalan), backgroundColor:C.jalan},
        {label:"Proses lelang", data:sorted.map(j=>j.lelang), backgroundColor:C.lelang},
        {label:"Sisa", data:sorted.map(j=>Math.max(j.sisa,0)), backgroundColor:C.sisa}
      ]},
      options:{ indexAxis:"y", responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:"top",align:"start",labels:{boxWidth:11,font:{size:11}}}, tooltip:{callbacks:{label:tipRp, afterBody:items=>{const j=sorted[items[0].dataIndex];return ["SKAO: "+fmtRp(j.skao),"Terkontrak: "+p1(j.pK)+" · Terbayar: "+p1(j.pB)];}}}},
        scales:{ x:{stacked:true,ticks:{callback:v=>fmtS(v)},grid:{color:"#EEF2F7"}}, y:{stacked:true,ticks:{font:{size:10.5}},grid:{display:false}} } }
    });

    const stData = [["Selesai",nSel,C.bayar],["On Progres",nProg,C.jalan],["Belum Mulai",nBelum,C.grey]];
    new Chart(document.getElementById("ao-ch-status"), {
      type:"doughnut",
      data:{ labels:stData.map(s=>s[0]), datasets:[{data:stData.map(s=>s[1]),backgroundColor:stData.map(s=>s[2]),borderWidth:0}]},
      options:{ responsive:true, maintainAspectRatio:false, cutout:"70%", plugins:{legend:{display:false}} },
      plugins:[{id:"aoc",afterDraw(ch){const {ctx,chartArea:{width,height,top,left}}=ch;ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="800 26px 'Plus Jakarta Sans'";ctx.fillStyle=C.navy;ctx.fillText(p1(pct(nSel,contracts.length)),left+width/2,top+height/2-8);ctx.font="700 10px 'Plus Jakarta Sans'";ctx.fillStyle="#5B6573";ctx.fillText("PAKET SELESAI",left+width/2,top+height/2+14);ctx.restore();}}]
    });
    document.getElementById("ao-lg-status").innerHTML = stData.map(s=>`<div><b style="color:${s[2]===C.grey?"#5B6573":s[2]}">${s[1]}</b>${s[0]}</div>`).join("");
    const tahapSum = TAHAP.map(([t,col]) => { const l=contracts.filter(c=>c.tahap===t); return [t,col,l.length,l.reduce((a,c)=>a+(c.nilai||c.lelang),0)]; });
    const tMax = Math.max(...tahapSum.map(t=>t[3]),1);
    document.getElementById("ao-tahap").innerHTML = tahapSum.map(t=>`<div><div class="ao2-tb-top"><span>${t[0]} · ${t[2]} paket</span><span>${fmtS(t[3])}</span></div><div class="ao2-track"><i style="width:${t[3]/tMax*100}%;background:${t[1]}"></i></div></div>`).join("");

    const mm = {};
    contracts.forEach(c => { const m = c.mitra || "(Belum ditetapkan)"; if(!c.nilai) return; mm[m] = mm[m] || {n:0,bayar:0,cnt:0}; mm[m].n += c.nilai; mm[m].bayar += c.terbayar; mm[m].cnt++; });
    const mitras = Object.entries(mm).sort((a,b)=>b[1].n-a[1].n);
    const mitraChart = new Chart(document.getElementById("ao-ch-mitra"), {
      type:"bar",
      data:{ labels:mitras.map(m=>title(m[0]).replace(/^PT\.?\s*/,"PT ")), datasets:[
        {label:"Terbayar", data:mitras.map(m=>Math.min(m[1].bayar,m[1].n)), backgroundColor:C.bayar},
        {label:"Belum terbayar", data:mitras.map(m=>Math.max(m[1].n-m[1].bayar,0)), backgroundColor:"#9CC3E8"}
      ]},
      options:{ indexAxis:"y", responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:"top",align:"start",labels:{boxWidth:11,font:{size:11}}}, tooltip:{callbacks:{label:tipRp, afterBody:it=>{const m=mitras[it[0].dataIndex][1];return [m.cnt+" paket · total "+fmtRp(m.n)];}}}},
        scales:{ x:{stacked:true,ticks:{callback:v=>fmtS(v)},grid:{color:"#EEF2F7"}}, y:{stacked:true,ticks:{font:{size:10.5}},grid:{display:false}} },
        onClick:(e,els)=>{ if(!els.length) return; const m = mitras[els[0].index][0]; const sel=document.getElementById("ao-f-mitra"); sel.value = sel.value===m?"":m; renderDetail(); window.scrollTo({top: document.getElementById("ao-dbody").closest(".table-wrap").getBoundingClientRect().top + window.scrollY - 80, behavior:"smooth"}); },
        onHover:(e,els)=>{ e.native.target.style.cursor = els.length?"pointer":"default"; } }
    });

    const byM = Array(12).fill(0), cntM = Array(12).fill(0); let undated = 0, years = new Set();
    contracts.forEach(c => { if(!c.nilai) return; if(!c.mulai){ undated++; return; } const [y,m] = c.mulai.split("-"); if(+y===2026){ byM[+m-1]+=c.nilai; cntM[+m-1]++; } else { years.add(y); byM[0]+=0; } });
    const pre = contracts.filter(c=>c.nilai && c.mulai && +c.mulai.slice(0,4)<2026);
    const preSum = pre.reduce((a,c)=>a+c.nilai,0);
    let cum = preSum; const cumArr = byM.map(v => (cum += v));
    new Chart(document.getElementById("ao-ch-bulan"), {
      data:{ labels:BLN, datasets:[
        {type:"bar", label:"Nilai kontrak mulai", data:byM, backgroundColor:C.jalan, borderRadius:4, yAxisID:"y"},
        {type:"line", label:"Kumulatif", data:cumArr, borderColor:C.tagih, backgroundColor:C.tagih, tension:.3, pointRadius:3, yAxisID:"y"}
      ]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{position:"top",align:"start",labels:{boxWidth:11,font:{size:11}}}, tooltip:{callbacks:{label:c=>c.dataset.label+": "+fmtRp(c.parsed.y), afterLabel:c=>c.datasetIndex===0?cntM[c.dataIndex]+" paket":""}}},
        scales:{ y:{ticks:{callback:v=>fmtS(v)},grid:{color:"#EEF2F7"}}, x:{grid:{display:false}} } }
    });
    document.getElementById("ao-bulan-note").innerHTML = `Kumulatif termasuk <b>${pre.length} kontrak carry-over 2025</b> (${fmtS(preSum)}). ${undated} paket belum mencantumkan tanggal mulai.`;

    // ---------- Tindak lanjut ----------
    const groups = [
      { t:"Tagihan Oktober", col:C.tagih, list:contracts.filter(c=>/tagihan oktober/i.test(c.komitmen)), val:c=>c.tagihan||c.nilai, hint:"Komitmen penagihan bulan ini" },
      { t:"Mitra Tidak Melanjutkan", col:C.red, list:risiko, val:c=>c.nilai, hint:"Perlu keputusan putus kontrak / pengalihan" },
      { t:"Pengadaan & Dokumen", col:C.teal, list:contracts.filter(c=>c.tahap==="Pengadaan"), val:c=>c.lelang||c.nilai, hint:"Belum terkontrak — percepat proses pengadaan" },
      { t:"Pekerjaan Berjalan", col:C.jalan, list:contracts.filter(c=>c.tahap==="Pelaksanaan" && !c.risiko), val:c=>c.nilai, hint:"Terkontrak, belum ada tagihan" }
    ];
    document.getElementById("ao-actions").innerHTML = groups.map(g => `
      <div class="ao2-act"><div class="ao2-act-h"><i style="background:${g.col}"></i><h3>${g.t}</h3><span>${g.list.length}</span></div>
      <div class="ao2-act-sum">${g.hint} · <b>${fmtS(g.list.reduce((a,c)=>a+g.val(c),0))}</b></div>
      <ul>${g.list.sort((a,b)=>g.val(b)-g.val(a)).map(c=>`<li><div>${esc(title(c.uraian))}<small>${esc(title(c.mitra)||"Mitra belum ditetapkan")} · ${esc(prkName[c.prk]||c.prk)}</small></div><b>${fmtS(g.val(c))}</b></li>`).join("") || `<li><div class="muted">Tidak ada</div></li>`}</ul></div>`).join("");

    // ---------- Rekap per PRK ----------
    document.getElementById("ao-tcount").textContent = jobs.length + " kegiatan";
    const stackCell = j => { const b = j.skao||1; return `<div class="ao2-stack" title="Terbayar ${p1(j.pB)} · Terkontrak ${p1(j.pK)}"><i style="width:${Math.min(j.terbayar/b*100,100)}%;background:${C.bayar}"></i><i style="width:${Math.min(j.tagihan/b*100,100)}%;background:${C.tagih}"></i><i style="width:${Math.min(j.jalan/b*100,100)}%;background:${C.jalan}"></i><i style="width:${Math.min(j.lelang/b*100,100)}%;background:${C.lelang}"></i></div><span class="pc" style="margin-top:3px">${p1(j.pK)} terkontrak · ${p1(j.pB)} terbayar</span>`; };
    const tb = document.getElementById("ao-tbody");
    tb.innerHTML = jobs.map((j,i) => `
      <tr class="prk" data-i="${i}"><td>${esc(j.nama)}<span class="sub">${esc(j.prk)}</span>${j.ket?`<span class="pc" style="color:#A05E00">${esc(j.ket)}</span>`:""}</td>
      <td class="num">${fmtRp(j.skao)}</td><td class="num">${fmtRp(j.lelang)}</td>
      <td class="num">${fmtRp(j.terkontrak)}<span class="pc">${p1(j.pK)}</span></td>
      <td class="num">${fmtRp(j.tagihan)}</td><td class="num">${fmtRp(j.terbayar)}<span class="pc">${p1(j.pB)}</span></td>
      <td class="num" style="color:${j.sisa<0?"#B3261E":"inherit"}">${fmtRp(j.sisa)}</td>
      <td>${stackCell(j)}</td><td class="num">${j.list.length}</td></tr>
      <tr class="kids" data-k="${i}" hidden><td colspan="9"><div class="ao2-kids">${j.list.map(c=>`<div class="ao2-kid"><div>${esc(title(c.uraian))}<div class="m">${esc(c.noKontrak||"Belum ada no. kontrak")}</div></div><div class="m">${esc(title(c.mitra)||"—")}</div><div class="r">${fmtS(c.nilai||c.lelang)}</div><div>${chip(c.tahap, c.tahap==="Terbayar"?"ao2-c-done":c.tahap==="Pengadaan"?"ao2-c-none":"ao2-c-prog")}</div><div>${chip(c.status, c.risiko?"ao2-c-bad":stCls(c.status))}</div></div>`).join("") || `<div class="m">Belum ada paket kontrak tercatat.</div>`}</div></td></tr>`).join("") + `
      <tr class="total-row"><td>TOTAL ${esc(AO.unit).toUpperCase()}</td><td class="num">${fmtRp(T.skao)}</td><td class="num">${fmtRp(T.lelang)}</td><td class="num">${fmtRp(T.terkontrak)}<span class="pc">${p1(pct(T.terkontrak,T.skao))}</span></td><td class="num">${fmtRp(T.tagihan)}</td><td class="num">${fmtRp(T.terbayar)}<span class="pc">${p1(pct(T.terbayar,T.skao))}</span></td><td class="num">${fmtRp(T.sisa)}</td><td></td><td class="num">${contracts.length}</td></tr>`;
    tb.querySelectorAll("tr.prk").forEach(r => r.addEventListener("click", () => { const k = tb.querySelector(`tr[data-k="${r.dataset.i}"]`); k.hidden = !k.hidden; r.classList.toggle("open", !k.hidden); }));

    // ---------- Filters + Detail ----------
    const opt = (id, items, all) => { document.getElementById(id).innerHTML = `<option value="">${all}</option>` + items.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join(""); };
    opt("ao-f-prk", jobs.map(j=>[j.prk,j.nama]), "Semua kegiatan");
    opt("ao-f-status", ["Selesai","On Progres","Belum Mulai"].map(s=>[s,s]), "Semua status");
    opt("ao-f-tahap", TAHAP.map(t=>[t[0],t[0]]), "Semua tahap");
    opt("ao-f-mitra", [...new Set(contracts.map(c=>c.mitra).filter(Boolean))].sort().map(m=>[m,title(m)]), "Semua mitra");
    ["ao-f-prk","ao-f-status","ao-f-tahap","ao-f-mitra"].forEach(id => document.getElementById(id).onchange = renderDetail);
    document.getElementById("ao-f-q").oninput = renderDetail;
    document.getElementById("ao-reset").onclick = () => { ["ao-f-prk","ao-f-status","ao-f-tahap","ao-f-mitra","ao-f-q"].forEach(id=>document.getElementById(id).value=""); renderDetail(); };

    function renderDetail(){
      const v = id => document.getElementById(id).value;
      const q = v("ao-f-q").toLowerCase();
      const L = contracts.filter(c => (!v("ao-f-prk")||c.prk===v("ao-f-prk")) && (!v("ao-f-status")||c.status===v("ao-f-status")) && (!v("ao-f-tahap")||c.tahap===v("ao-f-tahap")) && (!v("ao-f-mitra")||c.mitra===v("ao-f-mitra")) && (!q || (c.uraian+" "+c.noKontrak+" "+c.mitra).toLowerCase().indexOf(q)!==-1));
      document.getElementById("ao-dcount").textContent = L.length + " dari " + contracts.length + " paket";
      document.getElementById("ao-dbody").innerHTML = L.map((c,i) => {
        const tc = c.tahap==="Terbayar"?"ao2-c-done":c.tahap==="Proses Tagihan"?"ao2-c-prog":c.tahap==="Pengadaan"?"ao2-c-none":"ao2-c-prog";
        const fc = c.fisik>=100?C.bayar:c.fisik>=50?C.jalan:C.tagih;
        const per = c.mulai||c.akhir ? `${fdate(c.mulai)||"?"} – ${fdate(c.akhir)||"?"}` : `<span class="muted">—</span>`;
        return `<tr><td>${i+1}</td>
          <td style="min-width:240px"><b style="font-weight:700;color:var(--navy)">${esc(title(c.uraian))}</b><span class="sub">${esc(c.noKontrak||"—")}</span><span class="pc">${esc(prkName[c.prk]||c.prk)}</span></td>
          <td style="font-size:11.5px">${esc(title(c.mitra)||"—")}</td>
          <td style="font-size:11px;white-space:nowrap">${per}</td>
          <td class="num">${c.nilai?fmtRp(c.nilai):`<span class="muted">${c.lelang?"Lelang "+fmtS(c.lelang):"—"}</span>`}</td>
          <td class="num">${c.tagihan?fmtRp(c.tagihan):"—"}</td>
          <td class="num">${c.terbayar?fmtRp(c.terbayar):"—"}</td>
          <td><div class="ao2-fis"><div class="ao2-track"><i style="width:${Math.min(c.fisik,100)}%;background:${fc}"></i></div><span>${Math.round(c.fisik)}%</span></div></td>
          <td>${chip(c.status, c.risiko?"ao2-c-bad":stCls(c.status))}${c.perjanjian?`<span class="pc" style="margin-top:3px">${esc(c.perjanjian)}</span>`:""}</td>
          <td>${chip(c.tahap, tc)}</td>
          <td><div class="ao2-ket">${esc(c.ket||"—")}${c.komitmen?`<small class="${c.risiko?"":"ok"}">${esc(c.komitmen)}</small>`:""}</div></td></tr>`;
      }).join("") || `<tr><td colspan="11" class="muted" style="text-align:center;padding:24px">Tidak ada paket sesuai filter.</td></tr>`;
      const s = k => L.reduce((a,c)=>a+(c[k]||0),0);
      document.getElementById("ao-dfoot").innerHTML = `<tr><td colspan="4">TOTAL (${L.length} paket)</td><td class="num">${fmtRp(s("nilai"))}</td><td class="num">${fmtRp(s("tagihan"))}</td><td class="num">${fmtRp(s("terbayar"))}</td><td colspan="4"></td></tr>`;
    }
    renderDetail();

    // ---------- Konteks UID & Hutang ----------
    const uid = (AO.uid||[]).slice(), UT = AO.uidTotal || {};
    if(uid.length){
      const us = uid.slice().sort((a,b)=>Math.max(b.nilai,b.rekomposisi)-Math.max(a.nilai,a.rekomposisi));
      document.getElementById("ao-uid-sub").innerHTML = `${uid.length} program · nilai awal ${fmtS(UT.nilai)} → rekomposisi ${fmtS(UT.rekomposisi)} · skala logaritmik`;
      new Chart(document.getElementById("ao-ch-uid"), {
        type:"bar",
        data:{ labels:us.map(u=>short(u.nama)), datasets:[
          {label:"Nilai awal", data:us.map(u=>u.nilai||null), backgroundColor:"#B9D6F0"},
          {label:"Rekomposisi", data:us.map(u=>u.rekomposisi||null), backgroundColor:C.navy}
        ]},
        options:{ indexAxis:"y", responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{position:"top",align:"start",labels:{boxWidth:11,font:{size:11}}}, tooltip:{callbacks:{label:tipRp, afterBody:it=>{const u=us[it[0].dataIndex];return ["Gap: "+fmtRp(u.gap)].concat(u.catatan?[u.catatan]:[]);}}}},
          scales:{ x:{type:"logarithmic",ticks:{callback:v=>{const l=Math.log10(v);return Number.isInteger(l)?fmtS(v):"";}},grid:{color:"#EEF2F7"}}, y:{ticks:{font:{size:10}},grid:{display:false}} } }
      });
      const gaps = uid.filter(u=>u.gap).sort((a,b)=>Math.abs(b.gap)-Math.abs(a.gap)).slice(0,8);
      document.getElementById("ao-uid-gap").innerHTML = `<h3>Perubahan Terbesar</h3><div class="ph-sub">Selisih rekomposisi terhadap nilai awal</div><ul class="ao2-gap">${gaps.map(u=>`<li><span>${esc(u.nama)}</span><b class="${u.gap>0?"up":"dn"}">${u.gap>0?"+":"−"}${fmtS(Math.abs(u.gap)).replace("Rp ","")}</b></li>`).join("")}</ul>`;
    }
    const hut = (AO.hutang||[]), hs = hut.find(h=>/sorong/i.test(h.unit));
    if(hs){
      const pb = pct(hs.terbayar, hs.terkontrak);
      document.getElementById("ao-hutang").innerHTML = `<h3>Hutang Usaha 2025 — ${esc(title(hs.unit))}</h3><div class="ph-sub">Kontrak carry-over yang dibayar dari AO 2026</div>
        <div class="ao2-hut"><div style="display:flex;align-items:baseline;gap:8px"><b style="font-size:28px;color:var(--navy);font-weight:800">${p1(pb)}</b><span class="muted" style="font-size:12px">terbayar</span></div>
        <div class="ao2-track" style="height:10px"><i style="width:${Math.min(pb,100)}%;background:${C.bayar}"></i></div>
        <div class="row"><span>Terkontrak</span><b>${fmtRp(hs.terkontrak)}</b></div><div class="row"><span>Terbayar</span><b>${fmtRp(hs.terbayar)}</b></div><div class="row"><span>Belum terbayar</span><b style="color:#B3261E">${fmtRp(hs.belum)}</b></div>
        <div class="ph-sub" style="margin:0">${hut.filter(h=>!/total|sorong/i.test(h.unit) && h.terkontrak>0).length ? "" : "Unit lain belum mencatat hutang usaha."}</div></div>`;
    }

    // ---------- Evaluasi ----------
    const pK = pct(T.terkontrak,T.skao), pB = pct(T.terbayar,T.skao), pBK = pct(T.terbayar,T.terkontrak);
    const over = jobs.filter(j=>j.pK>100.5), low = jobs.filter(j=>j.skao>0 && j.pK<50), zero = jobs.filter(j=>j.skao>0 && j.terkontrak===0);
    let vt, vd;
    if(pK>=90 && pBK>=60){ vt="Penyerapan Anggaran Sehat"; vd="Kontrak hampir menutup pagu dan pembayaran berjalan baik."; }
    else if(pBK<50){ vt="Perlu Percepatan Pembayaran"; vd="Nilai kontrak sudah besar, namun realisasi pembayaran masih tertinggal dari kontrak berjalan."; }
    else { vt="Perlu Percepatan Kontrak"; vd="Masih ada porsi pagu yang belum dikontrak menjelang akhir tahun anggaran."; }
    document.getElementById("ao-verdict-card").innerHTML = `<div class="verdict-label">Evaluasi Akhir Anggaran Operasi</div><div class="verdict-title">${vt}</div>
      <div class="verdict-desc">${vd} Dari SKAO ${fmtRp(T.skao)}, terkontrak ${fmtRp(T.terkontrak)} (${p1(pK)}), proses lelang ${fmtRp(T.lelang)}, dan terbayar ${fmtRp(T.terbayar)} (${p1(pB)} dari SKAO; ${p1(pBK)} dari kontrak). Tagihan berjalan ${fmtRp(T.tagihan)} perlu segera diproses.</div>
      <div class="verdict-stats"><div><span>${p1(pK)}</span><small>Terkontrak / SKAO</small></div><div><span>${p1(pBK)}</span><small>Terbayar / Kontrak</small></div><div><span>${nSel}/${contracts.length}</span><small>Paket selesai</small></div><div><span>${risiko.length}</span><small>Mitra bermasalah</small></div></div>`;
    const F = [];
    if(over.length) F.push(`<b>${over.length} kegiatan kontraknya melebihi pagu</b>: ${over.map(j=>esc(j.nama)+" ("+p1(j.pK)+")").join(", ")} — perlu rekomposisi atau addendum.`);
    if(zero.length) F.push(`<b>${zero.length} kegiatan belum terkontrak sama sekali</b>: ${zero.map(j=>esc(j.nama)+" ("+fmtS(j.skao)+")").join(", ")}.`);
    if(low.length) F.push(`<b>${low.length} kegiatan serapan kontrak &lt;50%</b>: ${low.filter(j=>j.terkontrak>0).map(j=>esc(j.nama)+" ("+p1(j.pK)+")").join(", ") || "—"} — berisiko tidak terserap di akhir tahun.`);
    const tg = groups[0];
    if(tg.list.length) F.push(`<b>${tg.list.length} paket berkomitmen tagihan Oktober</b> senilai ${fmtS(tg.list.reduce((a,c)=>a+tg.val(c),0))} — bila cair, serapan terbayar naik ke ±${p1(pct(T.terbayar+tg.list.reduce((a,c)=>a+tg.val(c),0),T.skao))} dari SKAO.`);
    if(risiko.length) F.push(`<b>${risiko.length} paket dengan mitra tidak dapat melanjutkan pekerjaan</b> (${[...new Set(risiko.map(c=>title(c.mitra)))].join(", ")}) senilai ${fmtS(risiko.reduce((a,c)=>a+c.nilai,0))} — segera putuskan pemutusan kontrak/pengalihan agar dana dapat direalokasi.`);
    const peng = groups[2].list;
    if(peng.length) F.push(`<b>${peng.length} paket masih tahap pengadaan/penyusunan dokumen</b> senilai ${fmtS(peng.reduce((a,c)=>a+groups[2].val(c),0))} — target terkontrak paling lambat November agar dapat dibayar di tahun berjalan.`);
    if(hs && hs.belum>0) F.push(`<b>Hutang usaha 2025 tersisa ${fmtRp(hs.belum)}</b> (${p1(pct(hs.terbayar,hs.terkontrak))} sudah terbayar) — selesaikan bersamaan dengan pembayaran AO 2026.`);
    document.getElementById("ao-eval-list").innerHTML = F.map(f=>`<li>${f}</li>`).join("");
  }
  window.AOApp = { init: initAO };
})();
