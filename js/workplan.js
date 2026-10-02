/* Monitoring Realisasi Workplan — UP3 Sorong 2026
   Target tahunan  : sheet gid=0
   Realisasi harian: sheet gid=869651897 (6 blok kolom berdampingan) */
window.Workplan = (function(){
  const BASE="https://docs.google.com/spreadsheets/d/e/2PACX-1vSj3GxboKjS6HO1P3DUMAQYKy8gE6rd0W9F14JX8IAtDedB8vVKxMWT1tQZsee6uRB4nzozqj5L1xOc/pub?output=csv&gid=";
  const URL_TARGET=BASE+"0", URL_REAL=BASE+"869651897";
  const MONTHS=["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"];
  const ULPS=["SORONG KOTA","AIMAS","TEMINABUAN","WAISAI"];
  const EXCLUDE=["FAKFAK","FAK FAK","KAIMANA"];
  const KEL_MAP={"PHBTM":"PHBTM","PHB TM":"PHBTM","PHB-TM":"PHBTM","JTM":"JTM","GARDU":"GARDU","GARDU DIST":"GARDU","GARDU DISTRIBUSI":"GARDU","JTR":"JTR","SR-APP":"SR-APP","SR APP":"SR-APP","SRAPP":"SR-APP"};
  const KEL_ORDER=["PHBTM","JTM","GARDU","JTR","SR-APP","LAINNYA"];
  const kel=v=>KEL_MAP[norm(v)]||"LAINNYA";
  let TARGET=[], REAL=[], loaded=false, charts={};
  const SEMS=["SEMUA SEMESTER","SEMESTER I (Jan–Jun)","SEMESTER II (Jul–Des)"];
  const inSem=bi=>state.sem===SEMS[0]||(state.sem===SEMS[1]?bi>=0&&bi<6:bi>=6);
  const tgtDiv=()=>state.bulan!=="SEMUA BULAN"?12:(state.sem!==SEMS[0]?2:1);
  const state={ulp:"SEMUA ULP",sem:"SEMUA SEMESTER",bulan:"SEMUA BULAN",kelompok:"SEMUA",vendor:"SEMUA",q:""};

  const el=id=>document.getElementById(id);
  const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const norm=s=>String(s||"").toUpperCase().replace(/\s+/g," ").replace(/\s*\/\s*/g,"/").trim();
  function num(v){
    if(v==null) return 0;
    let s=String(v).replace(/[^0-9,.\-]/g,"").trim();
    if(!s||s==="-") return 0;
    if(s.indexOf(",")!==-1) s=s.replace(/\./g,"").replace(",",".");
    else s=s.replace(/\./g,"");
    const n=parseFloat(s); return isNaN(n)?0:n;
  }
  const fmt=n=>!n?"0":(Math.abs(n%1)<0.005?Math.round(n).toLocaleString("id-ID"):n.toLocaleString("id-ID",{minimumFractionDigits:2,maximumFractionDigits:2}));
  function parseCSV(text){
    const rows=[]; let row=[],f="",q=false;
    for(let i=0;i<text.length;i++){const c=text[i];
      if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
      else{ if(c==='"')q=true; else if(c===","){row.push(f);f="";} else if(c==="\n"){row.push(f);rows.push(row);row=[];f="";} else if(c!=="\r")f+=c; }
    }
    if(f.length||row.length){row.push(f);rows.push(row);}
    return rows;
  }
  async function grab(url){
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),15000);
    try{ const r=await fetch(url,{signal:ctrl.signal,mode:"cors"}); clearTimeout(t); if(!r.ok) return null; return parseCSV(await r.text()); }
    catch(e){ clearTimeout(t); return null; }
  }

  /* ---------- parsing ---------- */
  function parseTarget(rows){
    if(!rows||!rows.length) return [];
    // baris 1 = header unit, baris 2 = TARGET/REAL/%, data mulai baris 3
    const head=rows[1]||[]; const cols={};
    head.forEach((h,i)=>{ const n=norm(h).replace(/^ULP\s+/,"").replace(/^UP3\s+/,"UP3 "); if(!n) return;
      if(n==="UP3 SORONG") cols.UP3=i; else if(ULPS.indexOf(n)!==-1) cols[n]=i; });
    const out=[]; let kelRaw="",prog="";
    for(let i=3;i<rows.length;i++){
      const r=rows[i]||[];
      const k0=(r[1]||"").trim();
      if(k0){ if(norm(k0)!==norm(kelRaw)) prog=""; kelRaw=k0; }
      if((r[2]||"").trim()) prog=(r[2]||"").trim();
      const lm=(r[3]||"").trim(); if(!lm) continue;
      const tg={UP3:num(r[cols.UP3])};
      ULPS.forEach(u=>{ tg[u]= cols[u]!=null ? num(r[cols[u]]) : 0; });
      out.push({no:(r[0]||"").trim(),kelompok:kel(kelRaw),program:prog,lm:lm,key:norm(lm),satuan:(r[4]||"").trim(),tg:tg});
    }
    return out;
  }
  function parseReal(rows){
    if(!rows||!rows.length) return [];
    const head=rows[0]||[], starts=[];
    head.forEach((h,i)=>{ if(norm(h)==="TANGGAL") starts.push(i); });
    if(!starts.length) starts.push(0);
    const out=[];
    starts.forEach(c=>{
      for(let i=1;i<rows.length;i++){
        const r=rows[i]||[];
        const lm=(r[c+6]||"").trim(), ulp=norm(r[c+3]);
        if(!lm||!ulp||EXCLUDE.indexOf(ulp)!==-1) continue;
        const bl=norm(r[c+1]); const bi=MONTHS.indexOf(bl);
        out.push({tgl:num(r[c])||"",bulan:bi>=0?bi:-1,ulp:ulp,penyulang:(r[c+4]||"").trim(),
          kelompok:kel(r[c+5]),lm:lm,key:norm(lm),jumlah:num(r[c+7]),satuan:(r[c+8]||"").trim(),vendor:(r[c+9]||"").trim()});
      }
    });
    return out;
  }

  /* ---------- filter ---------- */
  function filtered(){
    const q=state.q.toLowerCase();
    return REAL.filter(d=>
      (state.ulp==="SEMUA ULP"||d.ulp===state.ulp) &&
      inSem(d.bulan) && (state.bulan==="SEMUA BULAN"||MONTHS[d.bulan]===state.bulan) &&
      (state.kelompok==="SEMUA"||d.kelompok===state.kelompok) &&
      (state.vendor==="SEMUA"||d.vendor===state.vendor) &&
      (!q||(d.lm+" "+d.penyulang+" "+d.vendor+" "+d.ulp).toLowerCase().indexOf(q)!==-1)
    );
  }
  function targetOf(row){
    const base = state.ulp==="SEMUA ULP" ? ULPS.reduce((a,u)=>a+(row.tg[u]||0),0) : (row.tg[state.ulp]||0);
    return base/tgtDiv();
  }
  const scopeText=()=>`${state.ulp==="SEMUA ULP"?"UP3 Sorong (semua ULP)":"ULP "+state.ulp} · ${state.bulan!=="SEMUA BULAN"?state.bulan+" 2026 (target bulanan)":(state.sem!==SEMS[0]?state.sem+" 2026 (target semester)":"Target tahunan 2026")}`;

  /* ---------- render ---------- */
  function renderKPI(rows,rekap){
    const real=rows.reduce((a,d)=>a+d.jumlah,0);
    const tgt=rekap.reduce((a,r)=>a+r.target,0);
    const bert=rekap.filter(r=>r.target>0);
    const pct=bert.length?bert.reduce((a,r)=>a+Math.min(150,(r.real/r.target)*100),0)/bert.length:0;
    const tuntas=rekap.filter(r=>r.target>0&&r.real>=r.target).length;
    const nBert=rekap.filter(r=>r.target>0).length;
    const aktif=rekap.filter(r=>r.real>0).length;
    const tone=p=>p>=100?"kpi--green":(p>=70?"kpi--blue":(p>0?"kpi--amber":"kpi--red"));
    const card=(l,v,s,m)=>`<div class="kpi ${m||""}"><div class="kpi__label">${l}</div><div class="kpi__value">${v}</div><div class="kpi__sub">${s}</div></div>`;
    el("wp-kpis").innerHTML=
      card("Realisasi Workplan",fmt(real),`${fmt(rows.length)} entri pekerjaan · ${scopeText()}`,tone(pct))+
      card("Total Target",fmt(tgt),`${bert.length} lead measure bertarget · satuan campuran`)+
      card("Capaian Rata-rata",pct.toFixed(1)+"%",`Rerata capaian ${bert.length} lead measure bertarget`,tone(pct))+
      card("Lead Measure Tuntas",tuntas+" / "+nBert,`${aktif} lead measure sudah ada realisasi`,tuntas>0?"kpi--green":"kpi--amber");
  }
  function buildRekap(rows){
    const agg={}; rows.forEach(d=>{ agg[d.key]=(agg[d.key]||0)+d.jumlah; });
    const seen={}, out=[];
    TARGET.forEach(t=>{
      if(state.kelompok!=="SEMUA"&&t.kelompok!==state.kelompok) return;
      if(state.q&&t.lm.toLowerCase().indexOf(state.q.toLowerCase())===-1&&!(agg[t.key]>0)) return;
      const target=targetOf(t), real=agg[t.key]||0;
      seen[t.key]=1;
      if(target>0||real>0) out.push({kelompok:t.kelompok,program:t.program,lm:t.lm,satuan:t.satuan,target:target,real:real});
    });
    Object.keys(agg).forEach(k=>{ if(seen[k]) return;
      const s=rows.find(d=>d.key===k); if(!s) return;
      if(state.kelompok!=="SEMUA"&&s.kelompok!==state.kelompok) return;
      if(!(agg[k]>0)) return;
      out.push({kelompok:s.kelompok||"LAINNYA",program:"",lm:s.lm,satuan:s.satuan,target:0,real:agg[k]});
    });
    out.forEach((r,i)=>{ const p=KEL_ORDER.indexOf(r.kelompok); r._o=p<0?99:p; r._i=i; });
    out.sort((a,b)=>(a._o-b._o)||(a._i-b._i));
    return out;
  }
  function groupOf(rekap){
    const g=[], idx={};
    rekap.forEach(r=>{ const k=r.kelompok||"LAINNYA";
      if(idx[k]==null){ idx[k]=g.length; g.push({kelompok:k,rows:[]}); }
      g[idx[k]].rows.push(r); });
    return g;
  }
  function renderRekap(rekap){
    const cls=p=>p>=100?"ok":(p>=70?"mid":(p>0?"low":"nil"));
    let html="",n=0;
    groupOf(rekap).forEach(g=>{
      const gt=g.rows.reduce((a,r)=>a+r.target,0), gr=g.rows.reduce((a,r)=>a+r.real,0);
      const bt=g.rows.filter(r=>r.target>0);
      const gp=bt.length?bt.reduce((a,r)=>a+Math.min(150,(r.real/r.target)*100),0)/bt.length:0;
      html+=`<tr class="fdx-sec"><td colspan="4">${esc(g.kelompok)} · ${g.rows.length} lead measure</td><td class="num">${fmt(+gr.toFixed(2))}</td><td class="num">${bt.length?gp.toFixed(0)+"%":"—"}</td><td></td></tr>`;
      g.rows.forEach(r=>{
      n++;
      const p=r.target>0?(r.real/r.target)*100:0;
      html+=`<tr><td>${n}</td><td class="fdx-name">${esc(r.lm)}${r.program?`<em style="display:block;font-style:normal;font-size:10.5px;color:#7A8CA0">${esc(r.program)}</em>`:""}</td>`+
        `<td>${esc(r.satuan||"—")}</td><td class="num">${fmt(+r.target.toFixed(2))}</td><td class="num"><b>${fmt(+r.real.toFixed(2))}</b></td>`+
        `<td class="num">${r.target>0?fmt(+(r.real-r.target).toFixed(2)):"—"}</td>`+
        `<td><div class="fdx-bar"><span class="${cls(p)}" style="width:${Math.min(100,p).toFixed(1)}%"></span></div><div class="fdx-barv">${r.target>0?p.toFixed(0)+"%":"tanpa target"}</div></td></tr>`;
      });
      html+=`<tr class="wp-sub"><td></td><td>Subtotal ${esc(g.kelompok)}</td><td></td><td class="num">${fmt(+gt.toFixed(2))}</td><td class="num">${fmt(+gr.toFixed(2))}</td><td class="num">${gt>0?fmt(+(gr-gt).toFixed(2)):"—"}</td><td class="num">${bt.length?gp.toFixed(1)+"%":"—"}</td></tr>`;
    });
    el("wp-rekap-body").innerHTML=html||`<tr><td colspan="7" style="text-align:center;padding:26px;color:#7A8CA0">Tidak ada data sesuai filter.</td></tr>`;
    el("wp-rekap-count").textContent=n+" lead measure · "+groupOf(rekap).length+" kelompok";
  }
  function renderDetail(rows){
    const sorted=rows.slice().sort((a,b)=>(a.bulan-b.bulan)||(a.tgl-b.tgl));
    const cap=400, show=sorted.slice(0,cap);
    el("wp-detail-body").innerHTML = show.map(d=>
      `<tr><td>${d.tgl||"—"} ${d.bulan>=0?MONTHS[d.bulan].slice(0,3):""}</td><td>${esc(d.ulp)}</td><td>${esc(d.penyulang)}</td><td>${esc(d.kelompok)}</td>`+
      `<td class="fdx-name">${esc(d.lm)}</td><td class="num"><b>${fmt(d.jumlah)}</b></td><td>${esc(d.satuan)}</td><td>${esc(d.vendor||"—")}</td></tr>`
    ).join("")||`<tr><td colspan="8" style="text-align:center;padding:26px;color:#7A8CA0">Tidak ada realisasi sesuai filter.</td></tr>`;
    el("wp-detail-count").textContent = sorted.length>cap ? `menampilkan ${cap} dari ${fmt(sorted.length)} entri` : `${fmt(sorted.length)} entri`;
  }
  function chart(id,cfg){
    const c=el(id); if(!c||!window.Chart) return;
    if(charts[id]) charts[id].destroy();
    charts[id]=new Chart(c.getContext("2d"),cfg);
  }
  function renderCharts(rows,rekap){
    const perBulan=MONTHS.map((m,i)=>rows.filter(d=>d.bulan===i).reduce((a,d)=>a+d.jumlah,0));
    const tgtTahun=TARGET.reduce((a,t)=>a+(state.ulp==="SEMUA ULP"?ULPS.reduce((s,u)=>s+(t.tg[u]||0),0):(t.tg[state.ulp]||0)),0);
    chart("wp-ch-bulan",{type:"bar",data:{labels:MONTHS.map(m=>m.slice(0,3)),datasets:[
      {label:"Realisasi",data:perBulan,backgroundColor:"#0A4F8F",borderRadius:4,maxBarThickness:34},
      {type:"line",label:"Target bulanan",data:MONTHS.map(()=>tgtTahun/12),borderColor:"#E2231A",borderDash:[5,4],borderWidth:2,pointRadius:0,tension:0}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:12,font:{size:11}}}},scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},x:{grid:{display:false},ticks:{font:{size:10}}}}}});

    const byUlp=ULPS.map(u=>{
      const real=REAL.filter(d=>d.ulp===u&&inSem(d.bulan)&&(state.bulan==="SEMUA BULAN"||MONTHS[d.bulan]===state.bulan)&&(state.kelompok==="SEMUA"||d.kelompok===state.kelompok)).reduce((a,d)=>a+d.jumlah,0);
      let t=TARGET.reduce((a,r)=>a+(state.kelompok!=="SEMUA"&&r.kelompok!==state.kelompok?0:(r.tg[u]||0)),0);
      t/=tgtDiv();
      return {u:u,real:real,pct:t>0?(real/t)*100:0};
    });
    chart("wp-ch-ulp",{type:"bar",data:{labels:byUlp.map(x=>x.u),datasets:[{label:"% capaian",data:byUlp.map(x=>+x.pct.toFixed(1)),
      backgroundColor:byUlp.map(x=>x.pct>=100?"#1E9E58":(x.pct>=70?"#0A4F8F":(x.pct>0?"#E9A100":"#E2231A"))),borderRadius:4,maxBarThickness:30}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{font:{size:10},callback:v=>v+"%"}},y:{grid:{display:false},ticks:{font:{size:10.5}}}}}});

    const kel={}; rows.forEach(d=>{ const k=d.kelompok||"LAINNYA"; kel[k]=(kel[k]||0)+d.jumlah; });
    const ks=Object.keys(kel).sort((a,b)=>kel[b]-kel[a]).slice(0,8);
    chart("wp-ch-kelompok",{type:"doughnut",data:{labels:ks,datasets:[{data:ks.map(k=>+kel[k].toFixed(2)),
      backgroundColor:["#0A4F8F","#FDB913","#1E9E58","#E2231A","#5B8DB8","#8E6FB8","#E9A100","#7A8CA0"],borderWidth:2,borderColor:"#fff"}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:"56%",plugins:{legend:{position:"right",labels:{boxWidth:11,font:{size:10.5}}}}}});

    const ven={}; rows.forEach(d=>{ const v=d.vendor||"TANPA VENDOR"; ven[v]=(ven[v]||0)+d.jumlah; });
    const vs=Object.keys(ven).sort((a,b)=>ven[b]-ven[a]).slice(0,10);
    chart("wp-ch-vendor",{type:"bar",data:{labels:vs.map(v=>v.length>26?v.slice(0,25)+"…":v),datasets:[{label:"Realisasi",data:vs.map(v=>+ven[v].toFixed(2)),backgroundColor:"#5B8DB8",borderRadius:4,maxBarThickness:22}]},
      options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{font:{size:10}}},y:{grid:{display:false},ticks:{font:{size:10}}}}}});
  }
  function renderAll(){
    const rows=filtered(), rekap=buildRekap(rows);
    renderKPI(rows,rekap); renderRekap(rekap); renderDetail(rows); renderCharts(rows,rekap);
    el("wp-scope").textContent=scopeText();
  }

  function exportXls(){
    const rows=filtered(), rekap=buildRekap(rows);
    const cS=v=>`<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
    const cN=v=>`<Cell><Data ss:Type="Number">${v||0}</Data></Cell>`;
    const s1=[[cS("MONITORING REALISASI WORKPLAN — UP3 SORONG 2026")],[cS(scopeText())],[cS("")],
      [cS("Kelompok"),cS("Lead Measure"),cS("Satuan"),cS("Target"),cS("Realisasi"),cS("Deviasi"),cS("% Capaian")]];
    groupOf(rekap).forEach(g=>{
      s1.push([cS("KELOMPOK: "+g.kelompok)]);
      g.rows.forEach(r=>s1.push([cS(r.kelompok),cS(r.lm),cS(r.satuan),cN(+r.target.toFixed(2)),cN(+r.real.toFixed(2)),cN(+(r.real-r.target).toFixed(2)),cN(r.target>0?+((r.real/r.target)*100).toFixed(1):0)]));
      const gt=g.rows.reduce((a,r)=>a+r.target,0), gr=g.rows.reduce((a,r)=>a+r.real,0);
      s1.push([cS(""),cS("Subtotal "+g.kelompok),cS(""),cN(+gt.toFixed(2)),cN(+gr.toFixed(2)),cN(+(gr-gt).toFixed(2)),cN(gt>0?+((gr/gt)*100).toFixed(1):0)]);
      s1.push([cS("")]);
    });
    const s2=[[cS("Tanggal"),cS("Bulan"),cS("ULP"),cS("Penyulang"),cS("Kelompok"),cS("Lead Measure"),cS("Jumlah"),cS("Satuan"),cS("Mitra/Vendor")]];
    rows.forEach(d=>s2.push([cN(d.tgl),cS(d.bulan>=0?MONTHS[d.bulan]:""),cS(d.ulp),cS(d.penyulang),cS(d.kelompok),cS(d.lm),cN(+d.jumlah.toFixed(2)),cS(d.satuan),cS(d.vendor)]));
    const sh=(nm,rr)=>'<Worksheet ss:Name="'+nm+'"><Table>'+rr.map(r=>"<Row>"+r.join("")+"</Row>").join("")+'</Table></Worksheet>';
    const xml='<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'+sh("Rekap Workplan",s1)+sh("Detail Realisasi",s2)+'</Workbook>';
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["\ufeff",xml],{type:"application/vnd.ms-excel;charset=utf-8"}));
    a.download="Workplan_"+state.ulp.replace(/\s+/g,"-")+"_"+(state.sem!==SEMS[0]?(state.sem===SEMS[1]?"SEM1":"SEM2")+"_":"")+state.bulan.replace(/\s+/g,"-")+"_2026.xls";
    document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  }

  function fillSelects(){
    const opt=(v,sel)=>`<option value="${esc(v)}"${v===sel?" selected":""}>${esc(v)}</option>`;
    const ulpList=["SEMUA ULP"].concat(ULPS.filter(u=>REAL.some(d=>d.ulp===u)||TARGET.some(t=>t.tg[u]>0)));
    el("wp-f-ulp").innerHTML=ulpList.map(v=>opt(v,state.ulp)).join("");
    el("wp-f-sem").innerHTML=SEMS.map(v=>opt(v,state.sem)).join("");
    el("wp-f-bulan").innerHTML=["SEMUA BULAN"].concat(MONTHS.filter((m,i)=>inSem(i))).map(v=>opt(v,state.bulan)).join("");
    const kl=KEL_ORDER.filter(k=>TARGET.some(t=>t.kelompok===k)||REAL.some(d=>d.kelompok===k));
    el("wp-f-kelompok").innerHTML=["SEMUA"].concat(kl).map(v=>opt(v,state.kelompok)).join("");
    const ven=[...new Set(REAL.map(d=>d.vendor))].filter(Boolean).sort();
    el("wp-f-vendor").innerHTML=["SEMUA"].concat(ven).map(v=>opt(v,state.vendor)).join("");
  }

  async function init(){
    if(loaded){ renderAll(); return; }
    const src=el("wp-source"); if(src) src.innerHTML=`<span class="wp-pill loading">Memuat data workplan dari Google Sheet…</span>`;
    const [tg,rl]=await Promise.all([grab(URL_TARGET),grab(URL_REAL)]);
    TARGET=parseTarget(tg); REAL=parseReal(rl);
    loaded=true;
    if(src) src.innerHTML= REAL.length
      ? `<span class="wp-pill live">● Data live</span><span class="wp-pill">4 ULP (tanpa Fakfak &amp; Kaimana)</span><span class="wp-pill">${fmt(REAL.length)} entri realisasi · ${TARGET.length} lead measure bertarget</span>`
      : `<span class="wp-pill warn">Data realisasi tidak dapat dimuat — periksa koneksi / akses spreadsheet</span>`;
    fillSelects();
    el("wp-f-ulp").onchange=e=>{state.ulp=e.target.value;renderAll();};
    el("wp-f-sem").onchange=e=>{state.sem=e.target.value;if(state.bulan!=="SEMUA BULAN"&&!inSem(MONTHS.indexOf(state.bulan)))state.bulan="SEMUA BULAN";fillSelects();renderAll();};
    el("wp-f-bulan").onchange=e=>{state.bulan=e.target.value;renderAll();};
    el("wp-f-kelompok").onchange=e=>{state.kelompok=e.target.value;renderAll();};
    el("wp-f-vendor").onchange=e=>{state.vendor=e.target.value;renderAll();};
    let tid; el("wp-f-q").oninput=e=>{clearTimeout(tid);const v=e.target.value;tid=setTimeout(()=>{state.q=v;renderAll();},220);};
    el("wp-reset").onclick=()=>{state.ulp="SEMUA ULP";state.sem=SEMS[0];state.bulan="SEMUA BULAN";state.kelompok="SEMUA";state.vendor="SEMUA";state.q="";el("wp-f-q").value="";fillSelects();renderAll();};
    const xb=el("wp-xls"); if(xb) xb.onclick=exportXls;
    renderAll();
  }
  return {init:init};
})();
